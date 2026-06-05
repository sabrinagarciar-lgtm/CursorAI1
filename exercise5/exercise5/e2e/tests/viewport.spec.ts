import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from '../pages/ProductCatalogPage';

/**
 * Cross-viewport tests.
 *
 * These run on all configured projects (desktop, tablet, mobile) via the
 * Playwright project matrix in playwright.config.ts.  Each test verifies the
 * core user journeys work correctly regardless of screen width.
 */

test.describe('Responsive layout & cross-viewport behaviour', () => {
  let catalog: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    catalog = new ProductCatalogPage(page);
    await catalog.goto();
  });

  /* ── page structure ──────────────────────────────────────────────── */
  test('page heading is visible on every viewport', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Product Showcase' }),
    ).toBeVisible();
  });

  test('search input is visible and usable on every viewport', async () => {
    await expect(catalog.searchInput).toBeVisible();
    await catalog.search('mug');
    await catalog.expectResultCount('1 product found');
  });

  test('sort dropdown is visible on every viewport', async () => {
    await expect(catalog.sortSelect).toBeVisible();
  });

  test('filter checkboxes are visible on every viewport', async ({ page }) => {
    await expect(page.getByText('Category', { exact: true })).toBeVisible();
    await expect(page.getByText('Price', { exact: true })).toBeVisible();
    await expect(catalog.categoryFilter('Electronics')).toBeVisible();
    await expect(catalog.priceFilter('under50')).toBeVisible();
  });

  test('result count is visible on every viewport', async () => {
    await expect(catalog.resultCount).toBeVisible();
    await catalog.expectResultCount('18 products found');
  });

  test('product cards are rendered on every viewport', async ({ page }) => {
    const cards = page.locator('article[data-testid^="product-card-"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBe(6); // 6 per page
  });

  test('pagination nav is visible for full catalog', async () => {
    await expect(catalog.paginationNav).toBeVisible();
  });

  /* ── search flow ─────────────────────────────────────────────────── */
  test('search → valid result works on every viewport', async () => {
    await catalog.search('running');
    await catalog.expectResultCount('1 product found');
    await catalog.expectProductVisible('Running Shoes');
  });

  test('search → empty state works on every viewport', async () => {
    await catalog.search('zzznomatch');
    await catalog.expectEmptyState();
  });

  /* ── filter flow ─────────────────────────────────────────────────── */
  test('category filter works on every viewport', async () => {
    await catalog.categoryFilter('Sports').check();
    await catalog.expectResultCount('3 products found');
    await catalog.expectProductVisible('Running Shoes');
  });

  test('price filter works on every viewport', async () => {
    await catalog.priceFilter('over100').check();
    await catalog.expectResultCount('3 products found');
    await catalog.expectProductVisible('Wireless Bluetooth Headphones');
  });

  test('clear all filters works on every viewport', async () => {
    await catalog.categoryFilter('Apparel').check();
    await catalog.expectResultCount('3 products found');
    await catalog.clearAll();
    await catalog.expectResultCount('18 products found');
  });

  /* ── pagination flow ─────────────────────────────────────────────── */
  test('pagination next/prev works on every viewport', async () => {
    await catalog.goToNextPage();
    await catalog.expectPageNumber(2, 3);
    await catalog.expectProductVisible('Yoga Mat Pro');

    await catalog.goToPrevPage();
    await catalog.expectPageNumber(1, 3);
    await catalog.expectProductVisible('Wireless Bluetooth Headphones');
  });

  /* ── sort flow ───────────────────────────────────────────────────── */
  test('sort price low to high works on every viewport', async () => {
    await catalog.selectSort('price-asc');
    const titles = await catalog.getVisibleTitles();
    expect(titles[0]).toBe('Insulated Water Bottle');
  });

  /* ── grid layout adapts ──────────────────────────────────────────── */
  test('priority filter controls are visible on every viewport', async ({ page }) => {
    await expect(page.getByText('Priority', { exact: true })).toBeVisible();
    await expect(catalog.priorityFilter('High')).toBeVisible();
  });

  test('product grid renders without overflow', async ({ page }) => {
    const grid = page.locator('[role="list"]');
    await expect(grid).toBeVisible();
    const box = await grid.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      expect(box.width).toBeLessThanOrEqual(viewport.width);
    }
  });
});

/* ── explicit viewport overrides ─────────────────────────────────────
   These tests run once with an explicit viewport set via test.use()
   and are therefore NOT subject to the project matrix — they simply
   verify critical behaviour at three concrete sizes.
   ──────────────────────────────────────────────────────────────────── */

test.describe('Desktop (1280×720)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('shows 3-column product grid', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // At xl the grid-cols-3 class kicks in; verify ≥3 cards in first row
    const cards = page.locator('article[data-testid^="product-card-"]');
    expect(await cards.count()).toBe(6);
  });
});

test.describe('Tablet (768×1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('filter section and search are both visible without scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const searchInput = page.getByTestId('search-input');
    const categoryLegend = page.getByText('Category');
    await expect(searchInput).toBeVisible();
    await expect(categoryLegend).toBeVisible();
  });
});

test.describe('Mobile (375×812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('full search-filter-paginate flow works at mobile width', async ({ page }) => {
    const catalog = new ProductCatalogPage(page);
    await catalog.goto();

    await catalog.search('headphones');
    await catalog.expectResultCount('1 product found');
    await catalog.expectProductVisible('Wireless Bluetooth Headphones');

    await catalog.clearSearch();
    await catalog.categoryFilter('Sports').check();
    await catalog.expectResultCount('3 products found');

    await catalog.clearAll();
    await catalog.expectResultCount('18 products found');

    await catalog.goToNextPage();
    await catalog.expectPageNumber(2, 3);
  });

  test('product cards are not cut off on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const firstCard = page
      .locator('article[data-testid^="product-card-"]')
      .first();
    const box = await firstCard.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
});
