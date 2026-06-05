# Screenshots for Deliverables

## CI/CD Pipeline Screenshot

After pushing to GitHub, capture a screenshot from:

**GitHub → Actions → "CursorHub Platform CI/CD" → latest run**

Save as `ci-cd-pipeline.png` in this folder.

## Quality Dashboard Screenshot

Open the generated dashboard:

```bash
open final-platform/qa-automation/results/dashboard.html
```

Or view `quality-dashboard.html` in this folder. Capture a screenshot and save as `quality-dashboard.png`.

## Test Coverage Report

Open `../coverage-report/index.html` in a browser after running:

```bash
cd final-platform/backend && pytest --cov=app --cov-report=html:../docs/coverage-report
```

Current coverage: **91%** (158 tests passing).
