# Exercise 4 — Playwright E2E Test Report

**Application:** Analytics overview dashboard (Exercise 4)  
**Base URL:** `http://localhost:3011`  
**Test framework:** Playwright (`@playwright/test`)  
**Run mode:** Headless  
**Last full matrix run (reference):** 2026-05-05 — **132 / 132 passed** (~5 min, `CI=true npm run test:e2e`)  
**Single-project example:** `npx playwright test --project=desktop-chrome` → **22 / 22 passed** (~12 s, 6 workers)

---

## Summary

| Metric | Value |
|--------|--------|
| Scenarios (unique tests) | **22** |
| Total runs (6 browser/viewport projects) | **22 × 6 = 132** |
| Passed (last reference run) | **132** |
| Failed | **0** |
| Skipped | **0** |
| CI workers | `1` when `CI=true` (serial); local default higher for single-machine runs |

---

## How to run

```bash
cd exercise4/exercise4
npm install --legacy-peer-deps
npm run test:e2e:install          # browsers (first machine / CI image)
CI=true npm run test:e2e          # full matrix + dedicated webServer on :3011
npm run test:e2e:headed           # visible browser
npm run test:e2e:report          # open last HTML report
```

`playwright.config.ts` starts **`PORT=3011 BROWSER=none npm start`** when `CI=true` (or when no server is listening). **Exercise 5 uses port 3010** — keep both runnable in parallel.

---

## Environment

### Playwright projects

| Project | Browser / engine | Viewport (typical) |
|---------|------------------|--------------------|
| `desktop-chrome` | Chromium | 1280 × 720 |
| `desktop-firefox` | Firefox | 1280 × 720 |
| `desktop-webkit` | WebKit | 1280 × 720 |
| `tablet-chrome` | Chromium | 768 × 1024 |
| `mobile-chrome` | Pixel 5 profile | device preset |
| `mobile-webkit` | iPhone 12 profile | device preset |

### Configuration highlights

- **Headless:** `true`  
- **Screenshots / video / trace:** retained on failure  
- **Retries:** `2` when `CI=true`  
- **Synchronisation:** tests wait for `analytics-main` **`aria-busy="false"`** after filter changes (mock ~580 ms latency)

---

## Test infrastructure

### Page object — `e2e/pages/AnalyticsOverviewPage.ts`

| Member | Selector / behavior |
|--------|----------------------|
| `main` | `[data-testid="analytics-main"]` — also used for `aria-busy` |
| `heading` | `[data-testid="analytics-heading"]` |
| `searchInput` | `[data-testid="analytics-search-input"]` |
| `regionSelect` | `[data-testid="analytics-region"]` |
| `segmentSelect` | `[data-testid="analytics-segment"]` |
| `dateFrom` / `dateTo` | `[data-testid="analytics-date-from"]` / `analytics-date-to` |
| `resultCount` | `[data-testid="analytics-result-count"]` |
| `clearBtn` | `[data-testid="analytics-clear-filters"]` |
| `tableSort` | `[data-testid="analytics-table-sort"]` |
| `tablePagination` | `[data-testid="analytics-table-pagination"]` |
| `tablePrev` / `tableNext` | `analytics-table-prev` / `analytics-table-next` |
| `tablePageStatus` | `analytics-table-page-status` |
| `tableEmpty` | `[data-testid="analytics-table-empty"]` |
| `preset(id)` | `[data-testid="analytics-preset-7d\|30d\|90d"]` |
| `goto()` | `/` + `networkidle` + `waitForReady()` |
| `waitForReady()` | `aria-busy === "false"` on `main` |
| `firstDataRowRevenue()` / `firstDataRowProduct()` | First data row, columns revenue / product |

### Application hooks (under test)

- **Simulated error:** `/?analyticsError=1` → `analytics-error`, `analytics-error-retry`  
- **Table:** 5 rows per page when row count exceeds page size; row ids `analytics-row-{txn-id}`  
- **Sort options:** `date-desc` | `date-asc` | `revenue-desc` | `revenue-asc` | `product-asc`  

---

## Data reference (mock)

- **Source:** `MOCK_TRANSACTIONS` in `src/exercise4/mockData.ts` (180 generated rows, deterministic spread).  
- **Filters:** region (NA / EU / APAC / LATAM), segment (Enterprise / SMB / Self-serve), date range inclusive, search on product name or transaction id.  
- **Presets:** Last 7 / 30 / 90 days adjust `dateFrom` / `dateTo` only.

---

## Results by spec file

Each table lists the **22** scenarios once; in a full run they execute per project (×6).

### 1. Search — `e2e/tests/analytics-search.spec.ts` (3 tests)

| # | Test | Intent |
|---|------|--------|
| 1 | search with valid query narrows table rows | 90d preset; count drops; first row contains product substring |
| 2 | search with no results shows empty table state | Impossible query → empty cell, 0 matching, pagination hidden |
| 3 | clearing search restores rows | 90d → empty query → non-zero matches and visible data row |

### 2. Filters — `e2e/tests/analytics-filters.spec.ts` (4 tests)

| # | Test | Intent |
|---|------|--------|
| 1 | apply single region filter | EU; visible rows’ region column = EU |
| 2 | apply single segment filter | Enterprise; segment column matches |
| 3 | apply date range with no data shows empty state | 2099-01-01..02 → empty + 0 matching |
| 4 | apply multiple filters (region + segment) | APAC + SMB; both columns per visible row |

### 3. Clear all — `e2e/tests/analytics-clear.spec.ts` (2 tests)

| # | Test | Intent |
|---|------|--------|
| 1 | clear is disabled in default state | No deviation from defaults |
| 2 | clear resets region, segment, search, sort, and restores counts | After 7d + search + NA + Self-serve + product-asc → clear → defaults + `date-desc` + clear disabled |

### 4. Pagination & table sort — `e2e/tests/analytics-pagination-sort.spec.ts` (6 tests)

| # | Test | Intent |
|---|------|--------|
| 1 | pagination appears when more than one page of rows | 90d; nav + “Page 1 of” |
| 2 | next and previous navigate between pages | First row `data-testid` changes page 1↔2 |
| 3 | previous disabled on first page | Prev disabled, next enabled |
| 4 | sort by revenue ascending vs descending changes first-row revenue | `revenue-desc` first value > `revenue-asc` |
| 5 | sort by product A–Z orders alphabetically on first page | First vs second product name order |
| 6 | changing filters resets table to page 1 | Page 2 → filter EU → back to page 1 |

### 5. Error state — `e2e/tests/analytics-errors.spec.ts` (3 tests)

| # | Test | Intent |
|---|------|--------|
| 1 | analyticsError query shows failure UI | `/?analyticsError=1` |
| 2 | try again reloads working dashboard | Retry → heading + search + ready |
| 3 | error view hides dashboard controls | `analytics-main` not visible |

### 6. Viewport — `e2e/tests/analytics-viewport.spec.ts` (4 tests)

| # | Test | Intent |
|---|------|--------|
| 1 | heading and filters visible | Core chrome on all project viewports |
| 2 | preset and clear controls usable | 30d + search enables clear |
| 3 | sort control visible | Table sort select present |
| 4 | main grid fits viewport width | Desktop 1280×720 bounding box |

---

## Acceptance mapping

| Requirement | Coverage |
|-------------|----------|
| Search valid / no results | `analytics-search.spec.ts` |
| Single & multiple filters; region, date, segment | `analytics-filters.spec.ts` |
| Clear all | `analytics-clear.spec.ts` |
| Pagination | `analytics-pagination-sort.spec.ts` (Table pagination) |
| Sort criteria | `analytics-pagination-sort.spec.ts` (Table sort) |
| Empty states | Search + filters date-range tests |
| Error handling | `analytics-errors.spec.ts` |
| Headless | `playwright.config.ts` `headless: true` |
| Multiple viewports | Six projects |

---

## Updating this document

After a CI or release run, refresh **Summary** and **Last full matrix run** with:

```bash
CI=true npm run test:e2e
```

Optionally attach HTML report path: `playwright-report/index.html`.
