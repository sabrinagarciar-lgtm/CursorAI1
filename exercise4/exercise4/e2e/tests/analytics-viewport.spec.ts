import { test, expect } from '@playwright/test';
import { AnalyticsOverviewPage } from '../pages/AnalyticsOverviewPage';

test.describe('Cross-viewport analytics', () => {
  let dash: AnalyticsOverviewPage;

  test.beforeEach(async ({ page }) => {
    dash = new AnalyticsOverviewPage(page);
    await dash.goto();
  });

  test('heading and filters visible', async () => {
    await expect(dash.heading).toBeVisible();
    await expect(dash.searchInput).toBeVisible();
    await expect(dash.regionSelect).toBeVisible();
    await expect(dash.segmentSelect).toBeVisible();
  });

  test('preset and clear controls usable', async () => {
    await dash.preset('30d').click();
    await dash.waitForReady();
    await expect(dash.resultCount).toBeVisible();
    await dash.searchInput.fill('x');
    await dash.waitForReady();
    await expect(dash.clearBtn).toBeEnabled();
  });

  test('sort control visible', async () => {
    await expect(dash.tableSort).toBeVisible();
  });
});

test.describe('Desktop explicit viewport', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('main grid fits viewport width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const main = page.getByTestId('analytics-main');
    await expect(main).toBeVisible();
    const box = await main.boundingBox();
    const vp = page.viewportSize();
    if (box && vp) {
      expect(box.width).toBeLessThanOrEqual(vp.width);
    }
  });
});
