import { test, expect } from '@playwright/test';
import { AnalyticsOverviewPage } from '../pages/AnalyticsOverviewPage';

test.describe('Table pagination', () => {
  let dash: AnalyticsOverviewPage;

  test.beforeEach(async ({ page }) => {
    dash = new AnalyticsOverviewPage(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dash.preset('90d').click();
    await dash.waitForReady();
  });

  test('pagination appears when more than one page of rows', async () => {
    await expect(dash.tablePagination).toBeVisible();
    await expect(dash.tablePageStatus).toContainText('Page 1 of');
  });

  test('next and previous navigate between pages', async () => {
    const row1 = dash.page.locator('tbody tr[data-testid^="analytics-row-"]').first();
    const id1 = await row1.getAttribute('data-testid');

    await dash.tableNext.click();
    await expect(dash.tablePageStatus).toContainText('Page 2 of');
    const row2 = dash.page.locator('tbody tr[data-testid^="analytics-row-"]').first();
    const id2 = await row2.getAttribute('data-testid');
    expect(id2).not.toBe(id1);

    await dash.tablePrev.click();
    await expect(dash.tablePageStatus).toContainText('Page 1 of');
    const rowBack = dash.page.locator('tbody tr[data-testid^="analytics-row-"]').first();
    await expect(rowBack).toHaveAttribute('data-testid', id1!);
  });

  test('previous disabled on first page', async () => {
    await expect(dash.tablePrev).toBeDisabled();
    await expect(dash.tableNext).toBeEnabled();
  });
});

test.describe('Table sort', () => {
  let dash: AnalyticsOverviewPage;

  test.beforeEach(async ({ page }) => {
    dash = new AnalyticsOverviewPage(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dash.preset('90d').click();
    await dash.waitForReady();
  });

  test('sort by revenue ascending vs descending changes first-row revenue', async () => {
    await dash.tableSort.selectOption('revenue-desc');
    const high = await dash.firstDataRowRevenue();
    await dash.tableSort.selectOption('revenue-asc');
    const low = await dash.firstDataRowRevenue();
    expect(high).toBeGreaterThan(low);
  });

  test('sort by product A–Z orders alphabetically on first page', async () => {
    await dash.tableSort.selectOption('product-asc');
    const a = await dash.firstDataRowProduct();
    const rows = dash.page.locator('tbody tr[data-testid^="analytics-row-"]');
    const count = await rows.count();
    if (count > 1) {
      const b = (await rows.nth(1).locator('td').nth(2).textContent())?.trim() ?? '';
      expect(a.localeCompare(b)).toBeLessThanOrEqual(0);
    }
  });

  test('changing filters resets table to page 1', async () => {
    await dash.tableNext.click();
    await expect(dash.tablePageStatus).toContainText('Page 2 of');

    await dash.regionSelect.selectOption('EU');
    await dash.waitForReady();
    await expect(dash.tablePageStatus).toContainText('Page 1 of');
  });
});
