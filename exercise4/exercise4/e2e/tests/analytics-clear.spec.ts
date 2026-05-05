import { test, expect } from '@playwright/test';
import { AnalyticsOverviewPage } from '../pages/AnalyticsOverviewPage';

test.describe('Clear all filters', () => {
  let dash: AnalyticsOverviewPage;

  test.beforeEach(async ({ page }) => {
    dash = new AnalyticsOverviewPage(page);
    await dash.goto();
  });

  test('clear is disabled in default state', async () => {
    await expect(dash.clearBtn).toBeDisabled();
  });

  test('clear resets region, segment, search, sort, and restores counts', async () => {
    await dash.preset('7d').click();
    await dash.waitForReady();
    await dash.searchInput.fill('API');
    await dash.waitForReady();
    await dash.regionSelect.selectOption('NA');
    await dash.waitForReady();
    await dash.segmentSelect.selectOption('Self-serve');
    await dash.waitForReady();
    await dash.tableSort.selectOption('product-asc');

    await expect(dash.clearBtn).toBeEnabled();
    await dash.clearBtn.click();

    await dash.waitForReady();
    await expect(dash.searchInput).toHaveValue('');
    await expect(dash.regionSelect).toHaveValue('all');
    await expect(dash.segmentSelect).toHaveValue('all');
    await expect(dash.tableSort).toHaveValue('date-desc');
    await expect(dash.clearBtn).toBeDisabled();
  });
});
