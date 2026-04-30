# Exercise 7 — Kanban board E2E test report

**Feature:** Kanban board (search, filters, sort directory, pagination, modal, drag-and-drop columns, dark mode, simulated error)  
**Runner:** Playwright (`@playwright/test`)  
**Page object:** `e2e/pages/KanbanBoardPage.ts`  
**Spec files:** `e2e/tests/*.spec.ts` (6 files)  
**Last documented run:** 2026-04-30  

---

## How to run

```bash
cd exercise7/exercise7

# First-time / after upgrading Playwright (downloads browsers)
npm run test:e2e:install

# Full suite — headless, all configured viewports
npm run test:e2e

# Headed / single browser
npm run test:e2e:headed
npx playwright test --project=desktop-chrome
```

**Web server:** `playwright.config.ts` builds the app (`npm run build`) and serves `build/` with Python’s static HTTP server on `http://127.0.0.1:3027` (no CRA dev watcher; avoids stale-bundle issues).

---

## Latest full-matrix result

| Metric | Value |
|--------|--------|
| **Total test runs** | **894** (149 unique tests × **6** browser/viewport projects) |
| **Passed** | **894** |
| **Failed** | **0** |
| **Duration (reference)** | ~1.4–1.9 minutes (machine-dependent) |
| **Reporter** | `list` + HTML report under `playwright-report/` |

**Projects (cross-viewport):**

| Project | Viewport / device |
|---------|-------------------|
| `desktop-chrome` | 1280×720, Desktop Chrome |
| `desktop-firefox` | 1280×720, Desktop Firefox |
| `desktop-webkit` | 1280×720, Desktop Safari |
| `tablet-chrome` | 768×1024, Chrome |
| `mobile-chrome` | Pixel 5 profile |
| `mobile-webkit` | iPhone 12 profile |

---

## Test inventory (unique tests per file)

| File | Unique tests | Main areas |
|------|----------------|------------|
| `board.spec.ts` | 21 | Columns, counts, cards (title, priority, due date, overdue), hover actions, delete/add impact, dark mode on `html`, layout |
| `filters.spec.ts` | 38 | Priority / assignee dropdowns, single & combined filters, clear-all, chip visibility, priority badges on cards |
| `modal.spec.ts` | 28 | Add/edit modal open/close, Escape, backdrop (`modal-backdrop`), validation errors, create/edit flows, tags preview |
| `pagination-sort-error.spec.ts` | 9 | Matching-task directory pagination, sort options, filtered pagination counts, `?e2eError=1` + retry, empty state + no directory |
| `search.spec.ts` | 23 | Seed visibility, search by title/description/tags, case-insensitivity, no results, chips, clear |
| `viewport.spec.ts` | 30 | Same flows repeated across projects; fixed-width blocks for desktop / tablet / mobile |

**Total unique tests:** **149** → **894** runs with the 6 projects above.

---

## Scenarios documented by area

| Area | What is asserted |
|------|------------------|
| **Search** | Valid queries (title, description, tags), narrowing, clear search, no matches → zero cards, empty banner, directory hidden |
| **Filters** | Priority and assignee alone and combined, empty combinations, chips, per-column counts, “Clear all” |
| **Sort (directory)** | Title A–Z, due date ascending, created-desc; order reflected in `paginated-task-title` rows |
| **Pagination** | Page info (`Page X of Y`, task totals), Previous/Next, disabled states on first/last page |
| **Error handling** | `/?e2eError=1` shows error UI; **Retry** restores board and removes query param |
| **Modal** | Required / min-length title errors, submit/cancel/X/Escape, backdrop dismiss, create/edit tasks |
| **Board** | Three columns, DnD column structure, delete updates counts, dark class on `documentElement` |
| **Viewports** | Controls visible and flows succeed on desktop, tablet, and mobile profiles |

---

## Notes

- Install browsers before CI or a new clone: `npm run test:e2e:install` (includes **Chromium** + **chromium-headless-shell** used by headless Chrome).
- HTML report after a run: `npm run test:e2e:report` (opens `playwright-report/`).
- Failures attach screenshot, video, and trace (per `playwright.config.ts`).

This report reflects a **full pass** of all 894 Playwright runs on **2026-04-30** after the pagination/sort/error UI, modal backdrop, POM fixes, and static `build/` web server configuration described above.
