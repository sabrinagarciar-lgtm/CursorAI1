#!/usr/bin/env python3
"""Aggregate QA results into metrics.json and refresh dashboard.html."""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

QA_ROOT = Path(__file__).resolve().parents[1]
RESULTS = QA_ROOT / "results"
METRICS_FILE = RESULTS / "metrics.json"
DASHBOARD_SRC = Path(__file__).resolve().parent / "dashboard.html"
DASHBOARD_OUT = RESULTS / "dashboard.html"
THRESHOLDS = QA_ROOT / "performance" / "performance-thresholds.json"

TARGETS = {
    "coverage_percent": 80,
    "complexity_max": 10,
    "critical_vulnerabilities": 0,
    "response_time_p95_ms": 500,
    "error_rate_percent": 1.0,
}


def _load_json(path: Path) -> dict | list | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def _parse_junit(path: Path) -> dict:
    if not path.exists():
        return {"total": 0, "passed": 0, "failed": 0, "skipped": 0}
    root = ET.parse(path).getroot()
    if root.tag == "testsuites":
        suites = root.findall("testsuite")
    else:
        suites = [root]
    total = failed = skipped = 0
    for suite in suites:
        total += int(suite.attrib.get("tests", 0))
        failed += int(suite.attrib.get("failures", 0)) + int(suite.attrib.get("errors", 0))
        skipped += int(suite.attrib.get("skipped", 0))
    passed = max(total - failed - skipped, 0)
    return {"total": total, "passed": passed, "failed": failed, "skipped": skipped}


def _coverage_from_xml(path: Path) -> float | None:
    if not path.exists():
        return None
    root = ET.parse(path).getroot()
    line_rate = root.attrib.get("line-rate")
    if line_rate:
        return round(float(line_rate) * 100, 1)
    return None


def _eslint_summary(path: Path) -> dict:
    data = _load_json(path)
    if not data or not isinstance(data, list):
        return {"errors": 0, "warnings": 0, "files": 0}
    errors = warnings = 0
    for file in data:
        for msg in file.get("messages", []):
            if msg.get("severity") == 2:
                errors += 1
            else:
                warnings += 1
    return {"errors": errors, "warnings": warnings, "files": len(data)}


def _pylint_summary(path: Path) -> dict:
    data = _load_json(path)
    if not isinstance(data, list):
        return {"issues": 0, "score": None, "high_complexity": 0}
    high = sum(
        1
        for item in data
        if item.get("type") in ("error", "warning")
        and "too-complex" in (item.get("message-id") or "").lower()
    )
    scores = [float(item.get("score", 0)) for item in data if "score" in item]
    return {
        "issues": len(data),
        "score": round(sum(scores) / len(scores), 2) if scores else None,
        "high_complexity": high,
    }


def _radon_complexity(path: Path) -> dict:
    data = _load_json(path)
    if not isinstance(data, dict):
        return {"max_complexity": None, "average": None, "blocks_over_threshold": 0}
    blocks: list = []
    if "blocks" in data:
        blocks = data["blocks"]
    else:
        for entries in data.values():
            if isinstance(entries, list):
                blocks.extend(entries)
    complexities = [b.get("complexity", 0) for b in blocks if isinstance(b, dict) and "complexity" in b]
    if not complexities:
        return {"max_complexity": None, "average": None, "blocks_over_threshold": 0}
    threshold = TARGETS["complexity_max"]
    return {
        "max_complexity": max(complexities),
        "average": round(sum(complexities) / len(complexities), 2),
        "blocks_over_threshold": sum(1 for c in complexities if c > threshold),
    }


def _security_summary() -> dict:
    sec_dir = RESULTS / "security"
    snyk = _load_json(sec_dir / "snyk-report.json") or {}
    bandit = _load_json(sec_dir / "bandit-report.json") or {}
    zap = _load_json(sec_dir / "zap-report.json") or {}

    critical = snyk.get("critical", 0) if isinstance(snyk, dict) else 0
    high = snyk.get("high", 0) if isinstance(snyk, dict) else 0
    bandit_high = 0
    if isinstance(bandit, dict):
        for result in bandit.get("results", []):
            for issue in result.get("issues", []):
                if issue.get("issue_severity", "").upper() in ("HIGH", "CRITICAL"):
                    bandit_high += 1

    return {
        "snyk_critical": critical,
        "snyk_high": high,
        "bandit_high": bandit_high,
        "zap_skipped": bool(zap.get("skipped")),
        "total_critical": critical + bandit_high,
    }


def _k6_summary() -> dict:
    data = _load_json(RESULTS / "performance" / "k6-summary.json")
    if not isinstance(data, dict):
        return {"p95_ms": None, "error_rate_percent": None}
    metrics = data.get("metrics", {})
    p95 = metrics.get("http_req_duration", {}).get("values", {}).get("p(95)")
    failed = metrics.get("http_req_failed", {}).get("values", {}).get("rate", 0)
    return {
        "p95_ms": round(p95, 2) if p95 is not None else None,
        "error_rate_percent": round((failed or 0) * 100, 3),
    }


def _gate_status(metric: str, value, target, lower_is_better: bool = False) -> str:
    if value is None:
        return "unknown"
    if lower_is_better:
        return "pass" if value <= target else "fail"
    return "pass" if value >= target else "fail"


def build_metrics() -> dict:
    thresholds = _load_json(THRESHOLDS) or {}
    targets = {**TARGETS, **thresholds.get("targets", {})}

    junit_files = list(RESULTS.glob("**/*junit*.xml"))
    tests = {"suites": [], "total": 0, "passed": 0, "failed": 0, "skipped": 0}
    for jf in junit_files:
        suite = _parse_junit(jf)
        suite["name"] = jf.name
        tests["suites"].append(suite)
        for key in ("total", "passed", "failed", "skipped"):
            tests[key] += suite[key]

    coverage = _coverage_from_xml(RESULTS / "backend-unit-coverage.xml")
    if coverage is None:
        cov_report = RESULTS / "backend-coverage.xml"
        coverage = _coverage_from_xml(cov_report)

    eslint = _eslint_summary(RESULTS / "eslint-report.json")
    pylint = _pylint_summary(RESULTS / "pylint-report.json")
    radon = _radon_complexity(RESULTS / "radon-complexity.json")
    security = _security_summary()
    k6 = _k6_summary()

    gates = {
        "coverage": _gate_status("coverage", coverage, targets["coverage_percent"]),
        "complexity": _gate_status(
            "complexity",
            radon.get("max_complexity"),
            targets["complexity_max"],
            lower_is_better=True,
        ),
        "security_critical": _gate_status(
            "security",
            security.get("total_critical", 0),
            targets["critical_vulnerabilities"],
            lower_is_better=True,
        ),
        "response_time": _gate_status(
            "p95",
            k6.get("p95_ms"),
            targets["response_time_p95_ms"],
            lower_is_better=True,
        ),
        "error_rate": _gate_status(
            "errors",
            k6.get("error_rate_percent"),
            targets["error_rate_percent"],
            lower_is_better=True,
        ),
        "eslint": "pass" if eslint["errors"] == 0 else "fail",
    }

    overall = "pass" if all(g == "pass" for g in gates.values() if g != "unknown") else "fail"
    if any(g == "unknown" for g in gates.values()):
        overall = "partial"

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "project": "ShopEase 8_1 E-Commerce",
        "targets": targets,
        "gates": gates,
        "overall_status": overall,
        "tests": tests,
        "coverage_percent": coverage,
        "eslint": eslint,
        "pylint": pylint,
        "complexity": radon,
        "security": security,
        "performance": k6,
        "recommendations": _recommendations(gates, coverage, eslint, security, k6),
    }


def _recommendations(gates, coverage, eslint, security, k6) -> list[str]:
    recs = []
    if gates.get("coverage") == "fail":
        recs.append("Increase test coverage toward 80%+ — add cases in backend/tests and frontend Vitest.")
    if gates.get("complexity") == "fail":
        recs.append("Refactor functions with cyclomatic complexity > 10 (see radon-complexity.json).")
    if gates.get("security_critical") == "fail":
        recs.append("Remediate critical/high Snyk or Bandit findings before release.")
    if gates.get("response_time") == "fail":
        recs.append("Optimize API hot paths; p95 latency exceeds 500ms target.")
    if gates.get("error_rate") == "fail":
        recs.append("Investigate failed k6 checks — error rate above 1% threshold.")
    if eslint.get("errors", 0) > 0:
        recs.append("Fix ESLint errors in frontend/src before merge.")
    if not recs:
        recs.append("All tracked quality gates passed or are within targets. Continue scheduled regression runs.")
    return recs


def write_dashboard(metrics: dict) -> None:
    template = DASHBOARD_SRC.read_text(encoding="utf-8")
    payload = json.dumps(metrics, indent=2)
    injected = template.replace("/*__METRICS_JSON__*/", payload)
    DASHBOARD_OUT.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD_OUT.write_text(injected, encoding="utf-8")
    # Also refresh source with latest metrics for offline open
    DASHBOARD_SRC.write_text(injected, encoding="utf-8")


def main() -> int:
    RESULTS.mkdir(parents=True, exist_ok=True)
    metrics = build_metrics()
    METRICS_FILE.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    write_dashboard(metrics)
    print(f"Metrics: {METRICS_FILE}")
    print(f"Dashboard: {DASHBOARD_OUT}")
    print(f"Overall: {metrics['overall_status']}")
    return 0 if metrics["overall_status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
