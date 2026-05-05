# Exercise 3 — Playwright E2E Test Report

**Application:** Settings panel (Profile, Notifications, Privacy, Appearance)  
**Base URL:** `http://localhost:3012`  
**Test framework:** Playwright (`@playwright/test`)  
**Primary spec:** `e2e/settings-panel.spec.ts`  
**Run mode:** Headless  
**Last full matrix run (reference):** 2026-04-20 — **90 / 90 passed** (~43 s, `CI=true npm run test:e2e`, 1 worker under CI)  
**Single-project example:** `npx playwright test --project=desktop-chrome` → **15 / 15 passed** (parallel workers locally)

---

## Summary

| Metric | Value |
|--------|--------|
| Scenarios (unique tests) | **15** |
| Total runs (6 browser/viewport projects) | **15 × 6 = 90** |
| Passed (last reference run) | **90** |
| Failed | **0** |
| Skipped | **0** |
| CI workers | `1` when `CI=true`; local default allows parallel workers |

---

## How to run

```bash
cd exercise3/exercise3
npm install --legacy-peer-deps
npm run test:e2e:install          # browsers (first machine / CI image)
CI=true npm run test:e2e          # full matrix; webServer starts on :3012
npm run test:e2e:headed           # visible browser
npm run test:e2e:report           # open last HTML report
```

Port ownership in this repo:

- **Exercise 5:** `3010`
- **Exercise 4:** `3011`
- **Exercise 3:** `3012` (this project)

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

- **Headless:** `true` (`playwright.config.ts` → `use.headless`)
- **Screenshots / video / trace:** retained on failure
- **Retries:** `2` when `CI=true`
- **`forbidOnly`:** enabled when `CI=true`
- **`webServer`:** `PORT=3012 BROWSER=none npm start` (reused when not in CI if already listening)

---

## Test infrastructure & selectors

Exercise 3 does not use a dedicated page object; locators rely on accessible roles and stable attributes.

| Concern | Locator / technique |
|---------|---------------------|
| Save / Cancel | `getByRole('button', { name: 'Save changes' })`, `… 'Cancel'` |
| Form status message | `#settings-form-status` (`role="status"`, `aria-live="polite"`) |
| Validation errors | `getByRole('alert')` (`<p role="alert">` from form fields) |
| Email field | **`getByRole('textbox', { name: 'Email' })`** — avoids collision with **“Email digest”** switch (`getByLabel('Email')` can match both on WebKit) |
| Display name, Bio, selects | `getByLabel('Display name')`, `getByLabel('Bio')`, `getByLabel('Time zone')`, etc. |
| Toggles | `getByRole('switch', { name: '…' })` + `aria-checked` |
| Theme on document | `document.documentElement.classList.contains('dark')` via `page.evaluate` |
| Tabs | `getByRole('tab', { name: 'Profile' \| … })`, tabpanels by role + name |

### Application notes

- **Bio overflow test:** `maxlength` is removed in the test only so 281 characters can trigger server-side-style validation (`Bio must be 280 characters or fewer`).
- **Section “pagination”:** There is no paginated data table. Keyboard **tab list** navigation (arrows, Home, End, wrap) covers sequential movement across settings sections.

---

## Results by scenario (`settings-panel.spec.ts`)

Each row runs once per Playwright project (×6) in a full matrix.

### 1. Initial / empty state (2)

| # | Test | Intent |
|---|------|--------|
| 1 | shows no validation alerts and empty status message | Clean load: zero alerts, blank `#settings-form-status` |
| 2 | profile tab panel is visible with pre-filled display name | Profile selected; default display name `Alex Rivera` |

### 2. Profile (4)

| # | Test | Intent |
|---|------|--------|
| 3 | saves valid profile data and shows success status | Fill name, email, bio, timezone → Save → status contains “saved”; inputs retain values |
| 4 | shows error when display name is empty | Empty name → alert + `aria-invalid` + guidance; fix → save succeeds |
| 5 | shows email validation error for invalid format | Invalid email string → alert + invalid email field |
| 6 | shows bio validation error when over 280 characters | 281 chars → alert + bio `aria-invalid` |

### 3. Notifications (1)

| # | Test | Intent |
|---|------|--------|
| 7 | updates toggles and digest frequency then saves successfully | Three switches + digest `<select>` → Save → success status |

### 4. Privacy (1)

| # | Test | Intent |
|---|------|--------|
| 8 | updates visibility and toggles then saves | Visibility select + two switches → Save |

### 5. Appearance & theme (3)

| # | Test | Intent |
|---|------|--------|
| 9 | applies dark and light theme on the document root | Theme `dark` / `light` toggles `html.dark` class |
| 10 | system theme follows prefers-color-scheme | Theme `system` aligns `html` class with OS preference |
| 11 | density and reduce motion can be changed and saved | Density + Reduce motion switch → Save |

### 6. Save / Cancel & error recovery (2)

| # | Test | Intent |
|---|------|--------|
| 12 | cancel restores last saved values after edits | Edit display name → Cancel → initial value + “discarded” status |
| 13 | after save error, correcting input clears error state on next save | Failed save → corrected fields → alerts cleared + saved |

### 7. Tab navigation across sections (2)

| # | Test | Intent |
|---|------|--------|
| 14 | keyboard arrows move selection across tabs; End focuses last section | Roving focus + `aria-selected`; Home, End, wrap |
| 15 | each tab exposes its panel content when selected | Notifications / Privacy / Appearance panels show expected controls |

---

## Acceptance mapping

| Requirement | Coverage |
|-------------|----------|
| Data input (text, textarea, selects) | Profile + Notifications digest + Privacy visibility + Appearance density/theme |
| Toggle settings | Notifications, Privacy, Appearance (`role="switch"`) |
| Theme mode | Appearance tests (dark / light / system + `html` class) |
| Empty / no-error initial state | Initial / empty state block |
| Error states | Empty display name; invalid email; long bio; recovery after error |
| Pagination (interpreted) | Tab list keyboard + click navigation across sections |
| Headless | Default in config |
| Multiple viewports | Six projects |
| Assertions | `expect` on status text, alerts count, `aria-invalid`, `aria-checked`, values, visibility |

---

## Updating this document

After a CI or release run, refresh **Summary** and **Last full matrix run** with:

```bash
cd exercise3/exercise3
CI=true npm run test:e2e
```

HTML report: `playwright-report/index.html`.
