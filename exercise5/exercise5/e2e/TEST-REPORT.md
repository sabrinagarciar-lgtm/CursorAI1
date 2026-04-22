# Exercise 5 — Playwright E2E Test Report

**Application:** Product Search & Filter (Exercise 5)
**Base URL:** `http://localhost:3010`
**Test framework:** Playwright v1.x (`@playwright/test`)
**Run mode:** Headless
**Date run:** 2026-04-20
**Command:** `npx playwright test --project desktop-chrome`

---

## Summary

| Metric | Value |
|---|---|
| Total tests (Chrome project) | **92** |
| Passed | **92** |
| Failed | **0** |
| Skipped | **0** |
| Duration | **~19 seconds** |
| Workers | 6 (parallel) |

> Full cross-browser run (6 projects × 92 tests) also executed: **552 / 552 passed** in ~2 minutes.

---

## Environment

### Playwright Projects

| Project | Browser | Viewport |
|---|---|---|
| `desktop-chrome` | Chromium | 1280 × 720 |
| `desktop-firefox` | Firefox | 1280 × 720 |
| `desktop-webkit` | WebKit (Safari) | 1280 × 720 |
| `tablet-chrome` | Chromium | 768 × 1024 |
| `mobile-chrome` | Pixel 5 | 393 × 851 |
| `mobile-webkit` | iPhone 12 | 390 × 844 |

### Configuration
- **Headless:** true
- **Screenshots:** on failure only
- **Video:** retained on failure
- **Trace:** retained on failure
- **Retries (CI):** 2

---

## Test Infrastructure

### Page Object Model — `e2e/pages/ProductCatalogPage.ts`

Centralises all selector look-ups and reusable interactions so individual specs stay concise.

| Member | Type | Purpose |
|---|---|---|
| `searchInput` | Locator | `[data-testid="search-input"]` |
| `sortSelect` | Locator | `[data-testid="sort-select"]` |
| `clearFiltersBtn` | Locator | `[data-testid="clear-filters"]` |
| `resultCount` | Locator | `[data-testid="result-count"]` |
| `emptyState` | Locator | `[data-testid="product-catalog-empty"]` |
| `paginationNav` | Locator | `[data-testid="pagination-nav"]` |
| `prevBtn` | Locator | `[data-testid="pagination-prev"]` |
| `nextBtn` | Locator | `[data-testid="pagination-next"]` |
| `paginationStatus` | Locator | `[data-testid="pagination-status"]` |
| `categoryFilter(c)` | Method | `[data-testid="filter-category-{c}"]` |
| `priceFilter(b)` | Method | `[data-testid="filter-price-{b}"]` |
| `productCardById(id)` | Method | `[data-testid="product-card-{id}"]` |
| `getVisibleTitles()` | Async method | All `h2` titles inside visible product cards |
| `goto()` | Async method | Navigate to `/` and wait for `networkidle` |

---

## Catalog Data Reference

18 products, 6 per page (3 pages in default order).

### Category breakdown
| Category | Count | Products |
|---|---|---|
| Electronics | 5 | Wireless Bluetooth Headphones ($149.99), Portable Power Bank ($49.99), USB-C Hub 7-in-1 ($39.99), Portable Bluetooth Speaker ($79.99), Fitness Tracker Band ($119.00) |
| Apparel | 3 | Organic Cotton T-Shirt ($34.99), Fleece Hoodie ($64.99), Athletic Shorts ($44.00) |
| Home | 4 | Ceramic Coffee Mug ($24.99), LED Desk Lamp ($45.00), Ceramic Planter Set ($32.00), Merino Wool Throw ($88.00) |
| Sports | 3 | Running Shoes ($129.99), Yoga Mat Pro ($38.00), Insulated Water Bottle ($22.00) |
| Accessories | 3 | Minimalist Watch ($89.00), Travel Backpack ($72.00), Polarized Sunglasses ($59.00) |

### Price bracket breakdown
| Bracket | Count | Products |
|---|---|---|
| Under $50 | 9 | Mug, T-Shirt, Water Bottle, Planter, Yoga Mat, Athletic Shorts, LED Lamp, USB-C Hub, Power Bank |
| $50 – $100 | 6 | Watch, Fleece Hoodie, Backpack, Sunglasses, BT Speaker, Merino Throw |
| Over $100 | 3 | Headphones, Running Shoes, Fitness Tracker |

### Default page layout (Featured order)
| Page | Products |
|---|---|
| Page 1 | Wireless Bluetooth Headphones, Minimalist Watch, Organic Cotton T-Shirt, Portable Power Bank, Ceramic Coffee Mug, Running Shoes |
| Page 2 | Yoga Mat Pro, LED Desk Lamp, USB-C Hub 7-in-1, Travel Backpack, Polarized Sunglasses, Fleece Hoodie |
| Page 3 | Insulated Water Bottle, Portable Bluetooth Speaker, Ceramic Planter Set, Athletic Shorts, Fitness Tracker Band, Merino Wool Throw |

---

## Test Results by Spec File

---

### 1. Search — `e2e/tests/search.spec.ts`
**13 tests | 13 passed | 0 failed**

#### Initial State
| # | Test | Result | Assertion |
|---|---|---|---|
| 1 | loads with full catalog visible | PASS | 18 products, two specific products visible, empty state absent |
| 2 | page title is present | PASS | `<h1>Product Showcase</h1>` visible |
| 3 | search input is focused and accessible | PASS | Input visible, placeholder matches `/Search by title or description/i` |

#### Search with Valid Query
| # | Test | Result | Assertion |
|---|---|---|---|
| 4 | search with valid query — title match | PASS | Query `"headphones"` → 1 result, Wireless Bluetooth Headphones visible, empty state absent |
| 5 | search with valid query — description match | PASS | Query `"noise cancellation"` → 1 result (matches description text) |
| 6 | search is case-insensitive | PASS | Query `"RUNNING"` (uppercase) → Running Shoes found |
| 7 | search returns multiple matches | PASS | Query `"portable"` → 2 results (Power Bank + BT Speaker) |
| 8 | search narrows results dynamically as user types | PASS | Count after `"ce"` ≤ count after `"c"` |
| 9 | clearing search restores full catalog | PASS | Clear input after filtering → back to 18 products |

#### Search with No Results
| # | Test | Result | Assertion |
|---|---|---|---|
| 10 | search with no results shows empty state | PASS | Query `"xyznonexistent999"` → empty state visible, 0 products found |
| 11 | no results state includes helpful message | PASS | "Try a different search or clear filters" text visible |
| 12 | pagination is hidden when search yields zero results | PASS | Pagination nav not visible |
| 13 | pagination resets to page 1 after a new search | PASS | Navigate to page 2, then search → resets to single-result view |

---

### 2. Filters — `e2e/tests/filters.spec.ts`
**25 tests | 25 passed | 0 failed**

#### Apply Single Filter — Category
| # | Test | Result | Assertion |
|---|---|---|---|
| 14 | Electronics filter shows only electronics | PASS | 5 products; Headphones & Power Bank visible; T-Shirt & Running Shoes hidden |
| 15 | Apparel filter shows only apparel | PASS | 3 products; T-Shirt, Hoodie, Athletic Shorts visible; Headphones hidden |
| 16 | Home filter shows only home products | PASS | 4 products; Mug, Lamp, Planter, Throw all visible |
| 17 | Sports filter shows only sports products | PASS | 3 products; Running Shoes, Yoga Mat, Water Bottle visible |
| 18 | Accessories filter shows only accessories | PASS | 3 products; Watch, Backpack, Sunglasses visible |
| 19 | unchecking a filter restores previous results | PASS | Sports check → 3 products; uncheck → 18 products |

#### Apply Single Filter — Price
| # | Test | Result | Assertion |
|---|---|---|---|
| 20 | price filter — under $50 shows 9 products | PASS | 9 results; Headphones hidden; Power Bank visible |
| 21 | price filter — $50–$100 shows 6 products | PASS | 6 results; Watch & BT Speaker visible; Headphones hidden |
| 22 | price filter — over $100 shows 3 products | PASS | 3 results; Headphones, Running Shoes, Fitness Tracker all visible |

#### Apply Multiple Filters
| # | Test | Result | Assertion |
|---|---|---|---|
| 23 | two categories ORed together | PASS | Apparel + Sports = 6 products; T-Shirt & Running Shoes visible; Headphones hidden |
| 24 | Electronics category + under-$50 price bracket | PASS | 2 results (Power Bank + USB-C Hub); Headphones & Fitness Tracker hidden |
| 25 | Home category + $50–$100 price bracket | PASS | 1 result (Merino Throw $88) |
| 26 | Apparel + over $100 yields empty state | PASS | No Apparel item costs >$100 → empty state, 0 products |
| 27 | search + single category filter combine | PASS | `"cotton"` + Apparel → 1 result (Organic Cotton T-Shirt) |
| 28 | search + price filter combine | PASS | `"speaker"` + $50–$100 → 1 result (Portable Bluetooth Speaker) |
| 29 | three categories selected simultaneously | PASS | Electronics + Apparel + Home = 12 products |
| 30 | multiple price brackets ORed together | PASS | Under $50 + Over $100 = 12 products |

#### Clear All Filters
| # | Test | Result | Assertion |
|---|---|---|---|
| 31 | clear button is disabled when no filters are active | PASS | Button disabled on load |
| 32 | clear button enables when search has text | PASS | Type `"mug"` → button enabled |
| 33 | clear button enables when category filter is active | PASS | Check Sports → button enabled |
| 34 | clear all after search restores full catalog | PASS | Search `"running"` → clear → search empty, 18 products |
| 35 | clear all after category filter restores full catalog | PASS | Apparel checked → clear → Apparel unchecked, 18 products |
| 36 | clear all resets sort to Featured | PASS | Set price-asc, search "watch" → clear → sort value = `featured` |
| 37 | clear all after complex state (search + category + price) | PASS | All three active → clear → all inputs reset, 18 products, sort = featured |
| 38 | clear all resets pagination to page 1 | PASS | Go to page 2, check Accessories → clear → back to page 1 of 3 |

---

### 3. Sorting — `e2e/tests/sorting.spec.ts`
**19 tests | 19 passed | 0 failed**

#### Sort Control
| # | Test | Result | Assertion |
|---|---|---|---|
| 39 | sort dropdown is visible and labelled | PASS | Select visible; `<label>Sort</label>` present |
| 40 | all five sort options are present | PASS | Featured, Price Low→High, Price High→Low, Rating High→Low, Name A→Z all in DOM |
| 41 | default sort is Featured | PASS | `sortSelect.value === "featured"` on load |

#### Sort: Price Low to High
| # | Test | Result | Assertion |
|---|---|---|---|
| 42 | first product on page 1 is cheapest ($22) | PASS | Insulated Water Bottle ($22) first |
| 43 | first six products are ordered ascending | PASS | Water Bottle, Mug, Planter, T-Shirt, Yoga Mat, USB-C Hub in order |
| 44 | last page ends with most expensive | PASS | Wireless Bluetooth Headphones ($149.99) last on page 3 |

#### Sort: Price High to Low
| # | Test | Result | Assertion |
|---|---|---|---|
| 45 | first product on page 1 is most expensive ($149.99) | PASS | Wireless Bluetooth Headphones first |
| 46 | first six products are ordered descending | PASS | Headphones, Running Shoes, Fitness Tracker in top 3 |

#### Sort: Rating High to Low
| # | Test | Result | Assertion |
|---|---|---|---|
| 47 | first two products have 4.9 rating | PASS | Ceramic Coffee Mug or Merino Wool Throw (both 4.9★) in top 2 |
| 48 | lowest-rated products (4.1) are on the last page | PASS | Fitness Tracker Band (4.1★) visible on page 3 |

#### Sort: Name A to Z
| # | Test | Result | Assertion |
|---|---|---|---|
| 49 | first product is Athletic Shorts | PASS | `titles[0] === "Athletic Shorts"` |
| 50 | first page is in strict alphabetical order | PASS | Athletic Shorts → Ceramic Coffee Mug → Ceramic Planter Set → Fitness Tracker Band → Fleece Hoodie → Insulated Water Bottle |
| 51 | last page ends with W (Wireless or Yoga) | PASS | Last item is Wireless Bluetooth Headphones or Yoga Mat Pro |

#### Sort: Featured (Default)
| # | Test | Result | Assertion |
|---|---|---|---|
| 52 | switching to price-asc then back to featured restores catalog order | PASS | First product returns to Wireless Bluetooth Headphones |

#### Sort + Interaction
| # | Test | Result | Assertion |
|---|---|---|---|
| 53 | sort applies within filtered results | PASS | Sports filter + price-asc → Water Bottle, Yoga Mat, Running Shoes in order |
| 54 | sort applies within search results | PASS | Search `"ceramic"` + price-asc → Mug ($24.99) before Planter ($32) |
| 55 | changing sort resets to page 1 | PASS | On page 2, change sort → jumps back to page 1 |

---

### 4. Pagination — `e2e/tests/pagination.spec.ts`
**19 tests | 19 passed | 0 failed**

#### Initial State
| # | Test | Result | Assertion |
|---|---|---|---|
| 56 | pagination nav is visible for 18 products | PASS | `pagination-nav` visible |
| 57 | starts on page 1 of 3 | PASS | Status shows "Page 1 of 3" |
| 58 | Previous button is disabled on the first page | PASS | `prevBtn` disabled |
| 59 | Next button is enabled on the first page | PASS | `nextBtn` enabled |

#### Navigation
| # | Test | Result | Assertion |
|---|---|---|---|
| 60 | Next navigates from page 1 to page 2 | PASS | Page 2; Headphones hidden; Yoga Mat Pro visible |
| 61 | Previous navigates from page 2 back to page 1 | PASS | Back to page 1; Headphones visible |
| 62 | navigate all the way to page 3 | PASS | Page 3; Water Bottle & Merino Throw visible |
| 63 | Next button is disabled on the last page | PASS | `nextBtn` disabled on page 3 |
| 64 | Previous button is enabled on the last page | PASS | `prevBtn` enabled on page 3 |
| 65 | each page shows exactly 6 products | PASS | `getVisibleTitles().length === 6` on all 3 pages |

#### Page Content Verification
| # | Test | Result | Assertion |
|---|---|---|---|
| 66 | page 1 shows correct products | PASS | All 6 expected page-1 titles present |
| 67 | page 2 shows correct products | PASS | All 6 expected page-2 titles present |
| 68 | page 3 shows correct products | PASS | All 6 expected page-3 titles present |

#### Pagination Visibility Rules
| # | Test | Result | Assertion |
|---|---|---|---|
| 69 | pagination is hidden when category yields ≤6 results | PASS | Sports (3 products) → nav hidden |
| 70 | pagination is hidden when search yields ≤6 results | PASS | Search `"headphones"` (1 result) → nav hidden |

#### Page Reset on Filter / Search Change
| # | Test | Result | Assertion |
|---|---|---|---|
| 71 | applying a category filter resets to page 1 | PASS | On page 2 → check Electronics (5 results, no pagination) → nav hidden |
| 72 | applying price filter resets to page 1 | PASS | On page 2 → under $50 (9 results, 2 pages) → jumps to page 1 of 2 |

#### Keyboard Accessibility
| # | Test | Result | Assertion |
|---|---|---|---|
| 73 | pagination nav is keyboard-accessible | PASS | `Enter` on Next → page 2; `Space` on Previous → page 1 |

---

### 5. Viewport — `e2e/tests/viewport.spec.ts`
**16 tests | 16 passed | 0 failed**

#### Responsive Layout (All Viewports via Project Matrix)
| # | Test | Result | Assertion |
|---|---|---|---|
| 74 | page heading is visible on every viewport | PASS | `<h1>Product Showcase</h1>` visible |
| 75 | search input is visible and usable on every viewport | PASS | Input visible; search for `"mug"` returns 1 result |
| 76 | sort dropdown is visible on every viewport | PASS | Sort select visible |
| 77 | filter checkboxes are visible on every viewport | PASS | Category/Price legends and checkboxes visible |
| 78 | result count is visible on every viewport | PASS | "18 products found" visible |
| 79 | product cards are rendered on every viewport | PASS | 6 cards rendered, first card visible |
| 80 | pagination nav is visible for full catalog | PASS | Pagination nav visible |
| 81 | search → valid result works on every viewport | PASS | Search `"running"` → 1 result, Running Shoes visible |
| 82 | search → empty state works on every viewport | PASS | No-match search → empty state |
| 83 | category filter works on every viewport | PASS | Sports → 3 results |
| 84 | price filter works on every viewport | PASS | Over $100 → 3 results |
| 85 | clear all filters works on every viewport | PASS | Apparel → clear → 18 products |
| 86 | pagination next/prev works on every viewport | PASS | Next → page 2 → Prev → page 1 |
| 87 | sort price low to high works on every viewport | PASS | Water Bottle first after sort |
| 88 | product grid renders without overflow | PASS | Grid width ≤ viewport width |

#### Explicit Viewport Snapshots
| # | Test | Viewport | Result | Assertion |
|---|---|---|---|---|
| 89 | Desktop: shows 3-column product grid | 1280 × 720 | PASS | 6 cards rendered |
| 90 | Tablet: filter section and search visible without scroll | 768 × 1024 | PASS | Search input and Category legend both in view |
| 91 | Mobile: full search-filter-paginate flow | 375 × 812 | PASS | Search → filter → clear → paginate all work |
| 92 | Mobile: product cards are not cut off | 375 × 812 | PASS | Card `x + width ≤ viewport.width` |

---

## Test Coverage Matrix

| Feature | Search | Filters | Sorting | Pagination | Viewport |
|---|:---:|:---:|:---:|:---:|:---:|
| Initial page load | ✓ | | | ✓ | ✓ |
| Search (valid query) | ✓ | | | | ✓ |
| Search (no results / empty state) | ✓ | | | | ✓ |
| Single category filter | | ✓ | | | ✓ |
| Single price filter | | ✓ | | | ✓ |
| Multiple filters | | ✓ | | | |
| Clear all filters | | ✓ | | | ✓ |
| Sort: Featured | | | ✓ | | |
| Sort: Price Low→High | | | ✓ | | ✓ |
| Sort: Price High→Low | | | ✓ | | |
| Sort: Rating High→Low | | | ✓ | | |
| Sort: Name A→Z | | | ✓ | | |
| Sort + filter interaction | | | ✓ | | |
| Sort resets page | | | ✓ | | |
| Pagination: next / prev | | | | ✓ | ✓ |
| Pagination: boundary states | | | | ✓ | |
| Pagination: page content | | | | ✓ | |
| Pagination: auto-hide | | | | ✓ | |
| Pagination: resets on filter | | | | ✓ | |
| Keyboard accessibility | | | | ✓ | |
| Desktop layout | | | | | ✓ |
| Tablet layout | | | | | ✓ |
| Mobile layout | | | | | ✓ |
| Grid overflow check | | | | | ✓ |

---

## Cross-Browser Results (Full Run)

| Project | Tests | Passed | Failed | Duration |
|---|---|---|---|---|
| desktop-chrome | 92 | 92 | 0 | ~19s |
| desktop-firefox | 92 | 92 | 0 | ~21s |
| desktop-webkit | 92 | 92 | 0 | ~22s |
| tablet-chrome | 92 | 92 | 0 | ~20s |
| mobile-chrome | 92 | 92 | 0 | ~21s |
| mobile-webkit | 92 | 92 | 0 | ~20s |
| **TOTAL** | **552** | **552** | **0** | **~2 min** |

---

## Failure History

| Run | Tests | Failed | Notes |
|---|---|---|---|
| Initial full run | 552 | 1 | `viewport.spec.ts:39` — `getByText('Price')` strict mode violation; "Price" also matched `<option>Price: Low to High</option>` in sort select |
| Fix applied | — | — | Changed to `getByText('Price', { exact: true })` to scope selector to the filter legend only |
| Re-run (Chrome) | 92 | 0 | All passing |
| Re-run (All projects) | 552 | 0 | All passing |

---

## How to Re-run

```bash
# Headless — Chrome only
npx playwright test --project desktop-chrome

# Headless — all browsers
npx playwright test

# Headed (visible browser window) — useful for debugging
npx playwright test --headed --project desktop-chrome

# Single spec file
npx playwright test e2e/tests/search.spec.ts --project desktop-chrome

# Single test by title
npx playwright test --grep "search with no results" --project desktop-chrome

# Open HTML report
npx playwright show-report

# npm scripts
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
```

---

## Artifacts

On any test failure, Playwright automatically captures:
- **Screenshot** — saved to `test-results/`
- **Video** — `.webm` recording of the failed test
- **Trace** — inspectable via `npx playwright show-trace <trace.zip>`

---

## Exercise 6 Addendum — Multi-step Registration Form

**Feature:** Multi-step registration form (Exercise 6)  
**Spec file:** `e2e/tests/registration.spec.ts`  
**Page object:** `e2e/pages/RegistrationPage.ts`  
**Date run:** 2026-04-22  
**Command:** `npx playwright test e2e/tests/registration.spec.ts --project desktop-chrome`

### Result

| Metric | Value |
|---|---|
| Tests | **5** |
| Passed | **5** |
| Failed | **0** |
| Project | `desktop-chrome` |
| Duration | **~2.2 seconds** |

### Covered scenarios

| Test | Area covered | Result |
|---|---|---|
| field validation shows required, format, and length errors | Required validation, format validation, length constraints, `aria-invalid` checks | PASS |
| navigates next and previous between steps while preserving values | Step navigation (`Next` / `Previous`) and value persistence between steps | PASS |
| submits successfully with valid data | Submission success state and status messaging | PASS |
| shows submission error state when backend simulation fails | Submission failure path and error status messaging | PASS |
| includes accessible labels and error announcement regions | Label associations, `role="alert"`, `role="status"`, `aria-live`, form `aria-describedby`, progressbar ARIA | PASS |

### Notes

- This addendum reflects the targeted Exercise 6 run on Chrome desktop.
- Full project matrix (`desktop-firefox`, `desktop-webkit`, `tablet-chrome`, `mobile-chrome`, `mobile-webkit`) was not executed for this addendum.
