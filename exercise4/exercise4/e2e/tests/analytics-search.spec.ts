import { test, expect } from '@playwright/test';
import { AnalyticsOverviewPage } from '../pages/AnalyticsOverviewPage';

test.describe('Analytics search', () => {
  let dash: AnalyticsOverviewPage;

  test.beforeEach(async ({ page }) => {
    dash = new AnalyticsOverviewPage(page);
    await dash.goto();
  });

  test('search with valid query narrows table rows', async () => {
    await dash.preset('90d').click();
    await dash.waitForReady();
    const fullText = await dash.resultCount.textContent();
    const fullMatch = fullText?.match(/(\d+)\s+matching/i);
    const fullN = Number(fullMatch?.[1] ?? '0');
    expect(fullN).toBeGreaterThan(3);

    await dash.searchInput.fill('Stream Connect');
    await dash.waitForReady();

    const narrowText = await dash.resultCount.textContent();
    const narrowMatch = narrowText?.match(/(\d+)\s+matching/i);
    const narrowN = Number(narrowMatch?.[1] ?? '0');
    expect(narrowN).toBeGreaterThan(0);
    expect(narrowN).toBeLessThan(fullN);

    const rows = dash.page.locator('tbody tr[data-testid^="analytics-row-"]');
    await expect(rows.first()).toContainText('Stream Connect');
  });

  test('search with no results shows empty table state', async () => {
    await dash.searchInput.fill('___no_such_product_query___');
    await dash.waitForReady();

    await expect(dash.tableEmpty).toBeVisible();
    await expect(dash.resultCount).toContainText('0 matching');
    await expect(dash.tablePagination).not.toBeVisible();
  });

  test('clearing search restores rows', async () => {
    await dash.preset('90d').click();
    await dash.waitForReady();
    await expect(dash.resultCount).not.toContainText('0 matching');

    await dash.searchInput.fill('zzzempty');
    await dash.waitForReady();
    await expect(dash.resultCount).toContainText('0 matching');
    await expect(dash.tableEmpty).toBeVisible();

    await dash.searchInput.fill('');
    await dash.waitForReady();
    await expect(dash.resultCount).not.toContainText('0 matching');
    await expect(dash.page.locator('tbody tr[data-testid^="analytics-row-"]').first()).toBeVisible();
  });
});
