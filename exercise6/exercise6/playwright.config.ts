import { defineConfig, devices } from '@playwright/test';

/**
 * Exercise 5 — Playwright E2E configuration.
 *
 * Projects:
 *  desktop-chrome, desktop-firefox, desktop-webkit  (1280×720)
 *  tablet-chrome                                     (768×1024)
 *  mobile-chrome                                     (375×812)
 *
 * Run:
 *   npx playwright test                 # all projects, headless
 *   npx playwright test --headed        # headed (visible browser)
 *   npx playwright test --project desktop-chrome
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3010',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    /* ── Desktop ────────────────────────────────────────────────── */
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'desktop-webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    /* ── Tablet ─────────────────────────────────────────────────── */
    {
      name: 'tablet-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },

    /* ── Mobile ─────────────────────────────────────────────────── */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-webkit',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
});
