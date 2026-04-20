import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from '../pages/ProductCatalogPage';

/**
 * 18 products, 6 per page → 3 pages.
 *
 * Page 1 (featured order): Wireless Bluetooth Headphones, Minimalist Watch,
 *                           Organic Cotton T-Shirt, Portable Power Bank,
 *                           Ceramic Coffee Mug, Running Shoes
 * Page 2: Yoga Mat Pro, LED Desk Lamp, USB-C Hub 7-in-1, Travel Backpack,
 *         Polarized Sunglasses, Fleece Hoodie
 * Page 3: Insulated Water Bottle, Portable Bluetooth Speaker,
 *         Ceramic Planter Set, Athletic Shorts, Fitness Tracker Band,
 *         Merino Wool Throw
 */

test.describe('Pagination', () => {
  let catalog: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    catalog = new ProductCatalogPage(page);
    await catalog.goto();
  });

  /* ── initial state ───────────────────────────────────────────────── */
  test('pagination nav is visible for 18 products', async () => {
    await expect(catalog.paginationNav).toBeVisible();
  });

  test('starts on page 1 of 3', async () => {
    await catalog.expectPageNumber(1, 3);
  });

  test('Previous button is disabled on the first page', async () => {
    await catalog.expectPrevDisabled();
  });

  test('Next button is enabled on the first page', async () => {
    await expect(catalog.nextBtn).toBeEnabled();
  });

  /* ── navigation ──────────────────────────────────────────────────── */
  test('Next navigates from page 1 to page 2', async () => {
    await catalog.goToNextPage();

    await catalog.expectPageNumber(2, 3);
    await catalog.expectProductHidden('Wireless Bluetooth Headphones');
    await catalog.expectProductVisible('Yoga Mat Pro');
  });

  test('Previous navigates from page 2 back to page 1', async () => {
    await catalog.goToNextPage();
    await catalog.expectPageNumber(2, 3);

    await catalog.goToPrevPage();
    await catalog.expectPageNumber(1, 3);
    await catalog.expectProductVisible('Wireless Bluetooth Headphones');
  });

  test('navigate all the way to page 3', async () => {
    await catalog.goToNextPage();
    await catalog.goToNextPage();

    await catalog.expectPageNumber(3, 3);
    await catalog.expectProductVisible('Insulated Water Bottle');
    await catalog.expectProductVisible('Merino Wool Throw');
  });

  test('Next button is disabled on the last page', async () => {
    await catalog.goToNextPage();
    await catalog.goToNextPage();

    await catalog.expectNextDisabled();
  });

  test('Previous button is enabled on the last page', async () => {
    await catalog.goToNextPage();
    await catalog.goToNextPage();

    await expect(catalog.prevBtn).toBeEnabled();
  });

  test('each page shows exactly 6 products', async () => {
    for (let p = 1; p <= 3; p++) {
      const titles = await catalog.getVisibleTitles();
      expect(titles.length).toBe(6);
      if (p < 3) await catalog.goToNextPage();
    }
  });

  /* ── page content verification ───────────────────────────────────── */
  test('page 1 shows correct products', async () => {
    const titles = await catalog.getVisibleTitles();
    expect(titles).toContain('Wireless Bluetooth Headphones');
    expect(titles).toContain('Minimalist Watch');
    expect(titles).toContain('Organic Cotton T-Shirt');
    expect(titles).toContain('Portable Power Bank');
    expect(titles).toContain('Ceramic Coffee Mug');
    expect(titles).toContain('Running Shoes');
  });

  test('page 2 shows correct products', async () => {
    await catalog.goToNextPage();

    const titles = await catalog.getVisibleTitles();
    expect(titles).toContain('Yoga Mat Pro');
    expect(titles).toContain('LED Desk Lamp');
    expect(titles).toContain('USB-C Hub 7-in-1');
    expect(titles).toContain('Travel Backpack');
    expect(titles).toContain('Polarized Sunglasses');
    expect(titles).toContain('Fleece Hoodie');
  });

  test('page 3 shows correct products', async () => {
    await catalog.goToNextPage();
    await catalog.goToNextPage();

    const titles = await catalog.getVisibleTitles();
    expect(titles).toContain('Insulated Water Bottle');
    expect(titles).toContain('Portable Bluetooth Speaker');
    expect(titles).toContain('Ceramic Planter Set');
    expect(titles).toContain('Athletic Shorts');
    expect(titles).toContain('Fitness Tracker Band');
    expect(titles).toContain('Merino Wool Throw');
  });

  /* ── pagination hidden when results fit on one page ─────────────── */
  test('pagination is hidden when category yields ≤6 results', async () => {
    // Sports: 3 products — fits on one page
    await catalog.categoryFilter('Sports').check();
    await expect(catalog.paginationNav).not.toBeVisible();
  });

  test('pagination is hidden when search yields ≤6 results', async () => {
    await catalog.search('headphones');
    await expect(catalog.paginationNav).not.toBeVisible();
  });

  /* ── filter/search resets page ───────────────────────────────────── */
  test('applying a category filter resets to page 1', async () => {
    await catalog.goToNextPage();
    await catalog.expectPageNumber(2, 3);

    await catalog.categoryFilter('Electronics').check();
    // Electronics = 5 products, still paginates if > 6... actually 5 ≤ 6 → no pagination
    await expect(catalog.paginationNav).not.toBeVisible();
    await catalog.expectResultCount('5 products found');
  });

  test('applying price filter resets to page 1', async () => {
    await catalog.goToNextPage();
    await catalog.expectPageNumber(2, 3);

    await catalog.priceFilter('under50').check();
    // 9 products → 2 pages
    await catalog.expectPageNumber(1, 2);
  });

  test('pagination nav is keyboard-accessible', async ({ page }) => {
    const nextBtn = catalog.nextBtn;
    await nextBtn.focus();
    await page.keyboard.press('Enter');

    await catalog.expectPageNumber(2, 3);

    const prevBtn = catalog.prevBtn;
    await prevBtn.focus();
    await page.keyboard.press('Space');

    await catalog.expectPageNumber(1, 3);
  });
});
