import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class AnalyticsOverviewPage {
  readonly page: Page;
  readonly main: Locator;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly regionSelect: Locator;
  readonly segmentSelect: Locator;
  readonly dateFrom: Locator;
  readonly dateTo: Locator;
  readonly resultCount: Locator;
  readonly clearBtn: Locator;
  readonly tableSort: Locator;
  readonly tablePagination: Locator;
  readonly tablePrev: Locator;
  readonly tableNext: Locator;
  readonly tablePageStatus: Locator;
  readonly tableEmpty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.main = page.getByTestId('analytics-main');
    this.heading = page.getByTestId('analytics-heading');
    this.searchInput = page.getByTestId('analytics-search-input');
    this.regionSelect = page.getByTestId('analytics-region');
    this.segmentSelect = page.getByTestId('analytics-segment');
    this.dateFrom = page.getByTestId('analytics-date-from');
    this.dateTo = page.getByTestId('analytics-date-to');
    this.resultCount = page.getByTestId('analytics-result-count');
    this.clearBtn = page.getByTestId('analytics-clear-filters');
    this.tableSort = page.getByTestId('analytics-table-sort');
    this.tablePagination = page.getByTestId('analytics-table-pagination');
    this.tablePrev = page.getByTestId('analytics-table-prev');
    this.tableNext = page.getByTestId('analytics-table-next');
    this.tablePageStatus = page.getByTestId('analytics-table-page-status');
    this.tableEmpty = page.getByTestId('analytics-table-empty');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    await this.waitForReady();
  }

  /** Wait until mock loading delay finishes. */
  async waitForReady() {
    await expect(this.main).toHaveAttribute('aria-busy', 'false', { timeout: 10_000 });
  }

  preset(id: '7d' | '30d' | '90d'): Locator {
    return this.page.getByTestId(`analytics-preset-${id}`);
  }

  async firstDataRowRevenue(): Promise<number> {
    const row = this.page.locator('tbody tr[data-testid^="analytics-row-"]').first();
    await expect(row).toBeVisible();
    const cell = row.locator('td').nth(5);
    const t = (await cell.textContent())?.trim() ?? '';
    const n = Number(t.replace(/[^0-9.]/g, ''));
    return n;
  }

  async firstDataRowProduct(): Promise<string> {
    const row = this.page.locator('tbody tr[data-testid^="analytics-row-"]').first();
    await expect(row).toBeVisible();
    const cell = row.locator('td').nth(2);
    return (await cell.textContent())?.trim() ?? '';
  }
}
