# Exercise 6 — Registration form (Playwright E2E)

The runnable **Create React App** project is in the **`exercise6/`** subfolder.

For the feature purpose (multi-step registration, **Playwright** tests for validation, navigation, submit success/error, and **a11y** labels/live regions), **setup**, **project structure**, and a **screenshot**, see **[exercise6/README.md](exercise6/README.md)**.

Quick start — UI on port **3000**:

```bash
cd exercise6
npm install --legacy-peer-deps
npm start
```

E2E uses **`baseURL` http://localhost:3010** — in another terminal:

```bash
PORT=3010 BROWSER=none npm start
npx playwright install   # first time
npm run test:e2e
```
