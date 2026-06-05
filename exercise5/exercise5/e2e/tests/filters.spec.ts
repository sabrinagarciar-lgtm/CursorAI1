import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from '../pages/ProductCatalogPage';

/**
 * Catalog breakdown (18 products total, 6 per page):
 *
 * Category counts:
 *   Electronics  5  (Headphones $149.99, Power Bank $49.99, USB-C Hub $39.99,
 *                     BT Speaker $79.99, Fitness Tracker $119)
 *   Apparel      3  (T-Shirt $34.99, Fleece Hoodie $64.99, Athletic Shorts $44)
 *   Home         4  (Mug $24.99, LED Lamp $45, Planter $32, Merino Throw $88)
 *   Sports       3  (Running Shoes $129.99, Yoga Mat $38, Water Bottle $22)
 *   Accessories  3  (Watch $89, Backpack $72, Sunglasses $59)
 *
 * Price brackets:
 *   under50  9  (Mug, T-Shirt, Water Bottle, Planter, Yoga Mat, Athletic Shorts,
 *                LED Lamp, USB-C Hub, Power Bank)
 *   50-100   6  (Watch, Fleece Hoodie, Backpack, Sunglasses, BT Speaker, Merino Throw)
 *   over100  3  (Headphones, Running Shoes, Fitness Tracker)
 */

test.describe('Filters', () => {
  let catalog: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    catalog = new ProductCatalogPage(page);
    await catalog.goto();
  });

  /* ── single category filter ─────────────────────────────────────── */
  test.describe('Apply single filter', () => {
    test('Electronics filter shows only electronics', async () => {
      await catalog.categoryFilter('Electronics').check();

      await catalog.expectResultCount('5 products found');
      await catalog.expectProductVisible('Wireless Bluetooth Headphones');
      await catalog.expectProductVisible('Portable Power Bank');
      await catalog.expectProductHidden('Organic Cotton T-Shirt');
      await catalog.expectProductHidden('Running Shoes');
    });

    test('Apparel filter shows only apparel', async () => {
      await catalog.categoryFilter('Apparel').check();

      await catalog.expectResultCount('3 products found');
      await catalog.expectProductVisible('Organic Cotton T-Shirt');
      await catalog.expectProductVisible('Fleece Hoodie');
      await catalog.expectProductVisible('Athletic Shorts');
      await catalog.expectProductHidden('Wireless Bluetooth Headphones');
    });

    test('Home filter shows only home products', async () => {
      await catalog.categoryFilter('Home').check();

      await catalog.expectResultCount('4 products found');
      await catalog.expectProductVisible('Ceramic Coffee Mug');
      await catalog.expectProductVisible('LED Desk Lamp');
      await catalog.expectProductVisible('Ceramic Planter Set');
      await catalog.expectProductVisible('Merino Wool Throw');
    });

    test('Sports filter shows only sports products', async () => {
      await catalog.categoryFilter('Sports').check();

      await catalog.expectResultCount('3 products found');
      await catalog.expectProductVisible('Running Shoes');
      await catalog.expectProductVisible('Yoga Mat Pro');
      await catalog.expectProductVisible('Insulated Water Bottle');
    });

    test('Accessories filter shows only accessories', async () => {
      await catalog.categoryFilter('Accessories').check();

      await catalog.expectResultCount('3 products found');
      await catalog.expectProductVisible('Minimalist Watch');
      await catalog.expectProductVisible('Travel Backpack');
      await catalog.expectProductVisible('Polarized Sunglasses');
    });

    test('price filter — under $50 shows 9 products', async () => {
      await catalog.priceFilter('under50').check();

      await catalog.expectResultCount('9 products found');
      await catalog.expectProductHidden('Wireless Bluetooth Headphones');
      await catalog.expectProductVisible('Portable Power Bank');
    });

    test('price filter — $50–$100 shows 6 products', async () => {
      await catalog.priceFilter('50-100').check();

      await catalog.expectResultCount('6 products found');
      await catalog.expectProductVisible('Minimalist Watch');
      await catalog.expectProductVisible('Portable Bluetooth Speaker');
      await catalog.expectProductHidden('Wireless Bluetooth Headphones');
    });

    test('price filter — over $100 shows 3 products', async () => {
      await catalog.priceFilter('over100').check();

      await catalog.expectResultCount('3 products found');
      await catalog.expectProductVisible('Wireless Bluetooth Headphones');
      await catalog.expectProductVisible('Running Shoes');
      await catalog.expectProductVisible('Fitness Tracker Band');
    });

    test('unchecking a filter restores previous results', async () => {
      await catalog.categoryFilter('Sports').check();
      await catalog.expectResultCount('3 products found');

      await catalog.categoryFilter('Sports').uncheck();
      await catalog.expectResultCount('18 products found');
    });
  });

  /* ── multiple filters ───────────────────────────────────────────── */
  test.describe('Apply multiple filters', () => {
    test('two categories ORed together', async () => {
      await catalog.categoryFilter('Apparel').check();
      await catalog.categoryFilter('Sports').check();

      // 3 Apparel + 3 Sports = 6
      await catalog.expectResultCount('6 products found');
      await catalog.expectProductVisible('Organic Cotton T-Shirt');
      await catalog.expectProductVisible('Running Shoes');
      await catalog.expectProductHidden('Wireless Bluetooth Headphones');
    });

    test('Electronics category + under-$50 price bracket', async () => {
      await catalog.categoryFilter('Electronics').check();
      await catalog.priceFilter('under50').check();

      // Power Bank ($49.99) + USB-C Hub ($39.99) = 2
      await catalog.expectResultCount('2 products found');
      await catalog.expectProductVisible('Portable Power Bank');
      await catalog.expectProductVisible('USB-C Hub 7-in-1');
      await catalog.expectProductHidden('Wireless Bluetooth Headphones');
      await catalog.expectProductHidden('Fitness Tracker Band');
    });

    test('Home category + $50–$100 price bracket', async () => {
      await catalog.categoryFilter('Home').check();
      await catalog.priceFilter('50-100').check();

      // Merino Throw ($88) = 1
      await catalog.expectResultCount('1 product found');
      await catalog.expectProductVisible('Merino Wool Throw');
    });

    test('Apparel + over $100 yields empty state', async () => {
      await catalog.categoryFilter('Apparel').check();
      await catalog.priceFilter('over100').check();

      // No Apparel product costs > $100
      await catalog.expectEmptyState();
      await catalog.expectResultCount('0 products found');
    });

    test('search + single category filter combine', async () => {
      await catalog.search('cotton');
      await catalog.categoryFilter('Apparel').check();

      await catalog.expectResultCount('1 product found');
      await catalog.expectProductVisible('Organic Cotton T-Shirt');
    });

    test('search + price filter combine', async () => {
      await catalog.search('speaker');
      await catalog.priceFilter('50-100').check();

      await catalog.expectResultCount('1 product found');
      await catalog.expectProductVisible('Portable Bluetooth Speaker');
    });

    test('three categories selected simultaneously', async () => {
      await catalog.categoryFilter('Electronics').check();
      await catalog.categoryFilter('Apparel').check();
      await catalog.categoryFilter('Home').check();

      // 5 + 3 + 4 = 12
      await catalog.expectResultCount('12 products found');
    });

    test('multiple price brackets ORed together', async () => {
      await catalog.priceFilter('under50').check();
      await catalog.priceFilter('over100').check();

      // 9 under + 3 over = 12
      await catalog.expectResultCount('12 products found');
    });
  });

  /* ── clear all filters ──────────────────────────────────────────── */
  test.describe('Clear all filters', () => {
    test('clear button is disabled when no filters are active', async () => {
      await expect(catalog.clearFiltersBtn).toBeDisabled();
    });

    test('clear button enables when search has text', async () => {
      await catalog.search('mug');
      await expect(catalog.clearFiltersBtn).toBeEnabled();
    });

    test('clear button enables when category filter is active', async () => {
      await catalog.categoryFilter('Sports').check();
      await expect(catalog.clearFiltersBtn).toBeEnabled();
    });

    test('clear button enables when priority filter is active', async () => {
      await catalog.priorityFilter('Medium').check();
      await expect(catalog.clearFiltersBtn).toBeEnabled();
    });

    test('clear all after search restores full catalog', async () => {
      await catalog.search('running');
      await catalog.expectResultCount('1 product found');

      await catalog.clearAll();

      await catalog.expectSearchValue('');
      await catalog.expectResultCount('18 products found');
    });

    test('clear all after category filter restores full catalog', async () => {
      await catalog.categoryFilter('Apparel').check();
      await catalog.expectResultCount('3 products found');

      await catalog.clearAll();

      await catalog.expectCategoryChecked('Apparel', false);
      await catalog.expectResultCount('18 products found');
    });

    test('clear all resets sort to Featured', async () => {
      await catalog.selectSort('price-asc');
      await catalog.search('watch');
      await catalog.clearAll();

      await catalog.expectSortValue('featured');
    });

    test('clear all after complex state (search + category + price + priority)', async () => {
      await catalog.search('running');
      await catalog.categoryFilter('Sports').check();
      await catalog.priceFilter('over100').check();
      await catalog.priorityFilter('High').check();

      await catalog.clearAll();

      await catalog.expectSearchValue('');
      await catalog.expectCategoryChecked('Sports', false);
      await expect(catalog.priceFilter('over100')).not.toBeChecked();
      await catalog.expectPriorityChecked('High', false);
      await catalog.expectResultCount('18 products found');
      await catalog.expectSortValue('featured');
    });

    test('clear all resets pagination to page 1', async () => {
      await catalog.goToNextPage();
      await catalog.expectPageNumber(2, 3);

      await catalog.categoryFilter('Accessories').check();
      await catalog.clearAll();

      await catalog.expectResultCount('18 products found');
      await catalog.expectPageNumber(1, 3);
    });
  });
});
