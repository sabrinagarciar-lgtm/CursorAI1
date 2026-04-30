import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for the KanbanBoard component.
 *
 * Centralises all selector look-ups and common interactions so that
 * individual spec files stay concise and selector changes are fixed
 * in one place.
 *
 * Seed data (from types.ts INITIAL_COLUMNS):
 *  Todo (4):        task-1 "Design new landing page"     high    Alice Johnson
 *                   task-2 "Write API documentation"     medium  Bob Smith
 *                   task-3 "Set up CI/CD pipeline"       urgent  David Lee
 *                   task-4 "Update user onboarding flow" low     Carol White
 *  In Progress (3): task-5 "Implement dark mode"         medium  Alice Johnson
 *                   task-6 "Migrate database to Postgres" high   David Lee
 *                   task-7 "Build analytics dashboard"   medium  Eva Martinez
 *  Done (3):        task-8 "Set up project repository"   medium  Bob Smith
 *                   task-9 "Define product requirements" high    Carol White
 *                   task-10 "Security audit"             urgent  Alice Johnson
 */
export class KanbanBoardPage {
  readonly page: Page;

  /* ── header controls ───────────────────────────────────────────── */
  readonly searchInput: Locator;
  readonly priorityFilter: Locator;
  readonly assigneeFilter: Locator;
  readonly sortSelect: Locator;
  readonly addTaskBtn: Locator;
  readonly darkModeToggle: Locator;
  readonly progressCounter: Locator;

  /* ── directory (sorted, paginated flat list) ─────────────────── */
  readonly taskDirectory: Locator;
  readonly paginationInfo: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;
  readonly paginatedTaskTitles: Locator;
  readonly emptyResults: Locator;

  /* ── simulated load error ──────────────────────────────────────── */
  readonly boardError: Locator;
  readonly boardErrorMessage: Locator;
  readonly boardErrorRetry: Locator;

  /* ── active filter chips ───────────────────────────────────────── */
  readonly activeFilterChips: Locator;
  readonly clearAllFiltersBtn: Locator;

  /* ── board ─────────────────────────────────────────────────────── */
  readonly boardColumns: Locator;

  /* ── modal ─────────────────────────────────────────────────────── */
  readonly modal: Locator;
  readonly modalHeading: Locator;
  readonly modalTitleInput: Locator;
  readonly modalDescriptionInput: Locator;
  readonly modalColumnSelect: Locator;
  readonly modalPrioritySelect: Locator;
  readonly modalAssigneeSelect: Locator;
  readonly modalDueDateInput: Locator;
  readonly modalTagsInput: Locator;
  readonly modalSubmitBtn: Locator;
  readonly modalCancelBtn: Locator;
  readonly modalCloseBtn: Locator;
  readonly modalTitleError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchInput = page.getByTestId('search-input');
    this.priorityFilter = page.getByTestId('priority-filter');
    this.assigneeFilter = page.getByTestId('assignee-filter');
    this.sortSelect = page.getByTestId('sort-select');
    this.addTaskBtn = page.getByTestId('add-task-btn');
    this.darkModeToggle = page.getByTestId('dark-mode-toggle');
    this.progressCounter = page.getByTestId('progress-counter');

    this.taskDirectory = page.getByTestId('task-directory');
    this.paginationInfo = page.getByTestId('pagination-info');
    this.paginationPrev = page.getByTestId('pagination-prev');
    this.paginationNext = page.getByTestId('pagination-next');
    this.paginatedTaskTitles = page.getByTestId('paginated-task-title');
    this.emptyResults = page.getByTestId('empty-results');

    this.boardError = page.getByTestId('board-error');
    this.boardErrorMessage = page.getByTestId('board-error-message');
    this.boardErrorRetry = page.getByTestId('board-error-retry');

    this.activeFilterChips = page.getByTestId('active-filter-chips');
    this.clearAllFiltersBtn = page.getByTestId('clear-all-filters');

    this.boardColumns = page.getByTestId('board-columns');

    this.modal = page.getByTestId('task-modal');
    this.modalHeading = page.getByTestId('modal-heading');
    this.modalTitleInput = page.getByTestId('modal-title-input');
    this.modalDescriptionInput = page.getByTestId('modal-description-input');
    this.modalColumnSelect = page.getByTestId('modal-column-select');
    this.modalPrioritySelect = page.getByTestId('modal-priority-select');
    this.modalAssigneeSelect = page.getByTestId('modal-assignee-select');
    this.modalDueDateInput = page.getByTestId('modal-due-date-input');
    this.modalTagsInput = page.getByTestId('modal-tags-input');
    this.modalSubmitBtn = page.getByTestId('modal-submit-btn');
    this.modalCancelBtn = page.getByTestId('modal-cancel-btn');
    this.modalCloseBtn = page.getByTestId('modal-close-btn');
    this.modalTitleError = page.getByTestId('modal-title-error');
  }

  /* ── navigation ────────────────────────────────────────────────── */
  async goto(path = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByTestId('kanban-board')).toBeVisible();
  }

  /* ── column helpers ────────────────────────────────────────────── */
  column(id: 'todo' | 'in-progress' | 'done'): Locator {
    return this.page.getByTestId(`column-${id}`);
  }

  columnTitle(id: 'todo' | 'in-progress' | 'done'): Locator {
    return this.page.getByTestId(`column-title-${id}`);
  }

  columnCount(id: 'todo' | 'in-progress' | 'done'): Locator {
    return this.page.getByTestId(`column-count-${id}`);
  }

  columnAddBtn(id: 'todo' | 'in-progress' | 'done'): Locator {
    return this.page.getByTestId(`column-add-btn-${id}`);
  }

  /* ── task card helpers ─────────────────────────────────────────── */
  taskCard(id: string): Locator {
    return this.page.getByTestId(`task-card-${id}`);
  }

  taskTitle(id: string): Locator {
    return this.page.getByTestId(`task-title-${id}`);
  }

  taskPriority(id: string): Locator {
    return this.page.getByTestId(`task-priority-${id}`);
  }

  taskDueDate(id: string): Locator {
    return this.page.getByTestId(`task-due-date-${id}`);
  }

  taskEditBtn(id: string): Locator {
    return this.page.getByTestId(`task-edit-btn-${id}`);
  }

  taskDeleteBtn(id: string): Locator {
    return this.page.getByTestId(`task-delete-btn-${id}`);
  }

  /** All task cards currently visible anywhere on the board. */
  get allVisibleCards(): Locator {
    return this.page.locator('[data-testid^="task-card-"]');
  }

  /** Task cards in a specific column's droppable area. */
  cardsInColumn(colId: 'todo' | 'in-progress' | 'done'): Locator {
    return this.page
      .getByTestId(`column-droppable-${colId}`)
      .locator('[data-testid^="task-card-"]');
  }

  /* ── search helpers ────────────────────────────────────────────── */
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  /* ── filter helpers ────────────────────────────────────────────── */
  async filterByPriority(priority: 'all' | 'urgent' | 'high' | 'medium' | 'low') {
    await this.priorityFilter.selectOption(priority);
  }

  async filterByAssignee(value: string) {
    await this.assigneeFilter.selectOption(value);
  }

  async clearAllFilters() {
    await this.clearAllFiltersBtn.click();
  }

  /* ── modal helpers ─────────────────────────────────────────────── */
  async openAddModal() {
    await this.addTaskBtn.click();
    await expect(this.modal).toBeVisible();
  }

  async openAddModalFromColumn(colId: 'todo' | 'in-progress' | 'done') {
    await this.columnAddBtn(colId).click();
    await expect(this.modal).toBeVisible();
  }

  async fillModalTitle(title: string) {
    await this.modalTitleInput.fill(title);
  }

  async submitModal() {
    await this.modalSubmitBtn.click();
  }

  async cancelModal() {
    await this.modalCancelBtn.click();
  }

  async closeModalWithX() {
    await this.modalCloseBtn.click();
  }

  async createTask(opts: {
    title: string;
    description?: string;
    column?: 'todo' | 'in-progress' | 'done';
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
    tags?: string;
  }) {
    await this.openAddModal();
    await this.fillModalTitle(opts.title);
    if (opts.description) await this.modalDescriptionInput.fill(opts.description);
    if (opts.column) await this.modalColumnSelect.selectOption(opts.column);
    if (opts.priority) await this.modalPrioritySelect.selectOption(opts.priority);
    if (opts.assigneeId) await this.modalAssigneeSelect.selectOption(opts.assigneeId);
    if (opts.dueDate) await this.modalDueDateInput.fill(opts.dueDate);
    if (opts.tags) await this.modalTagsInput.fill(opts.tags);
    await this.submitModal();
    await expect(this.modal).not.toBeVisible();
  }

  /* ── hover to reveal action buttons ───────────────────────────── */
  async hoverCard(taskId: string) {
    await this.taskCard(taskId).hover();
  }

  /* ── assertions ────────────────────────────────────────────────── */
  async expectColumnCount(colId: 'todo' | 'in-progress' | 'done', count: number) {
    await expect(this.columnCount(colId)).toHaveText(String(count));
  }

  async expectCardInColumn(taskId: string, colId: 'todo' | 'in-progress' | 'done') {
    const col = this.page.getByTestId(`column-droppable-${colId}`);
    await expect(col.getByTestId(`task-card-${taskId}`)).toHaveCount(1);
  }

  async expectTotalVisibleCards(count: number) {
    await expect(this.allVisibleCards).toHaveCount(count);
  }

  async expectModalVisible() {
    await expect(this.modal).toBeVisible();
  }

  async expectModalHidden() {
    await expect(this.modal).not.toBeVisible();
  }

  async expectFilterChipsVisible() {
    await expect(this.activeFilterChips).toBeVisible();
  }

  async expectFilterChipsHidden() {
    await expect(this.activeFilterChips).not.toBeVisible();
  }
}
