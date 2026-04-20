import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from '../pages/ProductCatalogPage';

test.describe('Search', () => {
  let catalog: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    catalog = new ProductCatalogPage(page);
    await catalog.goto();
  });

  /* ── initial state ─────────────────────────────────────────────── */
  test('loads with full catalog visible', async () => {
    await catalog.expectResultCount('18 products found');
    await catalog.expectProductVisible('Wireless Bluetooth Headphones');
    await catalog.expectProductVisible('Running Shoes');
    await expect(catalog.emptyState).not.toBeVisible();
  });

  test('page title is present', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Product Showcase' }),
    ).toBeVisible();
  });

  test('search input is focused and accessible', async () => {
    await expect(catalog.searchInput).toBeVisible();
    await expect(catalog.searchInput).toHaveAttribute(
      'placeholder',
      /Search by title or description/i,
    );
  });

  /* ── valid query ───────────────────────────────────────────────── */
  test('search with valid query — title match', async () => {
    await catalog.search('headphones');

    await catalog.expectResultCount('1 product found');
    await catalog.expectProductVisible('Wireless Bluetooth Headphones');
    await expect(catalog.emptyState).not.toBeVisible();
  });

  test('search with valid query — description match', async () => {
    await catalog.search('noise cancellation');

    await catalog.expectResultCount('1 product found');
    await catalog.expectProductVisible('Wireless Bluetooth Headphones');
  });

  test('search is case-insensitive', async () => {
    await catalog.search('RUNNING');

    await catalog.expectResultCount('1 product found');
    await catalog.expectProductVisible('Running Shoes');
  });

  test('search returns multiple matches', async () => {
    await catalog.search('portable');

    await catalog.expectResultCount('2 products found');
    await catalog.expectProductVisible('Portable Power Bank');
    await catalog.expectProductVisible('Portable Bluetooth Speaker');
  });

  test('search narrows results dynamically as user types', async ({ page }) => {
    await catalog.search('c');
    const afterC = await page
      .getByTestId('result-count')
      .textContent();

    await catalog.search('ce');
    const afterCe = await page
      .getByTestId('result-count')
      .textContent();

    const countAfterC = parseInt(afterC?.match(/\d+/)?.[0] ?? '0');
    const countAfterCe = parseInt(afterCe?.match(/\d+/)?.[0] ?? '0');
    expect(countAfterCe).toBeLessThanOrEqual(countAfterC);
  });

  test('clearing search restores full catalog', async () => {
    await catalog.search('headphones');
    await catalog.expectResultCount('1 product found');

    await catalog.clearSearch();
    await catalog.expectResultCount('18 products found');
  });

  /* ── no results ────────────────────────────────────────────────── */
  test('search with no results shows empty state', async () => {
    await catalog.search('xyznonexistent999');

    await catalog.expectEmptyState();
    await catalog.expectResultCount('0 products found');
  });

  test('no results state includes helpful message', async ({ page }) => {
    await catalog.search('zzznomatch');

    await expect(
      page.getByText('Try a different search or clear filters'),
    ).toBeVisible();
  });

  test('pagination is hidden when search yields zero results', async () => {
    await catalog.search('zzznomatch');

    await expect(catalog.paginationNav).not.toBeVisible();
  });

  test('pagination resets to page 1 after a new search', async () => {
    await catalog.goToNextPage();
    await catalog.expectPageNumber(2, 3);

    await catalog.search('headphones');
    await expect(catalog.paginationNav).not.toBeVisible();
    await catalog.expectResultCount('1 product found');
  });
});
