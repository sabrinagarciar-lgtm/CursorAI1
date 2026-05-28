# ShopEase CI/CD — Performance Summary

> **Full documentation:** [CI_CD_WORKFLOW.md](./CI_CD_WORKFLOW.md) — before/after process, setup steps, troubleshooting.

## Results at a glance

| Metric | v1 (before) | v2 (after) | Improvement |
|--------|-------------|------------|-------------|
| Critical path (cold cache) | ~4m 30s | ~2m 10s | **−52%** |
| Critical path (warm cache) | ~3m 00s | ~1m 25s | **−53%** |
| Jobs | 6 | 17 | Parallel fan-out |
| Test jobs | 2 (serial chains) | 4 (parallel) | **2× parallelism** |
| Dependency installs | 4× per run | 1× (cached) | **−75%** |
| Security scanners | 0 | 5 | Added |
| Deploy safety | Direct | Blue-green + rollback | Added |

## Quick benchmark commands

```bash
# v1 sequential simulation
time (cd 8_1_ecommerce/frontend && npm ci && npm run build && npm test)
time (cd 8_1_ecommerce/backend && pip install -r requirements.txt && pytest)

# v2 parallel backend tests
time (cd 8_1_ecommerce/backend && \
  .venv/bin/pytest -m unit -q & \
  .venv/bin/pytest -m "positive or negative" -q & \
  .venv/bin/pytest -m "security or edge" -q & wait)
```

## Measure in GitHub Actions

1. **Actions → ShopEase CI/CD** — compare run durations (cold vs. warm).
2. **Pipeline Performance Report** job — per-job results table.
3. Track cache hits in `setup-frontend` / `setup-backend` logs.

See [CI_CD_WORKFLOW.md § Measuring results](./CI_CD_WORKFLOW.md#measuring-results) for the full tracking template.
