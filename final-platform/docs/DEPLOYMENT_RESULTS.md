# Deployment & Test Results

**Date:** June 5, 2026  
**Environment:** macOS local production deployment

## Deployment Status

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://127.0.0.1:5060 | ✅ Healthy (`/healthz` → `{"status":"ok"}`) |
| Frontend (production build) | http://127.0.0.1:5180 | ✅ Serving `dist/` via Vite preview |
| API proxy | `/api/*` → `:5060` | ✅ Working |

### Deploy commands used

```bash
# Backend
cd final-platform/backend && .venv/bin/python run.py

# Frontend (production)
cd final-platform/frontend && npm run build && npm run preview -- --host 127.0.0.1 --port 5180
```

Or use the helper script:

```bash
./final-platform/scripts/deploy-local.sh
```

## Playwright E2E Results

**Run date:** June 5, 2026  
**Browser:** Chromium (Playwright 1.60)  
**Duration:** ~1.9s  
**Result:** **9/9 passed (100%)**

| # | Test | Status | Duration |
|---|------|--------|----------|
| 1 | home page shows all feature modules | ✅ PASS | 138ms |
| 2 | shop page loads products | ✅ PASS | 130ms |
| 3 | product search filters work | ✅ PASS | 160ms |
| 4 | settings panel renders tabs | ✅ PASS | 113ms |
| 5 | analytics dashboard loads | ✅ PASS | 146ms |
| 6 | kanban board renders columns | ✅ PASS | 139ms |
| 7 | social feed renders | ✅ PASS | 125ms |
| 8 | tickets page allows creation | ✅ PASS | 196ms |
| 9 | navigation between modules | ✅ PASS | 252ms |

**Artifacts:**
- JSON report: `docs/playwright-results/report.json`
- HTML report: run `npx playwright show-report` from `frontend/`

## Backend pytest Results

**Result:** **158/158 passed**  
**Coverage:** **91.0%** (threshold: 90%)

**Report:** `docs/coverage-report/index.html`

## QA Dashboard (Populated)

**Generated:** June 5, 2026

| Metric | Result |
|--------|--------|
| Total tests | 166 passed, 0 failed |
| Backend unit | 158 passed |
| Integration | 6 passed |
| QA E2E (POM) | 2 passed |
| Coverage | 91.0% |
| Overall status | partial (complexity gate) |

**Open dashboard:**
```bash
open final-platform/qa-automation/results/dashboard.html
# or in browser: http://127.0.0.1:5180/qa-dashboard
```

## Cloud Deployment

For a public live URL, deploy via Render using `render.yaml`:

1. Connect GitHub repo at https://github.com/sabrinagarciar-lgtm/CursorAI1
2. Select Blueprint → `final-platform/render.yaml`
3. Update README with assigned URLs after deploy
