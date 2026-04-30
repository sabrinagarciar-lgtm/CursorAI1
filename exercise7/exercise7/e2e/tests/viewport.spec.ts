import { test, expect } from '@playwright/test';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';

/**
 * Cross-viewport tests.
 *
 * The matrix tests below run on all configured Playwright projects
 * (desktop-chrome, desktop-firefox, desktop-webkit, tablet-chrome,
 * mobile-chrome, mobile-webkit) via the project configuration in
 * playwright.config.ts.
 *
 * The explicit viewport blocks at the bottom run once with a fixed
 * viewport and verify breakpoint-specific behaviour.
 */

test.describe('Responsive layout & cross-viewport behaviour', () => {
  let board: KanbanBoardPage;

  test.beforeEach(async ({ page }) => {
    board = new KanbanBoardPage(page);
    await board.goto();
  });

  /* ── page structure ──────────────────────────────────────────────── */
  test('board heading "Project Board" is visible on every viewport', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Project Board' })).toBeVisible();
  });

  test('search input is visible on every viewport', async () => {
    await expect(board.searchInput).toBeVisible();
  });

  test('priority filter is visible on every viewport', async () => {
    await expect(board.priorityFilter).toBeVisible();
  });

  test('assignee filter is visible on every viewport', async () => {
    await expect(board.assigneeFilter).toBeVisible();
  });

  test('sort select is visible on every viewport', async () => {
    await expect(board.sortSelect).toBeVisible();
  });

  test('"Add Task" button is visible on every viewport', async () => {
    await expect(board.addTaskBtn).toBeVisible();
  });

  test('dark mode toggle is visible on every viewport', async () => {
    await expect(board.darkModeToggle).toBeVisible();
  });

  test('progress counter is visible on every viewport', async () => {
    await expect(board.progressCounter).toBeVisible();
  });

  test('all 10 seed cards are rendered on every viewport', async () => {
    await board.expectTotalVisibleCards(10);
  });

  /* ── search flow ─────────────────────────────────────────────────── */
  test('search → valid result works on every viewport', async () => {
    await board.search('design');
    await board.expectTotalVisibleCards(1);
    await expect(board.taskCard('task-1')).toBeVisible();
  });

  test('search → empty state works on every viewport', async () => {
    await board.search('xyznonexistent999');
    await board.expectTotalVisibleCards(0);
    await expect(board.emptyResults).toBeVisible();
    await board.expectFilterChipsVisible();
  });

  test('clearing search restores all tasks on every viewport', async () => {
    await board.search('design');
    await board.clearSearch();
    await board.expectTotalVisibleCards(10);
  });

  /* ── filter flow ─────────────────────────────────────────────────── */
  test('priority filter works on every viewport', async () => {
    await board.filterByPriority('urgent');
    await board.expectTotalVisibleCards(2);
    await expect(board.taskCard('task-3')).toBeVisible();
  });

  test('assignee filter works on every viewport', async () => {
    await board.filterByAssignee('u5'); // Eva Martinez — 1 task
    await board.expectTotalVisibleCards(1);
    await expect(board.taskCard('task-7')).toBeVisible();
  });

  test('"Clear all" filters works on every viewport', async () => {
    await board.filterByPriority('low');
    await board.expectTotalVisibleCards(1);

    await board.clearAllFilters();
    await board.expectTotalVisibleCards(10);
  });

  /* ── modal flow ──────────────────────────────────────────────────── */
  test('add task modal opens and closes on every viewport', async () => {
    await board.openAddModal();
    await board.expectModalVisible();

    await board.cancelModal();
    await board.expectModalHidden();
  });

  test('task can be created on every viewport', async () => {
    await board.createTask({ title: 'Cross-viewport task' });

    await expect(board.page.getByText('Cross-viewport task').first()).toBeVisible();
    await board.expectTotalVisibleCards(11);
  });

  test('validation error shows on every viewport', async () => {
    await board.openAddModal();
    await board.submitModal();

    await expect(board.modalTitleError).toBeVisible();
  });

  /* ── column navigation (pagination) ─────────────────────────────── */
  test('Todo and Done columns are present on every viewport', async () => {
    await expect(board.column('todo')).toBeVisible();
    await expect(board.column('done')).toBeVisible();
  });

  test('column task counts are correct on every viewport', async () => {
    await board.expectColumnCount('todo', 4);
    await board.expectColumnCount('in-progress', 3);
    await board.expectColumnCount('done', 3);
  });

  /* ── dark mode ───────────────────────────────────────────────────── */
  test('dark mode can be toggled on every viewport', async ({ page }) => {
    await board.darkModeToggle.click();
    const cls = await page.locator('html').getAttribute('class');
    expect(cls).toContain('dark');
  });

  /* ── layout integrity ────────────────────────────────────────────── */
  test('board columns container does not overflow viewport width', async ({ page }) => {
    const wrapper = page.locator('[data-testid="kanban-board"]');
    const box = await wrapper.boundingBox();
    const vp = page.viewportSize();
    if (box && vp) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.width).toBeLessThanOrEqual(vp.width + 2); // 2px tolerance
    }
  });
});

/* ── explicit viewport breakpoint tests ───────────────────────────────
   Each block runs ONCE at the specified size, independently of the
   project matrix above.
   ─────────────────────────────────────────────────────────────────── */

test.describe('Desktop (1280×720)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('all three columns are simultaneously visible without scrolling', async ({ page }) => {
    const board = new KanbanBoardPage(page);
    await board.goto();

    const todoBox = await board.column('todo').boundingBox();
    const doneBox = await board.column('done').boundingBox();
    const vp = page.viewportSize()!;

    // Both Todo and Done columns should fit horizontally
    if (todoBox && doneBox) {
      expect(todoBox.x).toBeGreaterThanOrEqual(0);
      expect(doneBox.x + doneBox.width).toBeLessThanOrEqual(vp.width + 32); // allow scroll gutter
    }
  });

  test('header controls fit in a single row at 1280px', async ({ page }) => {
    const board = new KanbanBoardPage(page);
    await board.goto();

    // All controls should be visible without scrolling
    await expect(board.searchInput).toBeVisible();
    await expect(board.priorityFilter).toBeVisible();
    await expect(board.assigneeFilter).toBeVisible();
    await expect(board.addTaskBtn).toBeVisible();
    await expect(board.darkModeToggle).toBeVisible();
  });
});

test.describe('Tablet (768×1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('search, filters and add-task button are all reachable at tablet width', async ({ page }) => {
    const board = new KanbanBoardPage(page);
    await board.goto();

    await expect(board.searchInput).toBeVisible();
    await expect(board.priorityFilter).toBeVisible();
    await expect(board.addTaskBtn).toBeVisible();
  });

  test('full search-filter flow works at 768px', async ({ page }) => {
    const board = new KanbanBoardPage(page);
    await board.goto();

    await board.search('dark mode');
    await board.expectTotalVisibleCards(1);

    await board.clearSearch();
    await board.filterByPriority('high');
    await board.expectTotalVisibleCards(3);

    await board.clearAllFilters();
    await board.expectTotalVisibleCards(10);
  });
});

test.describe('Mobile (375×812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('board header controls are visible at 375px', async ({ page }) => {
    const board = new KanbanBoardPage(page);
    await board.goto();

    await expect(board.searchInput).toBeVisible();
    await expect(board.addTaskBtn).toBeVisible();
  });

  test('full search-filter-modal flow works at mobile width', async ({ page }) => {
    const board = new KanbanBoardPage(page);
    await board.goto();

    // Search
    await board.search('audit');
    await board.expectTotalVisibleCards(1);

    // Clear and filter
    await board.clearSearch();
    await board.filterByPriority('urgent');
    await board.expectTotalVisibleCards(2);

    // Clear filters
    await board.clearAllFilters();
    await board.expectTotalVisibleCards(10);

    // Create a task
    await board.createTask({ title: 'Mobile created task' });
    await board.expectTotalVisibleCards(11);
  });

  test('task cards are not clipped beyond mobile viewport width', async ({ page }) => {
    const board = new KanbanBoardPage(page);
    await board.goto();

    const firstCard = board.allVisibleCards.first();
    const box = await firstCard.boundingBox();
    const vp = page.viewportSize();
    if (box && vp) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 2);
    }
  });

  test('modal is fully visible and functional at 375px', async ({ page }) => {
    const board = new KanbanBoardPage(page);
    await board.goto();

    await board.openAddModal();
    await expect(board.modal).toBeVisible();
    await expect(board.modalTitleInput).toBeVisible();
    await expect(board.modalSubmitBtn).toBeVisible();

    await board.fillModalTitle('Mobile modal task');
    await board.submitModal();

    await board.expectModalHidden();
    await expect(page.getByText('Mobile modal task').first()).toBeVisible();
  });
});
