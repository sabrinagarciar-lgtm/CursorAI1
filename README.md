# CursorAI1 — React & full-stack exercise collection

This repository holds **eight self-contained [Create React App](https://github.com/facebook/create-react-app)** projects (exercises **6.1–6.8**) plus **full-stack Flask + React applications** (exercises 7.2, 8.1, and 8.2). CRA exercises live under `exerciseN/exerciseN/` with their own `package.json`, **TypeScript** where noted, and **Tailwind CSS** on most apps.

**Common prerequisites:** [Node.js](https://nodejs.org/) 18+ and **npm** for frontend work; **Python 3.12+** for Flask backends. Several CRA exercises need `npm install --legacy-peer-deps` because **TypeScript 5** does not satisfy `react-scripts@5`’s optional peer range (install still works).

---

## Exercises

| # | Topic | Summary | README |
|---|--------|---------|--------|
| **6.1** | Product card | E-commerce **ProductCard** grid: image, copy, price, star rating, **Add to Cart**; responsive, accessible, demo screenshot. | [**Exercise 6.1 →**](exercise1/exercise1/README.md) |
| **6.2** | Navigation bar | **Navbar** with logo, links, search, user dropdown, **hamburger** / mobile drawer; sticky header and smooth scroll. | [**Exercise 6.2 →**](exercise2/exercise2/README.md) |
| **6.3** | Settings panel | Tabbed **Profile / Notifications / Privacy / Appearance** with forms, toggles, selects; **dark mode** (`class`); Playwright **e2e**. | [**Exercise 6.3 →**](exercise3/exercise3/README.md) |
| **6.4** | Analytics dashboard | KPI cards, chart placeholders, **filters** and **date range**, sortable paginated table; **dark mode**; Playwright **e2e**. | [**Exercise 6.4 →**](exercise4/exercise4/README.md) |
| **6.5** | Product search | Catalog with **search**, category & **price** filters, **sort**, **pagination**; Playwright **e2e** (app often on **3010** for tests). | [**Exercise 6.5 →**](exercise5/exercise5/README.md) |
| **6.6** | Registration wizard | Multi-step **registration** form; Playwright tests for validation, navigation, submit, **a11y** (alerts, live region); E2E uses **port 3010**. | [**Exercise 6.6 →**](exercise6/exercise6/README.md) |
| **6.7** | Kanban board | **Todo / In Progress / Done** columns; task cards (**assignee**, **due date**, **priority**); **drag-and-drop** (`@hello-pangea/dnd`); **dark mode**; Playwright **e2e** (static serve on **3027**). | [**Exercise 6.7 →**](exercise7/exercise7/README.md) |
| **6.8** | Social feed | **Feed** with **post cards**, like/comment/share/bookmark, **comment threads**, **composer**, **infinite scroll** (Intersection Observer). | [**Exercise 6.8 →**](exercise8/exercise8/README.md) |
| **7.2** | Blog platform API | Flask REST API with **PostgreSQL**, **SQLAlchemy**, **JWT auth**, **Swagger UI**, **Redis caching**, Marshmallow schemas, rate limiting, and pytest coverage. | [**Exercise 7.2 →**](7_2blog-platform-api/README.md) |
| **8.1** | E-commerce checkout | Full-stack **ShopEase** checkout: React + Vite frontend, Flask + SQLite backend, cart/discounts/payment flow, pytest + Vitest, Docker images. | [**Exercise 8.1 →**](8_1_ecommerce/README.md) |
| **8.2** | E-commerce API tests | **ShopEase** extended with **JWT auth**, user/order CRUD, role-based access, rate limiting, and a comprehensive API pytest suite. | [**Exercise 8.2 →**](8_2/README.md) |
| **CI/CD** | ShopEase pipeline | GitHub Actions workflow for **8.1**: parallel tests, dependency caching, security scans (Bandit, npm audit, Snyk), Docker + GHCR, blue-green deploy. | [**Workflow guide →**](8_1_ecommerce/docs/CI_CD_WORKFLOW.md) · [**Workflow YAML →**](.github/workflows/8_1_ecommerce-ci-cd.yml) |

CRA rows (**6.1–6.8**) link to the **main app README** inside the nested folder (`exerciseN/exerciseN/README.md`). Full-stack projects (7.2, 8.1, 8.2) are at the repo root. See [**CI performance summary →**](8_1_ecommerce/docs/CI_PERFORMANCE.md) for pipeline benchmarks.

---

## Quick start

### CRA exercises (6.1–6.8)

```bash
cd exerciseN/exerciseN    # N = 1 for 6.1, 2 for 6.2, … 8 for 6.8
npm install --legacy-peer-deps   # if npm reports peer conflicts
npm start
```

Then open [http://localhost:3000](http://localhost:3000) unless that exercise’s README specifies another port (e.g. Playwright web servers).

### Full-stack projects (7.2, 8.1, 8.2)

```bash
# Terminal 1 — backend
cd 8_1_ecommerce/backend    # or 8_2/backend or 7_2blog-platform-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py

# Terminal 2 — frontend (8.1 and 8.2 only)
cd 8_1_ecommerce/frontend   # or 8_2/frontend
npm install && npm run dev
```

See each project README for ports, test commands, and environment details.

---

## License / boilerplate

Individual apps may retain CRA boilerplate in their dependencies. This root file is maintained as an **index** for the exercise set; for framework docs see [Create React App — Getting Started](https://facebook.github.io/create-react-app/docs/getting-started).
