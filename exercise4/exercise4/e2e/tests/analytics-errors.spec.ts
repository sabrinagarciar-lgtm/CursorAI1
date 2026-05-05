import { test, expect } from '@playwright/test';
import { AnalyticsOverviewPage } from '../pages/AnalyticsOverviewPage';

test.describe('Analytics error state', () => {
  test('analyticsError query shows failure UI', async ({ page }) => {
    await page.goto('/?analyticsError=1');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('analytics-error')).toBeVisible();
    await expect(page.getByTestId('analytics-error-message')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Analytics unavailable/i })).toBeVisible();
  });

  test('try again reloads working dashboard', async ({ page }) => {
    await page.goto('/?analyticsError=1');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('analytics-error-retry').click();
    await page.waitForLoadState('domcontentloaded');

    const dash = new AnalyticsOverviewPage(page);
    await expect(dash.heading).toBeVisible({ timeout: 30_000 });
    await dash.waitForReady();
    await expect(dash.searchInput).toBeVisible();
  });

  test('error view hides dashboard controls', async ({ page }) => {
    await page.goto('/?analyticsError=1');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('analytics-main')).not.toBeVisible();
  });
});
