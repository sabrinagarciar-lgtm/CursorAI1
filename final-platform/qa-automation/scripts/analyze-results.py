#!/usr/bin/env python3
"""Analyze QA result artifacts and print a CI-friendly summary."""
from __future__ import annotations

import json
import sys
from pathlib import Path

QA_ROOT = Path(__file__).resolve().parents[1]
RESULTS = QA_ROOT / "results"
METRICS = RESULTS / "metrics.json"


def main() -> int:
    if not METRICS.exists():
        print("ERROR: metrics.json not found. Run reports/generate-report.py first.", file=sys.stderr)
        return 2

    metrics = json.loads(METRICS.read_text(encoding="utf-8"))
    print("=" * 60)
    print(f"ShopEase QA Analysis — {metrics.get('generated_at', 'n/a')}")
    print(f"Overall status: {metrics.get('overall_status', 'unknown').upper()}")
    print("=" * 60)

    gates = metrics.get("gates", {})
    print("\nQuality gates:")
    for name, status in sorted(gates.items()):
        icon = "✓" if status == "pass" else "✗" if status == "fail" else "?"
        print(f"  [{icon}] {name}: {status}")

    tests = metrics.get("tests", {})
    print(f"\nTests: {tests.get('passed', 0)} passed, {tests.get('failed', 0)} failed, "
          f"{tests.get('skipped', 0)} skipped (total {tests.get('total', 0)})")

    cov = metrics.get("coverage_percent")
    print(f"Coverage: {cov}%" if cov is not None else "Coverage: not measured")

    perf = metrics.get("performance", {})
    if perf.get("p95_ms") is not None:
        print(f"Performance p95: {perf['p95_ms']} ms · error rate: {perf.get('error_rate_percent')}%")

    sec = metrics.get("security", {})
    print(f"Security: {sec.get('total_critical', 0)} critical-equivalent findings")

    print("\nRecommendations:")
    for rec in metrics.get("recommendations", []):
        print(f"  • {rec}")

    print("=" * 60)
    failed_gates = [k for k, v in gates.items() if v == "fail"]
    if failed_gates:
        print(f"FAILED gates: {', '.join(failed_gates)}")
        return 1
    if metrics.get("overall_status") == "pass":
        print("All quality gates passed.")
        return 0
    print("Run incomplete or partial — review dashboard.")
    return 0 if metrics.get("overall_status") != "fail" else 1


if __name__ == "__main__":
    raise SystemExit(main())
