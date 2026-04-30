import { test, expect } from '@playwright/test';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';

/**
 * Paginated "Matching tasks" directory, global sort options, and simulated load error.
 * These features live alongside the Kanban columns (sort applies to the directory only).
 */
test.describe('Directory — pagination, sort, and error handling', () => {
  test.describe.configure({ mode: 'serial' });

  let board: KanbanBoardPage;

  test.beforeEach(async ({ page }) => {
    board = new KanbanBoardPage(page);
    await board.goto('/');
  });

  test('matching tasks directory shows pagination info for all seed tasks', async () => {
    await expect(board.taskDirectory).toBeVisible();
    await expect(board.paginationInfo).toContainText('Page 1 of 4');
    await expect(board.paginationInfo).toContainText('10 tasks');
    await expect(board.paginatedTaskTitles).toHaveCount(3);
  });

  test('pagination navigates between pages', async () => {
    await expect(board.paginatedTaskTitles.nth(0)).toHaveText('Design new landing page');
    await expect(board.paginationPrev).toBeDisabled();

    await board.paginationNext.click();
    await expect(board.paginationInfo).toContainText('Page 2 of 4');
    await expect(board.paginatedTaskTitles.nth(0)).toHaveText('Update user onboarding flow');

    await board.paginationPrev.click();
    await expect(board.paginationInfo).toContainText('Page 1 of 4');
  });

  test('pagination next is disabled on the last page', async () => {
    await board.paginationNext.click();
    await board.paginationNext.click();
    await board.paginationNext.click();
    await expect(board.paginationInfo).toContainText('Page 4 of 4');
    await expect(board.paginationNext).toBeDisabled();
    await expect(board.paginationPrev).toBeEnabled();
  });

  test('sort by title orders directory rows alphabetically', async () => {
    await board.sortSelect.selectOption('title');
    await expect(board.paginatedTaskTitles.first()).toHaveText('Build analytics dashboard');
    await board.paginationNext.click();
    await expect(board.paginatedTaskTitles.first()).toHaveText('Implement dark mode');
  });

  test('sort by due date shows earliest due tasks first', async () => {
    await board.sortSelect.selectOption('due-date');
    await expect(board.paginatedTaskTitles.first()).toHaveText('Set up project repository');
  });

  test('sort by created date shows newest tasks first', async () => {
    await board.sortSelect.selectOption('created-desc');
    await expect(board.paginatedTaskTitles.first()).toHaveText('Update user onboarding flow');
  });

  test('filtered results update pagination counts', async () => {
    await board.filterByPriority('urgent');
    await expect(board.paginationInfo).toContainText('2 tasks');
    await expect(board.paginationInfo).toContainText('Page 1 of 1');
    await expect(board.paginatedTaskTitles).toHaveCount(2);
  });

  test('simulated load error shows alert; retry restores the board', async ({ page }) => {
    await page.goto('/?e2eError=1');
    await expect(board.boardError).toBeVisible();
    await expect(board.boardErrorMessage).toContainText('Unable to load');
    await expect(board.searchInput).toHaveCount(0);

    await board.boardErrorRetry.click();
    await expect(board.boardError).toHaveCount(0);
    await expect(board.searchInput).toBeVisible();
    await expect(board.taskDirectory).toBeVisible();
  });

  test('empty filters show no directory and empty-results banner', async () => {
    await board.search('__NO_MATCHING_TASKS_999__');
    await expect(board.emptyResults).toBeVisible();
    await expect(board.emptyResults).toContainText('No tasks match');
    await expect(board.taskDirectory).toHaveCount(0);
  });
});
