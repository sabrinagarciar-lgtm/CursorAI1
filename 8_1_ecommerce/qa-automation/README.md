# ShopEase QA Automation (8_1)

Complete quality automation for the **ShopEase** e-commerce application (`8_1_ecommerce`): Page Object Model E2E tests, linting, security scanning, k6 performance tests, metrics dashboard, and a single master script to run everything.

## Quality targets

| Metric | Target | Tooling |
|--------|--------|---------|
| Test coverage | ≥ 80% | pytest-cov, Vitest |
| Code complexity | &lt; 10 (cyclomatic) | ESLint `complexity`, Radon, Pylint |
| Critical vulnerabilities | 0 | Snyk, Bandit, OWASP ZAP |
| API p95 response time | &lt; 500 ms | k6 |
| Error rate (load test) | &lt; 1% | k6 |

## Directory layout

```
qa-automation/
├── tests/
│   ├── unit/               # Vitest + pytest unit runners
│   ├── integration/        # API integration tests
│   ├── e2e/                # Playwright + Page Object Model
│   └── performance/        # Pointer to k6 scripts
├── quality/                # ESLint, Pylint, Sonar config
├── security/               # ZAP, Snyk, security-scan.sh
├── performance/            # k6, Lighthouse, thresholds
├── reports/                # Dashboard + generate-report.py
└── scripts/                # run-all-qa.sh, analyze-results.py
```

## Prerequisites

- **Node.js 18+** and npm
- **Python 3.10+**
- Optional: [k6](https://k6.io/docs/get-started/installation/), [Snyk CLI](https://docs.snyk.io/snyk-cli), Docker (OWASP ZAP), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Quick start

### 1. Start the application (for E2E / ZAP / Lighthouse)

```bash
# Terminal A — backend (port 5051)
cd ../backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && python run.py

# Terminal B — frontend (port 5174)
cd ../frontend && npm ci && npm run dev
```

### 2. Install QA dependencies

```bash
cd qa-automation
npm install
npx playwright install chromium
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-qa.txt
chmod +x scripts/run-all-qa.sh security/security-scan.sh tests/unit/*.sh
```

### 3. Run the full suite

```bash
./scripts/run-all-qa.sh
```

Open the dashboard:

```bash
open results/dashboard.html   # macOS
# or reports/dashboard.html after generate-report.py
```

## Individual commands

| Task | Command |
|------|---------|
| All QA checks | `./scripts/run-all-qa.sh` |
| Unit tests only | `./scripts/run-all-qa.sh --unit-only` |
| Skip E2E | `./scripts/run-all-qa.sh --skip-e2e` |
| Skip security | `./scripts/run-all-qa.sh --skip-security` |
| E2E only | `npx playwright test` |
| ESLint | `npm run lint:frontend:check` |
| Pylint | `../backend/.venv/bin/pylint ../backend/app --rcfile=quality/pylint.rc` |
| Integration | `cd tests/integration && PYTHONPATH=../../backend ../../backend/.venv/bin/pytest` |
| Security | `./security/security-scan.sh` |
| k6 | `k6 run performance/k6-load-test.js` |
| Report + dashboard | `python reports/generate-report.py` |
| Analyze gates | `python scripts/analyze-results.py` |

## Page Object Model (E2E)

E2E tests live under `tests/e2e/`:

- **Pages:** `tests/e2e/pages/` — `ShopPage`, `CartPage`, `CheckoutPage`, `ConfirmationPage`
- **Specs:** `tests/e2e/specs/` — shop catalog and full checkout smoke flow
- **Config:** `playwright.config.ts` — base URL `http://127.0.0.1:5174`

Example flow: shop → add to cart → cart → checkout → confirmation.

## Code quality gates

- **ESLint** (`quality/eslint.config.js`) — lints `../frontend/src`, enforces complexity ≤ 10 (warn).
- **Pylint** (`quality/pylint.rc`) — lints `../backend/app`, `max-complexity=10`.
- **Sonar** (`quality/sonar-project.properties`) — SonarQube/SonarCloud project definition.
- **Radon** — cyclomatic complexity JSON in `results/radon-complexity.json`.

## Security scanning

`security/security-scan.sh` runs:

1. **Bandit** — Python SAST on `backend/app` (no token required).
2. **Snyk** — dependency scan when `SNYK_TOKEN` is set.
3. **OWASP ZAP** — Docker-based DAST when Docker is available and the app is reachable.

Configure via `security/zap-config.yaml` and `security/snyk.config`. Reports land in `results/security/`.

## Performance testing

- **k6** — `performance/k6-load-test.js` hits products, discount validation, and sampled checkouts.
- Thresholds — `performance/performance-thresholds.json` (p95 &lt; 500 ms, error rate &lt; 1%).
- **Lighthouse** — `performance/lighthouse.config.js` (optional, requires `lhci` + running frontend).

Set `API_BASE_URL` and `E2E_BASE_URL` if ports differ.

## Reports and dashboard

`reports/generate-report.py`:

- Aggregates JUnit, coverage, ESLint, Pylint, Radon, security, and k6 outputs from `results/`
- Writes `results/metrics.json` and refreshes `results/dashboard.html` with Chart.js visualizations
- Emits QA recommendations when gates fail

`scripts/analyze-results.py` prints a CI-friendly summary and exits non-zero on failed gates.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_BASE_URL` | `http://127.0.0.1:5174` | Playwright / ZAP / Lighthouse |
| `API_BASE_URL` | `http://127.0.0.1:5051` | k6 API load tests |
| `SNYK_TOKEN` | — | Snyk authenticated scans |
| `TARGET_URL` | same as E2E | OWASP ZAP target |

Copy `.env.example` to `.env` for local overrides.

## CI/CD integration

Add to your pipeline after building the app:

```yaml
- name: QA automation
  run: |
    cd 8_1_ecommerce/qa-automation
    npm ci
    npx playwright install --with-deps chromium
    python3 -m venv .venv && .venv/bin/pip install -r requirements-qa.txt
    ./scripts/run-all-qa.sh --skip-security  # or run security on staging
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

Upload `qa-automation/results/` as build artifacts (dashboard, metrics, JUnit, security JSON).

## Best practices

1. **Page Object Model** — keep selectors in `pages/`; specs describe user journeys only.
2. **Quality gates** — treat `analyze-results.py` exit code as merge criteria in CI.
3. **Performance** — run k6 on a schedule and after API changes; compare `k6-summary.json` trends.
4. **Dashboard** — review `recommendations` after each run for actionable follow-ups.
5. **Security** — keep `SNYK_TOKEN` in CI secrets; run ZAP against a deployed or locally started stack.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| E2E cannot load products | Start backend on **5051** and frontend on **5174** |
| k6 skipped | Install k6; ensure `GET /api/products` returns 200 |
| ZAP skipped | Install Docker; ensure `TARGET_URL` responds |
| Snyk skipped | `export SNYK_TOKEN=...` and install Snyk CLI |
| Empty coverage | Run `tests/unit/run-backend-unit.sh` before `generate-report.py` |
