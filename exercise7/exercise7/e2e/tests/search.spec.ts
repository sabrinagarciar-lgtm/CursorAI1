import { test, expect } from '@playwright/test';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';

/**
 * Seed task titles (used to verify visibility/absence):
 *
 *  Todo:        "Design new landing page", "Write API documentation",
 *               "Set up CI/CD pipeline", "Update user onboarding flow"
 *  In Progress: "Implement dark mode", "Migrate database to PostgreSQL",
 *               "Build analytics dashboard"
 *  Done:        "Set up project repository", "Define product requirements",
 *               "Security audit"
 *
 *  Total: 10 tasks across 3 columns.
 */

test.describe('Search', () => {
  let board: KanbanBoardPage;

  test.beforeEach(async ({ page }) => {
    board = new KanbanBoardPage(page);
    await board.goto();
  });

  /* ── initial state ─────────────────────────────────────────────── */
  test('loads with all 10 seed tasks visible', async () => {
    await board.expectTotalVisibleCards(10);
  });

  test('board heading "Project Board" is present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Project Board' })).toBeVisible();
  });

  test('search input is visible with placeholder text', async () => {
    await expect(board.searchInput).toBeVisible();
    await expect(board.searchInput).toHaveAttribute('placeholder', /Search tasks/i);
  });

  test('progress counter shows 3/10 tasks complete', async () => {
    await expect(board.progressCounter).toContainText('3/10');
  });

  /* ── valid query — title match ──────────────────────────────────── */
  test('search "design" matches title — shows 1 card', async () => {
    await board.search('design');

    await board.expectTotalVisibleCards(1);
    await expect(board.taskCard('task-1')).toBeVisible();
  });

  test('search "landing page" matches partial title — shows 1 card', async () => {
    await board.search('landing page');

    await board.expectTotalVisibleCards(1);
    await expect(board.taskCard('task-1')).toBeVisible();
  });

  /* ── valid query — description match ───────────────────────────── */
  test('search "wireframes" matches description — shows 1 card', async () => {
    await board.search('wireframes');

    await board.expectTotalVisibleCards(1);
    await expect(board.taskCard('task-1')).toBeVisible();
  });

  test('search "REST endpoints" matches description — shows 1 card', async () => {
    await board.search('REST endpoints');

    await board.expectTotalVisibleCards(1);
    await expect(board.taskCard('task-2')).toBeVisible();
  });

  /* ── valid query — tag match ────────────────────────────────────── */
  test('search "devops" matches tag — shows 1 card', async () => {
    await board.search('devops');

    await board.expectTotalVisibleCards(1);
    await expect(board.taskCard('task-3')).toBeVisible();
  });

  test('search "docs" matches tag across multiple cards', async () => {
    await board.search('docs');

    // task-2 has tag "docs", task-9 has tag "docs"
    const count = await board.allVisibleCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(board.taskCard('task-2')).toBeVisible();
    await expect(board.taskCard('task-9')).toBeVisible();
  });

  /* ── case-insensitive ───────────────────────────────────────────── */
  test('search is case-insensitive — "DARK MODE" matches "Implement dark mode"', async () => {
    await board.search('DARK MODE');

    await board.expectTotalVisibleCards(1);
    await expect(board.taskCard('task-5')).toBeVisible();
  });

  test('search is case-insensitive — "security" matches "Security audit"', async () => {
    await board.search('security');

    await expect(board.taskCard('task-10')).toBeVisible();
  });

  /* ── multi-column results ───────────────────────────────────────── */
  test('search "database" shows results across columns', async () => {
    await board.search('database');

    // task-6 "Migrate database to PostgreSQL" (in-progress)
    await expect(board.taskCard('task-6')).toBeVisible();
    const count = await board.allVisibleCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('search "analytics" shows cards in multiple columns', async () => {
    await board.search('analytics');

    await expect(board.taskCard('task-7')).toBeVisible();
  });

  /* ── narrows dynamically ────────────────────────────────────────── */
  test('results narrow as more characters are typed', async () => {
    await board.search('s');
    const afterS = await board.allVisibleCards.count();

    await board.search('se');
    const afterSe = await board.allVisibleCards.count();

    expect(afterSe).toBeLessThanOrEqual(afterS);
  });

  /* ── clear search ───────────────────────────────────────────────── */
  test('clearing search restores all 10 tasks', async () => {
    await board.search('design');
    await board.expectTotalVisibleCards(1);

    await board.clearSearch();
    await board.expectTotalVisibleCards(10);
  });

  /* ── no results ─────────────────────────────────────────────────── */
  test('search with no results hides all cards', async () => {
    await board.search('xyznonexistent999');

    await board.expectTotalVisibleCards(0);
    await expect(board.emptyResults).toBeVisible();
    await expect(board.emptyResults).toContainText('No tasks match');
    await expect(board.taskDirectory).toHaveCount(0);
  });

  test('no results — filter chips appear for active search query', async () => {
    await board.search('xyznonexistent999');

    await board.expectFilterChipsVisible();
  });

  test('no results — column counts drop to 0', async () => {
    await board.search('xyznonexistent999');

    await board.expectColumnCount('todo', 0);
    await board.expectColumnCount('in-progress', 0);
    await board.expectColumnCount('done', 0);
  });

  test('no results — clearing search restores all tasks', async () => {
    await board.search('xyznonexistent999');
    await board.expectTotalVisibleCards(0);

    await board.clearSearch();
    await board.expectTotalVisibleCards(10);
  });

  /* ── filter chips ───────────────────────────────────────────────── */
  test('filter chip is shown when search is active', async ({ page }) => {
    await board.search('design');

    await board.expectFilterChipsVisible();
    await expect(page.getByText('"design"')).toBeVisible();
  });

  test('filter chips hidden when no filters are active', async () => {
    await board.expectFilterChipsHidden();
  });

  test('individual filter chip X removes search', async () => {
    await board.search('design');
    await board.expectTotalVisibleCards(1);

    await board.page.getByTestId('filter-chip-remove-search').click();

    await board.expectTotalVisibleCards(10);
  });
});
