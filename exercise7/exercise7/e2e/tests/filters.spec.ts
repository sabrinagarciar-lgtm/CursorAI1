import { test, expect } from '@playwright/test';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';

/**
 * Priority breakdown (10 tasks total):
 *   urgent (2):  task-3 "Set up CI/CD pipeline"         (todo)
 *                task-10 "Security audit"               (done)
 *   high   (3):  task-1 "Design new landing page"       (todo)
 *                task-6 "Migrate database to PostgreSQL" (in-progress)
 *                task-9 "Define product requirements"    (done)
 *   medium (4):  task-2 "Write API documentation"       (todo)
 *                task-5 "Implement dark mode"            (in-progress)
 *                task-7 "Build analytics dashboard"      (in-progress)
 *                task-8 "Set up project repository"      (done)
 *   low    (1):  task-4 "Update user onboarding flow"   (todo)
 *
 * Assignee breakdown:
 *   Alice Johnson (u1, 3):  task-1, task-5, task-10
 *   Bob Smith     (u2, 2):  task-2, task-8
 *   Carol White   (u3, 2):  task-4, task-9
 *   David Lee     (u4, 2):  task-3, task-6
 *   Eva Martinez  (u5, 1):  task-7
 */

test.describe('Filters', () => {
  let board: KanbanBoardPage;

  test.beforeEach(async ({ page }) => {
    board = new KanbanBoardPage(page);
    await board.goto();
  });

  /* ── initial state ─────────────────────────────────────────────── */
  test('priority filter defaults to "All Priorities"', async () => {
    await expect(board.priorityFilter).toHaveValue('all');
  });

  test('assignee filter defaults to "All Assignees"', async () => {
    await expect(board.assigneeFilter).toHaveValue('all');
  });

  test('all priority options are present in dropdown', async () => {
    const options = await board.priorityFilter.locator('option').allTextContents();
    expect(options).toContain('All Priorities');
    expect(options).toContain('Urgent');
    expect(options).toContain('High');
    expect(options).toContain('Medium');
    expect(options).toContain('Low');
  });

  test('all assignee options are present in dropdown', async () => {
    const options = await board.assigneeFilter.locator('option').allTextContents();
    expect(options).toContain('All Assignees');
    expect(options).toContain('Unassigned');
    expect(options).toContain('Alice Johnson');
    expect(options).toContain('Bob Smith');
    expect(options).toContain('Carol White');
    expect(options).toContain('David Lee');
    expect(options).toContain('Eva Martinez');
  });

  /* ── apply single priority filter ──────────────────────────────── */
  test.describe('Apply single priority filter', () => {
    test('urgent filter — shows 2 tasks (task-3, task-10)', async () => {
      await board.filterByPriority('urgent');

      await board.expectTotalVisibleCards(2);
      await expect(board.taskCard('task-3')).toBeVisible();
      await expect(board.taskCard('task-10')).toBeVisible();
      await expect(board.taskCard('task-1')).not.toBeVisible();
    });

    test('high filter — shows 3 tasks (task-1, task-6, task-9)', async () => {
      await board.filterByPriority('high');

      await board.expectTotalVisibleCards(3);
      await expect(board.taskCard('task-1')).toBeVisible();
      await expect(board.taskCard('task-6')).toBeVisible();
      await expect(board.taskCard('task-9')).toBeVisible();
      await expect(board.taskCard('task-3')).not.toBeVisible();
    });

    test('medium filter — shows 4 tasks', async () => {
      await board.filterByPriority('medium');

      await board.expectTotalVisibleCards(4);
      await expect(board.taskCard('task-2')).toBeVisible();
      await expect(board.taskCard('task-5')).toBeVisible();
      await expect(board.taskCard('task-7')).toBeVisible();
      await expect(board.taskCard('task-8')).toBeVisible();
    });

    test('low filter — shows 1 task (task-4)', async () => {
      await board.filterByPriority('low');

      await board.expectTotalVisibleCards(1);
      await expect(board.taskCard('task-4')).toBeVisible();
    });

    test('resetting priority to "all" restores all 10 tasks', async () => {
      await board.filterByPriority('urgent');
      await board.expectTotalVisibleCards(2);

      await board.filterByPriority('all');
      await board.expectTotalVisibleCards(10);
    });

    test('priority filter badge shows in filter chips', async () => {
      await board.filterByPriority('high');

      await board.expectFilterChipsVisible();
    });
  });

  /* ── apply single assignee filter ──────────────────────────────── */
  test.describe('Apply single assignee filter', () => {
    test('Alice Johnson filter — shows 3 tasks', async () => {
      await board.filterByAssignee('u1');

      await board.expectTotalVisibleCards(3);
      await expect(board.taskCard('task-1')).toBeVisible();
      await expect(board.taskCard('task-5')).toBeVisible();
      await expect(board.taskCard('task-10')).toBeVisible();
    });

    test('Bob Smith filter — shows 2 tasks (task-2, task-8)', async () => {
      await board.filterByAssignee('u2');

      await board.expectTotalVisibleCards(2);
      await expect(board.taskCard('task-2')).toBeVisible();
      await expect(board.taskCard('task-8')).toBeVisible();
    });

    test('Carol White filter — shows 2 tasks (task-4, task-9)', async () => {
      await board.filterByAssignee('u3');

      await board.expectTotalVisibleCards(2);
      await expect(board.taskCard('task-4')).toBeVisible();
      await expect(board.taskCard('task-9')).toBeVisible();
    });

    test('David Lee filter — shows 2 tasks (task-3, task-6)', async () => {
      await board.filterByAssignee('u4');

      await board.expectTotalVisibleCards(2);
      await expect(board.taskCard('task-3')).toBeVisible();
      await expect(board.taskCard('task-6')).toBeVisible();
    });

    test('Eva Martinez filter — shows 1 task (task-7)', async () => {
      await board.filterByAssignee('u5');

      await board.expectTotalVisibleCards(1);
      await expect(board.taskCard('task-7')).toBeVisible();
    });

    test('resetting assignee to "all" restores all 10 tasks', async () => {
      await board.filterByAssignee('u5');
      await board.expectTotalVisibleCards(1);

      await board.filterByAssignee('all');
      await board.expectTotalVisibleCards(10);
    });

    test('assignee filter badge shows in filter chips', async () => {
      await board.filterByAssignee('u1');

      await board.expectFilterChipsVisible();
    });
  });

  /* ── apply multiple filters ─────────────────────────────────────── */
  test.describe('Apply multiple filters', () => {
    test('high priority + Alice Johnson — shows 1 task (task-1)', async () => {
      await board.filterByPriority('high');
      await board.filterByAssignee('u1');

      await board.expectTotalVisibleCards(1);
      await expect(board.taskCard('task-1')).toBeVisible();
    });

    test('medium priority + Bob Smith — shows 1 task (task-2, task-8)', async () => {
      await board.filterByPriority('medium');
      await board.filterByAssignee('u2');

      await board.expectTotalVisibleCards(2);
      await expect(board.taskCard('task-2')).toBeVisible();
      await expect(board.taskCard('task-8')).toBeVisible();
    });

    test('urgent priority + Bob Smith — shows 0 tasks (empty state)', async () => {
      await board.filterByPriority('urgent');
      await board.filterByAssignee('u2');

      await board.expectTotalVisibleCards(0);
      await expect(board.emptyResults).toBeVisible();
    });

    test('low priority + Eva Martinez — shows 0 tasks (empty state)', async () => {
      await board.filterByPriority('low');
      await board.filterByAssignee('u5');

      await board.expectTotalVisibleCards(0);
      await expect(board.emptyResults).toBeVisible();
    });

    test('search + priority filter combine', async () => {
      await board.search('database');
      await board.filterByPriority('high');

      // task-6 matches both "database" and high priority
      await board.expectTotalVisibleCards(1);
      await expect(board.taskCard('task-6')).toBeVisible();
    });

    test('search + assignee filter combine', async () => {
      await board.search('dark mode');
      await board.filterByAssignee('u1');

      await board.expectTotalVisibleCards(1);
      await expect(board.taskCard('task-5')).toBeVisible();
    });

    test('search + priority + assignee all active — two filter chips shown', async () => {
      await board.search('design');
      await board.filterByPriority('high');
      await board.filterByAssignee('u1');

      await board.expectFilterChipsVisible();
      // All three chips: "design", priority, assignee
      const chips = board.page.locator('[data-testid="active-filter-chips"] span.inline-flex');
      const count = await chips.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('column counts reflect combined filters', async () => {
      await board.filterByPriority('high');
      // high: task-1 (todo), task-6 (in-progress), task-9 (done) → 1 each
      await board.expectColumnCount('todo', 1);
      await board.expectColumnCount('in-progress', 1);
      await board.expectColumnCount('done', 1);
    });
  });

  /* ── clear all filters ──────────────────────────────────────────── */
  test.describe('Clear all filters', () => {
    test('"Clear all" button is not visible when no filters active', async () => {
      await board.expectFilterChipsHidden();
    });

    test('"Clear all" button appears when priority filter is active', async () => {
      await board.filterByPriority('urgent');

      await board.expectFilterChipsVisible();
      await expect(board.clearAllFiltersBtn).toBeVisible();
    });

    test('"Clear all" button appears when assignee filter is active', async () => {
      await board.filterByAssignee('u1');

      await expect(board.clearAllFiltersBtn).toBeVisible();
    });

    test('"Clear all" after priority filter restores all 10 tasks', async () => {
      await board.filterByPriority('low');
      await board.expectTotalVisibleCards(1);

      await board.clearAllFilters();

      await expect(board.priorityFilter).toHaveValue('all');
      await board.expectTotalVisibleCards(10);
    });

    test('"Clear all" after assignee filter restores all 10 tasks', async () => {
      await board.filterByAssignee('u5');
      await board.expectTotalVisibleCards(1);

      await board.clearAllFilters();

      await expect(board.assigneeFilter).toHaveValue('all');
      await board.expectTotalVisibleCards(10);
    });

    test('"Clear all" after search restores all 10 tasks', async () => {
      await board.search('design');
      await board.expectTotalVisibleCards(1);

      await board.clearAllFilters();

      await expect(board.searchInput).toHaveValue('');
      await board.expectTotalVisibleCards(10);
    });

    test('"Clear all" resets all three controls at once', async () => {
      await board.search('design');
      await board.filterByPriority('high');
      await board.filterByAssignee('u1');

      await board.clearAllFilters();

      await expect(board.searchInput).toHaveValue('');
      await expect(board.priorityFilter).toHaveValue('all');
      await expect(board.assigneeFilter).toHaveValue('all');
      await board.expectTotalVisibleCards(10);
      await board.expectFilterChipsHidden();
    });
  });

  /* ── sort / priority-label verification ─────────────────────────── */
  test.describe('Sort options — priority labels on cards', () => {
    test('urgent tasks show "Urgent" priority badge', async () => {
      await board.filterByPriority('urgent');

      await expect(board.taskPriority('task-3')).toContainText('Urgent');
      await expect(board.taskPriority('task-10')).toContainText('Urgent');
    });

    test('high tasks show "High" priority badge', async () => {
      await board.filterByPriority('high');

      await expect(board.taskPriority('task-1')).toContainText('High');
      await expect(board.taskPriority('task-6')).toContainText('High');
    });

    test('medium tasks show "Medium" priority badge', async () => {
      await board.filterByPriority('medium');

      await expect(board.taskPriority('task-2')).toContainText('Medium');
    });

    test('low tasks show "Low" priority badge', async () => {
      await board.filterByPriority('low');

      await expect(board.taskPriority('task-4')).toContainText('Low');
    });

    test('all four priority labels are present on the board by default', async () => {
      const labels = await board.page
        .locator('[data-testid^="task-priority-"]')
        .allTextContents();
      const unique = new Set(labels.map((l) => l.trim()));
      expect(unique.has('Urgent')).toBe(true);
      expect(unique.has('High')).toBe(true);
      expect(unique.has('Medium')).toBe(true);
      expect(unique.has('Low')).toBe(true);
    });

    test('switching priority filter changes which cards are visible', async () => {
      await board.filterByPriority('urgent');
      const urgentCount = await board.allVisibleCards.count();

      await board.filterByPriority('low');
      const lowCount = await board.allVisibleCards.count();

      expect(urgentCount).not.toEqual(lowCount);
    });
  });
});
