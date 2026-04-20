import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for the ProductCatalog component.
 *
 * Centralises all selector look-ups and common interactions so that
 * individual spec files stay concise and selector changes are fixed
 * in one place.
 */
export class ProductCatalogPage {
  readonly page: Page;

  /* ── inputs ────────────────────────────────────────────────────── */
  readonly searchInput: Locator;
  readonly sortSelect: Locator;
  readonly clearFiltersBtn: Locator;

  /* ── result metadata ───────────────────────────────────────────── */
  readonly resultCount: Locator;

  /* ── empty state ───────────────────────────────────────────────── */
  readonly emptyState: Locator;

  /* ── pagination ────────────────────────────────────────────────── */
  readonly paginationNav: Locator;
  readonly prevBtn: Locator;
  readonly nextBtn: Locator;
  readonly paginationStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('search-input');
    this.sortSelect = page.getByTestId('sort-select');
    this.clearFiltersBtn = page.getByTestId('clear-filters');
    this.resultCount = page.getByTestId('result-count');
    this.emptyState = page.getByTestId('product-catalog-empty');
    this.paginationNav = page.getByTestId('pagination-nav');
    this.prevBtn = page.getByTestId('pagination-prev');
    this.nextBtn = page.getByTestId('pagination-next');
    this.paginationStatus = page.getByTestId('pagination-status');
  }

  /* ── navigation ────────────────────────────────────────────────── */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /* ── filter checkboxes ─────────────────────────────────────────── */
  categoryFilter(category: string): Locator {
    return this.page.getByTestId(`filter-category-${category}`);
  }

  priceFilter(bracket: 'under50' | '50-100' | 'over100'): Locator {
    return this.page.getByTestId(`filter-price-${bracket}`);
  }

  /* ── product cards ─────────────────────────────────────────────── */
  productCardById(id: string): Locator {
    return this.page.getByTestId(`product-card-${id}`);
  }

  /**
   * All h2 product title headings currently visible on the page.
   * Uses a scoped query so only titles inside product-card articles match.
   */
  get visibleProductTitles(): Locator {
    return this.page.locator('article[data-testid^="product-card-"] h2');
  }

  /* ── helpers ───────────────────────────────────────────────────── */
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async selectSort(value: string) {
    await this.sortSelect.selectOption(value);
  }

  async clearAll() {
    await this.clearFiltersBtn.click();
  }

  async goToNextPage() {
    await this.nextBtn.click();
  }

  async goToPrevPage() {
    await this.prevBtn.click();
  }

  /* ── assertions ────────────────────────────────────────────────── */
  async expectResultCount(text: string | RegExp) {
    await expect(this.resultCount).toContainText(text);
  }

  async expectPageNumber(n: number, total: number) {
    await expect(this.paginationStatus).toContainText(`Page ${n} of ${total}`);
  }

  async expectProductVisible(title: string) {
    await expect(
      this.page.getByRole('heading', { name: title }),
    ).toBeVisible();
  }

  async expectProductHidden(title: string) {
    await expect(
      this.page.getByRole('heading', { name: title }),
    ).not.toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
    await expect(
      this.page.getByText('No products match your filters'),
    ).toBeVisible();
  }

  async expectSearchValue(value: string) {
    await expect(this.searchInput).toHaveValue(value);
  }

  async expectSortValue(value: string) {
    await expect(this.sortSelect).toHaveValue(value);
  }

  async expectCategoryChecked(category: string, checked = true) {
    const checkbox = this.categoryFilter(category);
    if (checked) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }

  async expectPrevDisabled() {
    await expect(this.prevBtn).toBeDisabled();
  }

  async expectNextDisabled() {
    await expect(this.nextBtn).toBeDisabled();
  }

  /** Returns the text content of all visible product titles in order. */
  async getVisibleTitles(): Promise<string[]> {
    return this.visibleProductTitles.allTextContents();
  }
}
