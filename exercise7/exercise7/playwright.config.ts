import { defineConfig, devices } from '@playwright/test';

/**
 * Exercise 7 — Kanban board Playwright E2E.
 *
 * Run (headless, all projects):
 *   npm run test:e2e
 *
 * Headed / single project:
 *   npm run test:e2e:headed
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
    baseURL: 'http://127.0.0.1:3027',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  webServer: {
    // Production build + static server (avoids CRA file watchers and works in restricted sandboxes).
    command: 'npm run build && python3 -m http.server 3027 --bind 127.0.0.1 --directory build',
    url: 'http://127.0.0.1:3027',
    // Always rebuild and restart so tests never hit a stale bundle (reuse caused flaky backdrop tests).
    reuseExistingServer: false,
    timeout: 180_000,
  },

  projects: [
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
    {
      name: 'tablet-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
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
