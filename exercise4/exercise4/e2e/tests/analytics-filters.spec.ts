import { test, expect } from '@playwright/test';
import { AnalyticsOverviewPage } from '../pages/AnalyticsOverviewPage';

test.describe('Analytics filters', () => {
  let dash: AnalyticsOverviewPage;

  test.beforeEach(async ({ page }) => {
    dash = new AnalyticsOverviewPage(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dash.preset('90d').click();
    await dash.waitForReady();
  });

  test('apply single region filter', async () => {
    await dash.regionSelect.selectOption('EU');
    await dash.waitForReady();

    await expect(dash.resultCount).not.toContainText('0 matching');
    const rows = dash.page.locator('tbody tr[data-testid^="analytics-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(rows.nth(i).locator('td').nth(3)).toContainText('EU');
    }
  });

  test('apply single segment filter', async () => {
    await dash.segmentSelect.selectOption('Enterprise');
    await dash.waitForReady();
    const rows = dash.page.locator('tbody tr[data-testid^="analytics-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(rows.nth(i).locator('td').nth(4)).toContainText('Enterprise');
    }
  });

  test('apply date range with no data shows empty state', async () => {
    await dash.dateFrom.fill('2099-01-01');
    await dash.dateTo.fill('2099-01-02');
    await dash.waitForReady();
    await expect(dash.tableEmpty).toBeVisible();
    await expect(dash.resultCount).toContainText('0 matching');
  });

  test('apply multiple filters (region + segment)', async () => {
    await dash.regionSelect.selectOption('APAC');
    await dash.segmentSelect.selectOption('SMB');
    await dash.waitForReady();

    const rows = dash.page.locator('tbody tr[data-testid^="analytics-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(rows.nth(i).locator('td').nth(3)).toContainText('APAC');
      await expect(rows.nth(i).locator('td').nth(4)).toContainText('SMB');
    }
  });
});
