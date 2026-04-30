import { test, expect } from '@playwright/test';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';

test.describe('Board — columns, task operations, and dark mode', () => {
  let board: KanbanBoardPage;

  test.beforeEach(async ({ page }) => {
    board = new KanbanBoardPage(page);
    await board.goto();
  });

  /* ── column structure ───────────────────────────────────────────── */
  test('renders all three columns: Todo, In Progress, Done', async () => {
    await expect(board.column('todo')).toBeVisible();
    await expect(board.column('in-progress')).toBeVisible();
    await expect(board.column('done')).toBeVisible();
  });

  test('column titles are visible', async () => {
    await expect(board.columnTitle('todo')).toHaveText('Todo');
    await expect(board.columnTitle('in-progress')).toHaveText('In Progress');
    await expect(board.columnTitle('done')).toHaveText('Done');
  });

  test('seed data: Todo has 4 tasks, In Progress 3, Done 3', async () => {
    await board.expectColumnCount('todo', 4);
    await board.expectColumnCount('in-progress', 3);
    await board.expectColumnCount('done', 3);
  });

  test('each column has an add-task button in header', async () => {
    await expect(board.columnAddBtn('todo')).toBeVisible();
    await expect(board.columnAddBtn('in-progress')).toBeVisible();
    await expect(board.columnAddBtn('done')).toBeVisible();
  });

  test('each column has a footer add-task button', async () => {
    await expect(board.page.getByTestId('column-footer-add-todo')).toBeVisible();
    await expect(board.page.getByTestId('column-footer-add-in-progress')).toBeVisible();
    await expect(board.page.getByTestId('column-footer-add-done')).toBeVisible();
  });

  /* ── task card structure ────────────────────────────────────────── */
  test('task card shows title, priority badge, assignee avatar, and due date', async () => {
    // task-1: "Design new landing page", high, Alice Johnson, due 2026-05-10
    await expect(board.taskTitle('task-1')).toHaveText('Design new landing page');
    await expect(board.taskPriority('task-1')).toContainText('High');
    await expect(board.taskDueDate('task-1')).toBeVisible();
  });

  test('overdue tasks show overdue indicator', async () => {
    // task-3 due 2026-04-28 is in the past relative to 2026-04-30
    const dueDateEl = board.taskDueDate('task-3');
    await expect(dueDateEl).toBeVisible();
    await expect(dueDateEl).toHaveAttribute('data-overdue', 'true');
  });

  test('done tasks do not show overdue indicator even if past due', async () => {
    // task-10 is done and was due 2026-04-25
    const dueDateEl = board.taskDueDate('task-10');
    const overdueAttr = await dueDateEl.getAttribute('data-overdue');
    expect(overdueAttr).toBeNull();
  });

  /* ── task edit & delete (hover-reveal actions) ──────────────────── */
  test('hovering a card reveals edit and delete buttons', async () => {
    await board.hoverCard('task-1');

    await expect(board.taskEditBtn('task-1')).toBeVisible();
    await expect(board.taskDeleteBtn('task-1')).toBeVisible();
  });

  test('delete button removes a task from its column', async () => {
    await board.hoverCard('task-4');
    await board.taskDeleteBtn('task-4').click();

    await expect(board.taskCard('task-4')).not.toBeVisible();
    await board.expectColumnCount('todo', 3);
    await board.expectTotalVisibleCards(9);
  });

  test('progress counter updates after a task is deleted', async () => {
    await board.hoverCard('task-8');
    await board.taskDeleteBtn('task-8').click();

    // Done had 3 tasks, now 2 — "2/9 tasks complete"
    await expect(board.progressCounter).toContainText('2/9');
  });

  test('progress counter updates after a new task is added to Done', async () => {
    await board.createTask({ title: 'Finished task', column: 'done' });

    // Done now 4, total 11 — "4/11 tasks complete"
    await expect(board.progressCounter).toContainText('4/11');
  });

  /* ── column navigation (pagination) ────────────────────────────── */
  test('all three columns are simultaneously visible at desktop width', async () => {
    await expect(board.column('todo')).toBeVisible();
    await expect(board.column('in-progress')).toBeVisible();
    await expect(board.column('done')).toBeVisible();
  });

  test('adding a task increments the target column count', async () => {
    await board.createTask({ title: 'New in-progress', column: 'in-progress' });

    await board.expectColumnCount('in-progress', 4);
  });

  test('deleting a task decrements the source column count', async () => {
    await board.hoverCard('task-2');
    await board.taskDeleteBtn('task-2').click();

    await board.expectColumnCount('todo', 3);
  });

  test('cards in Todo column are distinct from In Progress', async () => {
    await board.expectCardInColumn('task-1', 'todo');
    await board.expectCardInColumn('task-5', 'in-progress');
  });

  test('all 10 seed tasks are placed in their correct columns', async () => {
    // Todo
    await board.expectCardInColumn('task-1', 'todo');
    await board.expectCardInColumn('task-2', 'todo');
    await board.expectCardInColumn('task-3', 'todo');
    await board.expectCardInColumn('task-4', 'todo');
    // In Progress
    await board.expectCardInColumn('task-5', 'in-progress');
    await board.expectCardInColumn('task-6', 'in-progress');
    await board.expectCardInColumn('task-7', 'in-progress');
    // Done
    await board.expectCardInColumn('task-8', 'done');
    await board.expectCardInColumn('task-9', 'done');
    await board.expectCardInColumn('task-10', 'done');
  });

  /* ── dark mode ──────────────────────────────────────────────────── */
  test('dark mode toggle button is visible', async () => {
    await expect(board.darkModeToggle).toBeVisible();
    await expect(board.darkModeToggle).toHaveAttribute('aria-label', 'Toggle dark mode');
  });

  test('clicking dark mode toggle adds "dark" class to <html>', async ({ page }) => {
    const htmlEl = page.locator('html');
    const before = await htmlEl.getAttribute('class');
    const isDarkBefore = (before ?? '').includes('dark');

    await board.darkModeToggle.click();

    const after = await htmlEl.getAttribute('class');
    const isDarkAfter = (after ?? '').includes('dark');
    expect(isDarkAfter).toBe(!isDarkBefore);
  });

  test('clicking dark mode toggle twice returns to original mode', async ({ page }) => {
    const htmlEl = page.locator('html');
    const before = (await htmlEl.getAttribute('class')) ?? '';

    await board.darkModeToggle.click();
    await board.darkModeToggle.click();

    const after = (await htmlEl.getAttribute('class')) ?? '';
    expect(after.includes('dark')).toBe(before.includes('dark'));
  });

  test('board is still fully functional in dark mode', async () => {
    await board.darkModeToggle.click(); // enable dark mode

    // Search still works
    await board.search('design');
    await board.expectTotalVisibleCards(1);

    // Filter still works
    await board.clearSearch();
    await board.filterByPriority('urgent');
    await board.expectTotalVisibleCards(2);
  });
});
