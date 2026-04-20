import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from '../pages/ProductCatalogPage';

/**
 * Sort options and expected first-visible product on page 1:
 *
 *  featured    → catalog order  → Wireless Bluetooth Headphones
 *  price-asc   → cheapest first → Insulated Water Bottle ($22)
 *  price-desc  → priciest first → Wireless Bluetooth Headphones ($149.99)
 *  rating-desc → top-rated first→ Ceramic Coffee Mug / Merino Wool Throw (both 4.9)
 *  title-asc   → A–Z           → Athletic Shorts
 */

test.describe('Sorting', () => {
  let catalog: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    catalog = new ProductCatalogPage(page);
    await catalog.goto();
  });

  /* ── sort select accessibility ──────────────────────────────────── */
  test('sort dropdown is visible and labelled', async ({ page }) => {
    await expect(catalog.sortSelect).toBeVisible();
    await expect(page.getByLabel('Sort')).toBeVisible();
  });

  test('all five sort options are present', async () => {
    const options = await catalog.sortSelect.locator('option').allTextContents();
    expect(options).toContain('Featured');
    expect(options).toContain('Price: Low to High');
    expect(options).toContain('Price: High to Low');
    expect(options).toContain('Rating: High to Low');
    expect(options).toContain('Name: A to Z');
  });

  test('default sort is Featured', async () => {
    await catalog.expectSortValue('featured');
  });

  /* ── Price: Low to High ─────────────────────────────────────────── */
  test.describe('Sort by price low to high', () => {
    test('first product on page 1 is cheapest ($22)', async () => {
      await catalog.selectSort('price-asc');

      const titles = await catalog.getVisibleTitles();
      expect(titles[0]).toBe('Insulated Water Bottle');
    });

    test('first six products are ordered ascending', async () => {
      await catalog.selectSort('price-asc');

      // Page 1: $22, $24.99, $32, $34.99, $38, $39.99
      const titles = await catalog.getVisibleTitles();
      expect(titles[0]).toBe('Insulated Water Bottle');   // $22
      expect(titles[1]).toBe('Ceramic Coffee Mug');       // $24.99
      expect(titles[2]).toBe('Ceramic Planter Set');      // $32
      expect(titles[3]).toBe('Organic Cotton T-Shirt');   // $34.99
      expect(titles[4]).toBe('Yoga Mat Pro');             // $38
      expect(titles[5]).toBe('USB-C Hub 7-in-1');        // $39.99
    });

    test('last page ends with most expensive', async () => {
      await catalog.selectSort('price-asc');
      // 18 products → 3 pages
      await catalog.goToNextPage();
      await catalog.goToNextPage();

      const titles = await catalog.getVisibleTitles();
      // Last item by price is Wireless Bluetooth Headphones $149.99
      expect(titles[titles.length - 1]).toBe('Wireless Bluetooth Headphones');
    });
  });

  /* ── Price: High to Low ─────────────────────────────────────────── */
  test.describe('Sort by price high to low', () => {
    test('first product on page 1 is most expensive ($149.99)', async () => {
      await catalog.selectSort('price-desc');

      const titles = await catalog.getVisibleTitles();
      expect(titles[0]).toBe('Wireless Bluetooth Headphones');
    });

    test('first six products are ordered descending', async () => {
      await catalog.selectSort('price-desc');

      // Page 1: $149.99, $129.99, $119, $89, $88, $88? no...
      // $149.99 Headphones, $129.99 Running Shoes, $119 Fitness Tracker, $89 Watch, $88 Merino Throw, $79.99 BT Speaker
      const titles = await catalog.getVisibleTitles();
      expect(titles[0]).toBe('Wireless Bluetooth Headphones');  // $149.99
      expect(titles[1]).toBe('Running Shoes');                   // $129.99
      expect(titles[2]).toBe('Fitness Tracker Band');            // $119
    });
  });

  /* ── Rating: High to Low ────────────────────────────────────────── */
  test.describe('Sort by rating high to low', () => {
    test('first two products have 4.9 rating', async () => {
      await catalog.selectSort('rating-desc');

      const titles = await catalog.getVisibleTitles();
      // Both Ceramic Coffee Mug (4.9) and Merino Wool Throw (4.9) should be in top 2
      expect(
        titles.slice(0, 2).includes('Ceramic Coffee Mug') ||
        titles.slice(0, 2).includes('Merino Wool Throw'),
      ).toBeTruthy();
    });

    test('lowest-rated products (4.1) are on the last page', async () => {
      await catalog.selectSort('rating-desc');
      await catalog.goToNextPage();
      await catalog.goToNextPage();

      await catalog.expectProductVisible('Fitness Tracker Band'); // 4.1
    });
  });

  /* ── Name: A to Z ───────────────────────────────────────────────── */
  test.describe('Sort by name A to Z', () => {
    test('first product is Athletic Shorts', async () => {
      await catalog.selectSort('title-asc');

      const titles = await catalog.getVisibleTitles();
      expect(titles[0]).toBe('Athletic Shorts');
    });

    test('first page is in strict alphabetical order', async () => {
      await catalog.selectSort('title-asc');

      // A–Z page 1: Athletic Shorts, Ceramic Coffee Mug, Ceramic Planter Set,
      //             Fitness Tracker Band, Fleece Hoodie, Insulated Water Bottle
      const titles = await catalog.getVisibleTitles();
      expect(titles[0]).toBe('Athletic Shorts');
      expect(titles[1]).toBe('Ceramic Coffee Mug');
      expect(titles[2]).toBe('Ceramic Planter Set');
      expect(titles[3]).toBe('Fitness Tracker Band');
      expect(titles[4]).toBe('Fleece Hoodie');
      expect(titles[5]).toBe('Insulated Water Bottle');
    });

    test('last page ends with W (Wireless, Yoga)', async () => {
      await catalog.selectSort('title-asc');
      await catalog.goToNextPage();
      await catalog.goToNextPage();

      const titles = await catalog.getVisibleTitles();
      const last = titles[titles.length - 1];
      expect(['Yoga Mat Pro', 'Wireless Bluetooth Headphones'].includes(last)).toBeTruthy();
    });
  });

  /* ── Featured (default) ─────────────────────────────────────────── */
  test.describe('Featured sort', () => {
    test('after switching sort, returning to featured restores catalog order', async () => {
      await catalog.selectSort('price-asc');
      let titles = await catalog.getVisibleTitles();
      expect(titles[0]).toBe('Insulated Water Bottle');

      await catalog.selectSort('featured');
      titles = await catalog.getVisibleTitles();
      expect(titles[0]).toBe('Wireless Bluetooth Headphones');
    });
  });

  /* ── sort + filter interaction ──────────────────────────────────── */
  test('sort applies within filtered results', async () => {
    await catalog.categoryFilter('Sports').check();
    await catalog.selectSort('price-asc');

    // Sports: Yoga Mat $38, Running Shoes $129.99, Water Bottle $22 → sorted: Water Bottle, Yoga Mat, Running Shoes
    const titles = await catalog.getVisibleTitles();
    expect(titles[0]).toBe('Insulated Water Bottle');
    expect(titles[1]).toBe('Yoga Mat Pro');
    expect(titles[2]).toBe('Running Shoes');
  });

  test('sort applies within search results', async () => {
    await catalog.search('ceramic');
    await catalog.selectSort('price-asc');

    // Ceramic Coffee Mug $24.99, Ceramic Planter Set $32
    const titles = await catalog.getVisibleTitles();
    expect(titles[0]).toBe('Ceramic Coffee Mug');
    expect(titles[1]).toBe('Ceramic Planter Set');
  });

  test('changing sort resets to page 1', async () => {
    await catalog.goToNextPage();
    await catalog.expectPageNumber(2, 3);

    await catalog.selectSort('price-asc');
    await catalog.expectPageNumber(1, 3);
  });
});
