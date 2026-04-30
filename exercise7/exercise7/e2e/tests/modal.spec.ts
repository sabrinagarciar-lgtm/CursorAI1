import { test, expect } from '@playwright/test';
import { KanbanBoardPage } from '../pages/KanbanBoardPage';

test.describe('Add / Edit Task Modal', () => {
  let board: KanbanBoardPage;

  test.beforeEach(async ({ page }) => {
    board = new KanbanBoardPage(page);
    await board.goto();
  });

  /* ── opening the modal ──────────────────────────────────────────── */
  test('global "Add Task" button opens modal with heading "Add New Task"', async () => {
    await board.openAddModal();

    await expect(board.modalHeading).toHaveText('Add New Task');
  });

  test('column header + button opens modal', async () => {
    await board.openAddModalFromColumn('in-progress');

    await board.expectModalVisible();
  });

  test('column footer "Add task" button opens modal', async () => {
    await board.page.getByTestId('column-footer-add-todo').click();

    await board.expectModalVisible();
  });

  test('modal title input is auto-focused on open', async () => {
    await board.openAddModal();

    await expect(board.modalTitleInput).toBeFocused();
  });

  test('modal contains all required form fields', async () => {
    await board.openAddModal();

    await expect(board.modalTitleInput).toBeVisible();
    await expect(board.modalDescriptionInput).toBeVisible();
    await expect(board.modalColumnSelect).toBeVisible();
    await expect(board.modalPrioritySelect).toBeVisible();
    await expect(board.modalAssigneeSelect).toBeVisible();
    await expect(board.modalDueDateInput).toBeVisible();
    await expect(board.modalTagsInput).toBeVisible();
  });

  test('modal priority select has all four options', async () => {
    await board.openAddModal();

    const options = await board.modalPrioritySelect.locator('option').allTextContents();
    expect(options).toContain('Low');
    expect(options).toContain('Medium');
    expect(options).toContain('High');
    expect(options).toContain('Urgent');
  });

  test('modal column select has all three column options', async () => {
    await board.openAddModal();

    const options = await board.modalColumnSelect.locator('option').allTextContents();
    expect(options).toContain('Todo');
    expect(options).toContain('In Progress');
    expect(options).toContain('Done');
  });

  /* ── closing the modal ──────────────────────────────────────────── */
  test('Cancel button closes modal without creating a task', async () => {
    await board.openAddModal();
    await board.fillModalTitle('Should not be saved');
    await board.cancelModal();

    await board.expectModalHidden();
    await board.expectTotalVisibleCards(10);
  });

  test('X (close) button dismisses modal', async () => {
    await board.openAddModal();
    await board.closeModalWithX();

    await board.expectModalHidden();
  });

  test('Escape key closes modal', async () => {
    await board.openAddModal();
    await board.page.keyboard.press('Escape');

    await board.expectModalHidden();
  });

  test('clicking backdrop dismisses modal', async () => {
    await board.openAddModal();
    await board.page.getByTestId('modal-backdrop').click({ position: { x: 4, y: 4 } });

    await board.expectModalHidden();
  });

  /* ── validation — empty title ───────────────────────────────────── */
  test('submitting empty title shows required error', async () => {
    await board.openAddModal();
    await board.submitModal();

    await expect(board.modalTitleError).toBeVisible();
    await expect(board.modalTitleError).toContainText('required');
    await board.expectModalVisible();
  });

  test('submitting title with < 3 chars shows length error', async () => {
    await board.openAddModal();
    await board.fillModalTitle('AB');
    await board.submitModal();

    await expect(board.modalTitleError).toBeVisible();
    await expect(board.modalTitleError).toContainText('3 characters');
  });

  test('error clears when user types a valid title', async () => {
    await board.openAddModal();
    await board.submitModal();
    await expect(board.modalTitleError).toBeVisible();

    await board.fillModalTitle('Valid task title');
    await expect(board.modalTitleError).not.toBeVisible();
  });

  test('modal stays open when validation fails', async () => {
    await board.openAddModal();
    await board.submitModal();

    await board.expectModalVisible();
  });

  /* ── successful task creation ───────────────────────────────────── */
  test('creates task with title only — appears in Todo column', async () => {
    await board.createTask({ title: 'My brand new task' });

    const card = board.page.getByText('My brand new task').first();
    await expect(card).toBeVisible();
    await board.expectTotalVisibleCards(11);
  });

  test('creates task in "In Progress" column — appears in that column', async () => {
    await board.createTask({ title: 'Mid-flight task', column: 'in-progress' });

    const cardsBefore = await board.cardsInColumn('in-progress').count();
    expect(cardsBefore).toBe(4); // 3 seed + 1 new
  });

  test('creates task in Done column — increments Done count', async () => {
    const before = await board.columnCount('done').textContent();
    await board.createTask({ title: 'Already done', column: 'done' });

    const after = await board.columnCount('done').textContent();
    expect(Number(after)).toBe(Number(before) + 1);
  });

  test('creates task with all fields filled', async () => {
    await board.createTask({
      title: 'Full featured task',
      description: 'A complete task with all fields set.',
      column: 'in-progress',
      priority: 'urgent',
      assigneeId: 'u3',
      dueDate: '2026-06-01',
      tags: 'qa, testing',
    });

    await expect(board.page.getByText('Full featured task').first()).toBeVisible();
    await board.expectTotalVisibleCards(11);
  });

  test('live tag preview appears as chips while typing', async () => {
    await board.openAddModal();
    await board.modalTagsInput.fill('frontend, backend');

    // Two chip spans should appear inside the form
    const chips = board.page.locator('[data-testid="task-modal"] span.px-1\\.5.py-0\\.5');
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  /* ── edit task ──────────────────────────────────────────────────── */
  test('edit button opens modal with heading "Edit Task"', async () => {
    await board.hoverCard('task-1');
    await board.taskEditBtn('task-1').click();

    await expect(board.modalHeading).toHaveText('Edit Task');
  });

  test('edit modal pre-fills existing task values', async () => {
    await board.hoverCard('task-1');
    await board.taskEditBtn('task-1').click();

    await expect(board.modalTitleInput).toHaveValue('Design new landing page');
    await expect(board.modalPrioritySelect).toHaveValue('high');
    await expect(board.modalColumnSelect).toHaveValue('todo');
  });

  test('editing title updates the card on the board', async () => {
    await board.hoverCard('task-2');
    await board.taskEditBtn('task-2').click();
    await board.modalTitleInput.fill('Updated documentation task');
    await board.submitModal();

    await expect(board.taskTitle('task-2')).toHaveText('Updated documentation task');
    await board.expectModalHidden();
  });

  test('editing priority updates badge on the card', async () => {
    await board.hoverCard('task-4');
    await board.taskEditBtn('task-4').click();
    await board.modalPrioritySelect.selectOption('urgent');
    await board.submitModal();

    await expect(board.taskPriority('task-4')).toContainText('Urgent');
  });

  test('editing column moves card to the new column', async () => {
    // task-4 is in todo; move it to done
    await board.hoverCard('task-4');
    await board.taskEditBtn('task-4').click();
    await board.modalColumnSelect.selectOption('done');
    await board.submitModal();

    await board.expectColumnCount('done', 4);  // was 3, now 4
    await board.expectColumnCount('todo', 3);  // was 4, now 3
  });

  test('Save Changes button is shown (not "Create Task") in edit mode', async () => {
    await board.hoverCard('task-1');
    await board.taskEditBtn('task-1').click();

    await expect(board.modalSubmitBtn).toHaveText('Save Changes');
  });

  /* ── error states ───────────────────────────────────────────────── */
  test('clearing title in edit mode and submitting shows validation error', async () => {
    await board.hoverCard('task-1');
    await board.taskEditBtn('task-1').click();
    await board.modalTitleInput.clear();
    await board.submitModal();

    await expect(board.modalTitleError).toBeVisible();
  });

  test('task count does not change after failed submission', async () => {
    await board.openAddModal();
    await board.submitModal(); // empty title — fails

    await board.expectTotalVisibleCards(10);
  });
});
