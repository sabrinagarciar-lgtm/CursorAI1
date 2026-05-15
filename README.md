# CursorAI1 — React exercise collection

This repository holds **eight self-contained [Create React App](https://github.com/facebook/create-react-app)** projects. Each exercise lives under `exerciseN/exerciseN/` with its own `package.json`, **TypeScript** where noted, and **Tailwind CSS** on most apps.

**Common prerequisites:** [Node.js](https://nodejs.org/) 18+ and **npm**. Several exercises need `npm install --legacy-peer-deps` because **TypeScript 5** does not satisfy `react-scripts@5`’s optional peer range (install still works).

---

## Exercises

| # | Topic | Summary | README |
|---|--------|---------|--------|
| **1** | Product card | E-commerce **ProductCard** grid: image, copy, price, star rating, **Add to Cart**; responsive, accessible, demo screenshot. | [**Exercise 1 →**](exercise1/exercise1/README.md) |
| **2** | Navigation bar | **Navbar** with logo, links, search, user dropdown, **hamburger** / mobile drawer; sticky header and smooth scroll. | [**Exercise 2 →**](exercise2/exercise2/README.md) |
| **3** | Settings panel | Tabbed **Profile / Notifications / Privacy / Appearance** with forms, toggles, selects; **dark mode** (`class`); Playwright **e2e**. | [**Exercise 3 →**](exercise3/exercise3/README.md) |
| **4** | Analytics dashboard | KPI cards, chart placeholders, **filters** and **date range**, sortable paginated table; **dark mode**; Playwright **e2e**. | [**Exercise 4 →**](exercise4/exercise4/README.md) |
| **5** | Product search | Catalog with **search**, category & **price** filters, **sort**, **pagination**; Playwright **e2e** (app often on **3010** for tests). | [**Exercise 5 →**](exercise5/exercise5/README.md) |
| **6** | Registration wizard | Multi-step **registration** form; Playwright tests for validation, navigation, submit, **a11y** (alerts, live region); E2E uses **port 3010**. | [**Exercise 6 →**](exercise6/exercise6/README.md) |
| **7** | Kanban board | **Todo / In Progress / Done** columns; task cards (**assignee**, **due date**, **priority**); **drag-and-drop** (`@hello-pangea/dnd`); **dark mode**; Playwright **e2e** (static serve on **3027`). | [**Exercise 7 →**](exercise7/exercise7/README.md) |
| **8** | Social feed | **Feed** with **post cards**, like/comment/share/bookmark, **comment threads**, **composer**, **infinite scroll** (Intersection Observer). | [**Exercise 8 →**](exercise8/exercise8/README.md) |

Each row links to the **main app README** inside the nested CRA folder (`exerciseN/exerciseN/README.md`). Parent folders (`exerciseN/README.md`) contain a short pointer and quick start.

---

## Quick start (any exercise)

```bash
cd exerciseN/exerciseN    # substitute 1–8
npm install --legacy-peer-deps   # if npm reports peer conflicts
npm start
```

Then open [http://localhost:3000](http://localhost:3000) unless that exercise’s README specifies another port (e.g. Playwright web servers).

---

## License / boilerplate

Individual apps may retain CRA boilerplate in their dependencies. This root file is maintained as an **index** for the exercise set; for framework docs see [Create React App — Getting Started](https://facebook.github.io/create-react-app/docs/getting-started).
