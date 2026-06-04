# ShopEase CI/CD Workflow Guide

Complete documentation for the GitHub Actions pipeline that builds, tests, secures, and deploys the **8_1_ecommerce** full-stack application (React + Flask) inside the [CursorAI1](https://github.com/sabrinagarciar-lgtm/CursorAI1) monorepo.

**Workflow file:** `.github/workflows/8_1_ecommerce-ci-cd.yml`

---

## Table of contents

1. [Overview](#overview)
2. [Before: original pipeline (v1)](#before-original-pipeline-v1)
3. [After: optimized pipeline (v2)](#after-optimized-pipeline-v2)
4. [What changed and why](#what-changed-and-why)
5. [Measuring results](#measuring-results)
6. [Setup steps](#setup-steps)
7. [Repository layout](#repository-layout)
8. [Troubleshooting](#troubleshooting)

---

## Overview

| Item | Value |
|------|-------|
| Project path | `8_1_ecommerce/` |
| Frontend | React 18, Vite, Vitest, Tailwind |
| Backend | Flask 3, pytest, SQLite |
| Registry | `ghcr.io/{owner}/CursorAI1/shopease-*` |
| Triggers | Push/PR to `main` (path-filtered), manual dispatch |
| Target improvement | ~50% faster pipeline vs. v1 |

The pipeline runs on every change under `8_1_ecommerce/**` and skips unrelated monorepo changes.

### When deploy jobs run (vs skipped)

| Trigger | Build / test / security | Deploy green, health check, promote, GitHub Pages |
|---------|-------------------------|-----------------------------------------------------|
| **Pull request** to `main` | Runs | **Skipped** (by design — no production deploy from PRs) |
| **Push** to `main` | Runs | Runs (if upstream jobs succeed) |
| **workflow_dispatch** on `main` | Runs | Runs (same as push) |

If deploy jobs show **Skipped** while build and tests are green, the run was almost certainly a **pull request** check, not a merge to `main`. Merge the PR (or push directly to `main`) to execute deploy.

`build-docker` is also skipped on pull requests (`if: github.event_name != 'pull_request'`).

---

## Before: original pipeline (v1)

### Process flow

The first version used **two independent serial chains** that converged at deploy:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUSH TO main                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
           ┌─────────────────┴─────────────────┐
           ▼                                   ▼
   ┌───────────────┐                   ┌───────────────┐
   │ build-frontend│                   │ build-backend │
   │  npm ci       │                   │  pip install  │
   │  npm build    │                   │  compileall   │
   └───────┬───────┘                   └───────┬───────┘
           │ (waits)                           │ (waits)
           ▼                                   ▼
   ┌───────────────┐                   ┌───────────────┐
   │ test-frontend │                   │ test-backend  │
   │  npm ci AGAIN │                   │  pip install  │
   │  vitest       │                   │  pytest (all) │
   └───────┬───────┘                   └───────┬───────┘
           │                                   │
           └─────────────────┬─────────────────┘
                             ▼ (both must finish)
                    ┌─────────────────┐
                    │     deploy      │
                    │  GitHub Pages   │
                    │  backend webhook│
                    └─────────────────┘
```

### v1 jobs (6 total)

| # | Job | Depends on | Key steps |
|---|-----|------------|-----------|
| 1 | `build-frontend` | — | checkout → setup-node → npm ci → build → upload artifact |
| 2 | `build-backend` | — | checkout → setup-python → pip install → compileall |
| 3 | `test-frontend` | build-frontend | checkout → npm ci → vitest |
| 4 | `test-backend` | build-backend | checkout → pip install → pytest (66 tests, single job) |
| 5 | `deploy` | tests pass | download artifact → GitHub Pages → backend webhook |

### v1 characteristics

- **Caching:** npm store only (via `setup-node`); pip store only (via `setup-python`). No shared `node_modules` or `.venv` across jobs.
- **Security:** None.
- **Containers:** None.
- **Deploy:** Direct to production — no staging slot, health check, or rollback.
- **Notifications:** None.
- **Concurrency:** New pushes did not cancel in-progress runs.

### v1 estimated timing

| Phase | Duration | Notes |
|-------|----------|-------|
| build-frontend | ~40s | Full npm ci + Vite build |
| test-frontend | ~35s | Duplicate npm ci |
| build-backend | ~25s | pip install + compile |
| test-backend | ~30s | Duplicate pip install + all tests |
| deploy | ~45s | Pages + webhook |
| **Critical path** | **~2m 30s–3m 00s** | FE chain + deploy (BE chain overlaps partially) |
| **Cold cache total** | **~4m 30s** | Sum of all job wall-clock with overhead |

---

## After: optimized pipeline (v2)

### Process flow

v2 uses **parallel setup**, **fan-out** for build/test/security, and **blue-green deploy**:

```
                              PUSH / PR / manual
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                      ▼
           ┌─────────────────┐                   ┌─────────────────┐
           │ setup-frontend  │                   │ setup-backend   │
           │ cache node_mods │                   │ cache .venv+pip │
           └────────┬────────┘                   └────────┬────────┘
                    │                                      │
     ┌──────────────┼──────────────┬─────────────┬─────────┼──────────────┐
     ▼              ▼              ▼             ▼         ▼              ▼
build-frontend  test-frontend  security-FE   test-unit  test-checkout  security-BE
     │              │              │             │         test-sec-edge    │
     └──────────────┴──────────────┴─────────────┴─────────┴──────────────┘
                    │ (all must pass on main push)
                    ▼
           ┌─────────────────┐
           │  build-docker   │  ← GHA layer cache, push to GHCR
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │  deploy-green   │  ← staging slot webhook
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │  health-check   │  ← poll /api/health + /health
           └────────┬────────┘
              pass │      │ fail
                   ▼      ▼
              ┌────────┐ ┌──────────┐
              │promote │ │ rollback │
              │→ blue  │ │→ prev   │
              │+ Pages │ │  SHA    │
              └────────┘ └──────────┘

   (always) notify-slack on failure  |  pipeline-report summary
```

### v2 jobs (17 total)

| Stage | Job | Parallel with | Purpose |
|-------|-----|---------------|---------|
| Setup | `setup-frontend` | `setup-backend` | Install & cache npm deps once |
| Setup | `setup-backend` | `setup-frontend` | Create & cache Python venv once |
| Build | `build-frontend` | tests, security | Vite production build + artifact |
| Build | `build-docker` | — (after build-FE) | Push backend + frontend images to GHCR |
| Test | `test-frontend` | 3 BE test jobs | Vitest (7 tests) |
| Test | `test-backend-unit` | others | pytest `-m unit` (17 tests) |
| Test | `test-backend-checkout` | others | pytest `-m "positive or negative"` (28 tests) |
| Test | `test-backend-security-edge` | others | pytest `-m "security or edge"` (21 tests) |
| Security | `security-frontend` | tests | npm audit + Snyk |
| Security | `security-backend` | tests | Bandit + pip-audit + Snyk |
| Deploy | `deploy-green` | — | Deploy to green slot |
| Deploy | `health-check` | — | Poll green URLs (12 retries × 5s) |
| Deploy | `promote` | — | Promote to blue (production webhook) |
| Deploy | `deploy-github-pages` | — | Publish frontend artifact to GitHub Pages |
| Deploy | `rollback` | — | Auto-rollback if health fails |
| Monitor | `notify-slack` | always() | Slack alert on any failure |
| Monitor | `pipeline-report` | always() | Job results in Actions summary |

### v2 estimated timing

| Phase | Duration (warm cache) | Notes |
|-------|----------------------|-------|
| setup (parallel) | ~20s | Cache hit skips install |
| parallel fan-out | ~25–40s | Longest of build/test/security jobs |
| build-docker | ~20s | With GHA layer cache |
| deploy + health | ~30s | Green deploy + polling |
| **Critical path** | **~1m 25s** | ~53% faster than v1 warm |
| **Cold cache** | **~2m 10s** | ~52% faster than v1 cold |

---

## What changed and why

### Summary comparison

| Area | v1 (before) | v2 (after) | Benefit |
|------|-------------|------------|---------|
| **Jobs** | 6 | 17 | Finer parallelism & gates |
| **Dependency install** | 4× per run | 1× cached, restored everywhere | −30–45s |
| **Test execution** | 2 serial jobs | 4 parallel jobs | −25–35s backend wall-clock |
| **Security** | None | npm audit, Bandit, pip-audit, Snyk | Supply-chain + SAST coverage |
| **Docker** | None | Multi-stage images + GHA cache | Reproducible deploys, −40–60s rebuild |
| **Deploy strategy** | Direct | Blue-green + health + rollback | Zero-downtime, safer releases |
| **Alerting** | None | Slack + Actions summary | Faster incident response |
| **Concurrency** | None | Cancel superseded runs | Saves runner minutes |

### Optimization 1 — Dependency caching

**Before:** Each job ran a fresh `npm ci` or `pip install`.

**After:**
- `actions/cache@v4` stores `8_1_ecommerce/frontend/node_modules` keyed by `package-lock.json` hash.
- Virtualenv at `8_1_ecommerce/backend/.venv` + `~/.cache/pip` keyed by `requirements.txt` hash.
- Downstream jobs restore cache; install only runs on cache miss.

### Optimization 2 — Parallel test sharding

**Before:** Single `test-backend` job ran all 66 pytest tests sequentially (~30s).

**After:** Three backend jobs split by pytest markers defined in `backend/pytest.ini`:

| Marker | Test file(s) | Tests |
|--------|--------------|-------|
| `unit` | `test_unit.py` | 17 |
| `positive`, `negative` | `test_positive.py`, `test_negative.py` | 28 |
| `security`, `edge` | `test_security.py`, `test_edge_cases.py` | 21 |

Wall-clock = duration of the slowest shard (~12s) instead of the sum.

### Optimization 3 — Security scanning (parallel, not blocking path)

Scans run alongside tests — they do not extend the critical path unless they are the slowest job.

| Tool | Stack | Scan type |
|------|-------|-----------|
| `npm audit --audit-level=high` | Frontend | Dependency vulnerabilities |
| `bandit -r app -ll` | Backend | SAST (Python) |
| `pip-audit` | Backend | Python dependency CVEs |
| Snyk (`snyk/actions`) | Both | SCA (optional, needs token) |

Bandit JSON reports are uploaded as artifacts for 7 days.

### Optimization 4 — Docker layer caching

**New files:**
- `8_1_ecommerce/docker/Dockerfile.backend` — Flask + gunicorn, `/api/health` healthcheck
- `8_1_ecommerce/docker/Dockerfile.frontend` — nginx serving Vite build
- `8_1_ecommerce/docker/nginx.conf` — SPA routing + `/health` endpoint

BuildKit caches layers via:
```yaml
cache-from: type=gha,scope=shopease-backend
cache-to: type=gha,mode=max,scope=shopease-backend
```

Images tagged `:green-{sha}` and rolling `:green` for staging.

### Optimization 5 — Blue-green deployment

| Step | Script | Action |
|------|--------|--------|
| 1 | `.github/scripts/blue-green-deploy.sh` | POST to green webhook with new image tags |
| 2 | `.github/scripts/health-check.sh` | Curl green backend + frontend health URLs |
| 3 | `.github/scripts/promote-deployment.sh` | Promote green → blue production on success |
| 4 | `.github/scripts/rollback.sh` | Redeploy `PREVIOUS_BLUE_SHA` on health failure |

**New backend route:** `GET /api/health` → `{"status":"ok","service":"shopease-backend"}`

### Optimization 6 — Monitoring & alerting

- **`notify-slack`:** Sends JSON payload to Slack Incoming Webhook when any job fails.
- **`pipeline-report`:** Writes a markdown table of all job results to the GitHub Actions run summary.

### Optimization 7 — Concurrency control

```yaml
concurrency:
  group: shopease-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Pushing again while a run is in progress cancels the stale run, saving minutes and avoiding race conditions on deploy.

---

## Measuring results

### In GitHub Actions (recommended)

1. Open **Actions → ShopEase CI/CD** in the CursorAI1 repo.
2. Compare run durations:
   - **Run 1 (cold cache):** First run after dependency change — note total time.
   - **Run 2 (warm cache):** Re-run workflow (`workflow_dispatch`) — expect ~50% reduction.
3. Open the **Pipeline Performance Report** job summary for per-job pass/fail table.
4. Inspect individual job durations in the run timeline:
   - `test-backend-*` jobs should finish in parallel (~10–15s each).
   - `setup-*` jobs should show cache hit in logs (`Cache restored`).

### Metrics to track

| Metric | Where to find it | v1 baseline | v2 target |
|--------|------------------|-------------|-----------|
| Total workflow duration | Run header | ~4m 30s cold | ~2m 10s cold |
| Critical path | Longest dependency chain | ~3m 00s | ~1m 25s warm |
| npm install count | Job logs | 2× per run | 0–1× (cache hit) |
| pip install count | Job logs | 2× per run | 0–1× (cache hit) |
| Test wall-clock | Max of 4 test jobs | ~65s combined serial | ~15s parallel |
| Docker build | `build-docker` job | N/A | ~20s warm / ~90s cold |

### Local benchmarking

From the repo root (`CursorAI1/`):

```bash
# ── Simulate v1 (sequential) ──
echo "=== v1 frontend chain ==="
time (cd 8_1_ecommerce/frontend && npm ci && npm run build && npm test)

echo "=== v1 backend chain ==="
time (cd 8_1_ecommerce/backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/pytest)

# ── Simulate v2 (parallel backend tests) ──
echo "=== v2 parallel backend tests ==="
time (cd 8_1_ecommerce/backend && \
  .venv/bin/pytest -m unit -q & \
  .venv/bin/pytest -m "positive or negative" -q & \
  .venv/bin/pytest -m "security or edge" -q & \
  wait)
```

### Recording results template

| Run # | Date | Cache | Duration | Notes |
|-------|------|-------|----------|-------|
| 1 | | Cold | | First push with v2 workflow |
| 2 | | Warm | | Re-run via workflow_dispatch |
| 3 | | Warm | | After dependency bump |

---

## Setup steps

### Step 1 — Push the workflow

The workflow lives at the **monorepo root**, not inside `8_1_ecommerce/`:

```
CursorAI1/
├── .github/
│   ├── workflows/
│   │   └── 8_1_ecommerce-ci-cd.yml
│   └── scripts/
│       ├── blue-green-deploy.sh
│       ├── health-check.sh
│       ├── promote-deployment.sh
│       └── rollback.sh
└── 8_1_ecommerce/
    ├── frontend/
    ├── backend/
    └── docker/
```

Push to `main` with a Personal Access Token that includes the **`workflow`** scope (required to create/update workflow files).

```bash
cd CursorAI1
git add .github/ 8_1_ecommerce/
git commit -m "Add optimized ShopEase CI/CD pipeline"
git push origin main
```

### Step 2 — Enable GitHub Pages (required)

The `deploy-github-pages` job calls `actions/configure-pages@v4`. If Pages is not enabled, that step fails with **Get Pages site failed … HttpError: Not Found**.

1. Go to **Settings → Pages** in the CursorAI1 repo.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Save (no branch/folder selection is needed for Actions-based deploys).
4. Re-run the failed workflow (or push to `main` again).

**Optional — enable Pages from the workflow:** add a repository secret `PAGES_ENABLEMENT_TOKEN` containing a fine-grained PAT (or classic PAT) with **Pages: Read and write** and **Administration: Read** on this repo. The workflow passes `enablement: true` to `configure-pages` when that secret is set.

After Pages is enabled, the `deploy-github-pages` job uploads the `frontend-dist` artifact and deploys via `actions/deploy-pages@v4`.

### Step 3 — Configure GitHub Environments

Create two environments under **Settings → Environments**:

| Environment | Used by | Suggested protection |
|-------------|---------|---------------------|
| `production-green` | `deploy-green` | Optional — no reviewers needed |
| `production` | `promote` | Recommended — require reviewer for production |

### Step 4 — Add repository secrets

Go to **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Required | Description |
|--------|----------|-------------|
| `SLACK_WEBHOOK_URL` | Optional | Slack Incoming Webhook for failure alerts |
| `SNYK_TOKEN` | Optional | [Snyk API token](https://snyk.io/account) — scans skipped if unset |
| `DEPLOY_WEBHOOK_GREEN` | For deploy | Webhook URL to deploy green/staging slot |
| `DEPLOY_WEBHOOK_BLUE` | For deploy | Webhook URL to promote or rollback production |
| `GREEN_BACKEND_URL` | For deploy | e.g. `https://green-api.example.com/api/health` |
| `GREEN_FRONTEND_URL` | For deploy | e.g. `https://green.example.com/health` |

`GITHUB_TOKEN` is provided automatically for GHCR push (used by `build-docker`).

### Step 5 — Add repository variable

Go to **Settings → Secrets and variables → Actions → Variables**:

| Variable | Description |
|----------|-------------|
| `PREVIOUS_BLUE_SHA` | Git SHA of last successful production deploy (used for rollback). Update after each successful promote. |

### Step 6 — Configure Slack notifications

1. In Slack, create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) for your channel.
2. Paste the webhook URL into the `SLACK_WEBHOOK_URL` secret.
3. On any pipeline failure, `notify-slack` posts a message with a link to the failed run.

Example alert:
```
❌ ShopEase CI/CD failed on `sabrinagarciar-lgtm/CursorAI1` (`main`) by your-username
View run
```

### Step 7 — Configure Snyk (optional)

1. Create a free account at [snyk.io](https://snyk.io).
2. Copy your API token → add as `SNYK_TOKEN` secret.
3. Both `security-frontend` and `security-backend` jobs will run Snyk scans at `--severity-threshold=high`.

### Step 8 — Configure deployment webhooks

Your hosting provider (Render, Railway, Fly.io, custom script) should expose webhooks that accept JSON:

**Green deploy payload:**
```json
{
  "ref": "<commit-sha>",
  "slot": "green",
  "backend": "ghcr.io/owner/CursorAI1/shopease-backend:green-<sha>",
  "frontend": "ghcr.io/owner/CursorAI1/shopease-frontend:green-<sha>"
}
```

**Promote / rollback payload:**
```json
{
  "ref": "<commit-sha>",
  "slot": "blue",
  "promote": true,
  "backend": "ghcr.io/owner/CursorAI1/shopease-backend:blue-<sha>",
  "frontend": "ghcr.io/owner/CursorAI1/shopease-frontend:blue-<sha>"
}
```

If webhooks are not configured, deploy scripts log a message and exit successfully (pipeline still validates build + test + security).

### Step 9 — Manual trigger (verify setup)

1. Go to **Actions → ShopEase CI/CD → Run workflow**.
2. Select branch `main` → **Run workflow**.
3. Confirm all jobs pass on a PR before relying on deploy jobs.

### Step 10 — PR vs. main behavior

| Event | Build | Test | Security | Docker push | Deploy |
|-------|-------|------|----------|-------------|--------|
| Pull request | ✅ | ✅ | ✅ | ❌ skipped | ❌ skipped |
| Push to `main` | ✅ | ✅ | ✅ | ✅ | ✅ full blue-green |
| `workflow_dispatch` | ✅ | ✅ | ✅ | ✅ (not PR) | ✅ on main only |

---

## Repository layout

```
8_1_ecommerce/
├── frontend/
│   ├── package.json          # build, test scripts
│   ├── package-lock.json     # npm cache key
│   └── src/
├── backend/
│   ├── requirements.txt      # pip cache key
│   ├── pytest.ini            # test markers for sharding
│   ├── app/
│   │   └── routes/health.py  # /api/health endpoint
│   └── tests/
│       ├── test_unit.py          @pytest.mark.unit
│       ├── test_positive.py      @pytest.mark.positive
│       ├── test_negative.py      @pytest.mark.negative
│       ├── test_security.py      @pytest.mark.security
│       └── test_edge_cases.py    @pytest.mark.edge
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
└── docs/
    ├── CI_CD_WORKFLOW.md     ← this document
    └── CI_PERFORMANCE.md     ← performance metrics summary
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Push rejected for workflow file | PAT missing `workflow` scope | Regenerate token with `workflow` scope or push via GitHub UI |
| `npm audit` fails | High-severity vulnerability in deps | Run `npm audit fix` locally, or review and pin patched versions |
| Snyk step skipped | `SNYK_TOKEN` not set | Add secret (optional) |
| `build-docker` fails on GHCR | Package permissions | Ensure `packages: write` permission (already in workflow) and repo allows GITHUB_TOKEN write |
| Health check times out | Green URLs wrong or app not running | Verify `GREEN_BACKEND_URL` / `GREEN_FRONTEND_URL` secrets |
| Rollback does nothing | `PREVIOUS_BLUE_SHA` empty | Set variable to last known-good commit SHA |
| Slack not notified | Webhook not set or job skipped | Add `SLACK_WEBHOOK_URL`; check `notify-slack` job logs |
| Cache not restoring | Lock file changed | Expected on dependency updates — first run rebuilds cache |
| Tests pass locally, fail in CI | Missing venv / marker mismatch | Run `.venv/bin/pytest -m unit` etc. individually |
| `configure-pages`: **Get Pages site failed** / **Not Found** | Pages not enabled or source is not **GitHub Actions** | [Step 2 — Enable GitHub Pages](#step-2--enable-github-pages-required); or add `PAGES_ENABLEMENT_TOKEN` secret |
| Pages loads but assets 404 | Wrong Vite `base` for project Pages URL | CI sets `VITE_BASE=/<repo-name>/` (e.g. `/CursorAI1/`) on `npm run build` |

---

## Related documents

- [CI_PERFORMANCE.md](./CI_PERFORMANCE.md) — condensed metrics and benchmark commands
- [README.md](../README.md) — ShopEase application overview
