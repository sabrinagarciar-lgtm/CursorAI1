# CursorHub — Final Assignment Platform

Unified full-stack application integrating all course exercises into a single deployable platform.

**Repository:** [github.com/sabrinagarciar-lgtm/CursorAI1/final-platform](https://github.com/sabrinagarciar-lgtm/CursorAI1/tree/main/final-platform)

## Integrated Features

| Module | Source Exercise | Route |
|--------|-----------------|-------|
| E-Commerce (shop, cart, checkout) | 8.2 | `/shop`, `/cart`, `/checkout` |
| Settings Panel | 3 | `/settings` |
| Product Search | 5 | `/search` |
| Analytics Dashboard | 4 | `/analytics` |
| Kanban Board | 7 | `/kanban` |
| Social Feed | 8.1 | `/social` |
| Ticketing System | 8.3 | `/tickets` |
| QA Metrics Dashboard | 8.1 QA | `/qa-dashboard` |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture diagram and API design.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Playwright E2E

**Backend:** Flask 3, SQLAlchemy, JWT Auth, Redis caching, Celery background tasks

**QA & DevOps:** pytest (91% coverage), Bandit security scanning, GitHub Actions CI/CD, HTML quality dashboard

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- Redis (optional — falls back to in-memory cache)

### 1. Backend

```bash
cd final-platform/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Backend runs at **http://127.0.0.1:5060**

**Demo credentials:**
- Admin: `admin@shopease.com` / `admin12345`
- Customer: `customer@shopease.com` / `customer12345`

### 2. Frontend

```bash
cd final-platform/frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend runs at **http://127.0.0.1:5180**

### 3. Redis + Celery (optional)

```bash
# Terminal 3 — Redis
redis-server

# Terminal 4 — Celery worker
cd final-platform/backend
source .venv/bin/activate
celery -A app.extensions.celery_app worker --loglevel=info
```

### Docker Compose

```bash
cd final-platform
docker compose up --build
```

## Testing

### Backend (pytest — 90%+ coverage)

```bash
cd final-platform/backend
source .venv/bin/activate
pytest --cov=app --cov-report=html:../docs/coverage-report --cov-fail-under=90
```

Coverage report: `docs/coverage-report/index.html`

### Frontend (Vitest)

```bash
cd final-platform/frontend
npm test
```

### E2E (Playwright)

```bash
cd final-platform/frontend
npx playwright install chromium
npm run test:e2e
```

## QA Automation

```bash
cd final-platform/qa-automation
npm install && npx playwright install chromium
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-qa.txt
./scripts/run-all-qa.sh
open results/dashboard.html
```

## CI/CD Pipeline

GitHub Actions workflow: [`.github/workflows/final-platform-ci-cd.yml`](../.github/workflows/final-platform-ci-cd.yml)

Pipeline stages:
1. Backend pytest + coverage gate (≥90%)
2. Bandit security scan
3. Frontend build + Vitest
4. Playwright E2E tests
5. Quality gate summary

## Deliverables

| # | Deliverable | Location |
|---|-------------|----------|
| 1 | GitHub repository | `CursorAI1/final-platform/` |
| 2 | Live demo URL | See [Deployment](#deployment) |
| 3 | README + setup | This file |
| 4 | Architecture diagram | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 5 | Test coverage report | [docs/coverage-report/](docs/coverage-report/) |
| 6 | CI/CD pipeline screenshot | [docs/screenshots/ci-cd-pipeline.png](docs/screenshots/ci-cd-pipeline.png) |
| 7 | Quality dashboard screenshot | [docs/screenshots/quality-dashboard.png](docs/screenshots/quality-dashboard.png) |
| 8 | Demo video | Record 5–10 min walkthrough of all modules |

## Deployment

### Render (recommended)

1. Create a new **Web Service** for the backend using `final-platform/backend/Dockerfile`
2. Create a **Static Site** for `final-platform/frontend/dist` after `npm run build`
3. Set environment variables: `JWT_SECRET`, `REDIS_URL`, `CELERY_BROKER_URL`

**Live demo:** Deploy to Render/Railway and update this README with your URL.

Example Render blueprint:

```yaml
# render.yaml (root of final-platform)
services:
  - type: web
    name: cursorhub-api
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    envVars:
      - key: JWT_SECRET
        generateValue: true
  - type: web
    name: cursorhub-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
```

## Project Structure

```
final-platform/
├── backend/           # Flask API (e-commerce + platform modules)
├── frontend/          # React SPA with integrated features
├── qa-automation/     # QA suite + quality dashboard
├── docs/              # Architecture, coverage, screenshots
├── docker-compose.yml
└── README.md
```

## License

Educational project — CursorAI exercise collection.
