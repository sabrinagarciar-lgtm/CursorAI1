import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Column, Task, Priority, ColumnId, INITIAL_COLUMNS, ASSIGNEES, NewTaskFormData } from './types';
import BoardColumn from './BoardColumn';
import AddTaskModal from './AddTaskModal';

type PriorityFilter = Priority | 'all';
type AssigneeFilter = string | 'all';

/** Sort order for the read-only paginated directory (does not reorder drag-and-drop columns). */
type DirectorySortOption = 'default' | 'title' | 'due-date' | 'priority-desc' | 'created-desc';

const DIRECTORY_PAGE_SIZE = 3;

const PRIORITY_RANK: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

function flattenColumnOrder(cols: Column[]): Task[] {
  const order: ColumnId[] = ['todo', 'in-progress', 'done'];
  const list: Task[] = [];
  for (const id of order) {
    const c = cols.find((x) => x.id === id);
    if (c) list.push(...c.tasks);
  }
  return list;
}

function sortFlatTasks(tasks: Task[], sortBy: DirectorySortOption): Task[] {
  const copy = [...tasks];
  if (sortBy === 'default') return copy;
  switch (sortBy) {
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'due-date':
      return copy.sort((a, b) => {
        const ad = a.dueDate ?? '\uffff';
        const bd = b.dueDate ?? '\uffff';
        return ad.localeCompare(bd);
      });
    case 'priority-desc':
      return copy.sort(
        (a, b) =>
          PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.title.localeCompare(b.title)
      );
    case 'created-desc':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return copy;
  }
}

let taskIdCounter = 100;

function generateId(): string {
  return `task-${++taskIdCounter}`;
}

function applyDarkMode(enabled: boolean) {
  if (enabled) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const [directorySort, setDirectorySort] = useState<DirectorySortOption>('default');
  const [directoryPage, setDirectoryPage] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<ColumnId>('todo');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    applyDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('e2eError') === '1') {
      setLoadError(true);
    }
  }, []);

  const dismissLoadError = useCallback(() => {
    setLoadError(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('e2eError');
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '');
    window.history.replaceState({}, '', next);
  }, []);

  useEffect(() => {
    setDirectoryPage(1);
  }, [searchQuery, priorityFilter, assigneeFilter, directorySort]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      applyDarkMode(!prev);
      return !prev;
    });
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const sourceColIndex = columns.findIndex((c) => c.id === source.droppableId);
      const destColIndex = columns.findIndex((c) => c.id === destination.droppableId);
      if (sourceColIndex === -1 || destColIndex === -1) return;

      const newColumns = columns.map((col) => ({ ...col, tasks: [...col.tasks] }));
      const [movedTask] = newColumns[sourceColIndex].tasks.splice(source.index, 1);
      movedTask.columnId = newColumns[destColIndex].id;
      newColumns[destColIndex].tasks.splice(destination.index, 0, movedTask);

      setColumns(newColumns);
    },
    [columns]
  );

  const handleAddTask = useCallback(
    (formData: NewTaskFormData) => {
      const assignee = ASSIGNEES.find((a) => a.id === formData.assigneeId);
      const newTask: Task = {
        id: generateId(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assignee,
        dueDate: formData.dueDate || undefined,
        priority: formData.priority,
        columnId: formData.columnId,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setColumns((prev) =>
        prev.map((col) =>
          col.id === formData.columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
        )
      );
      setIsModalOpen(false);
      setEditingTask(null);
    },
    []
  );

  const handleEditTask = useCallback(
    (formData: NewTaskFormData) => {
      if (!editingTask) return;
      const assignee = ASSIGNEES.find((a) => a.id === formData.assigneeId);
      const updatedTask: Task = {
        ...editingTask,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assignee,
        dueDate: formData.dueDate || undefined,
        priority: formData.priority,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      if (editingTask.columnId !== formData.columnId) {
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === editingTask.columnId) {
              return { ...col, tasks: col.tasks.filter((t) => t.id !== editingTask.id) };
            }
            if (col.id === formData.columnId) {
              return { ...col, tasks: [...col.tasks, { ...updatedTask, columnId: formData.columnId }] };
            }
            return col;
          })
        );
      } else {
        setColumns((prev) =>
          prev.map((col) =>
            col.id === editingTask.columnId
              ? { ...col, tasks: col.tasks.map((t) => (t.id === editingTask.id ? updatedTask : t)) }
              : col
          )
        );
      }

      setIsModalOpen(false);
      setEditingTask(null);
    },
    [editingTask]
  );

  const handleDeleteTask = useCallback((taskId: string, columnId: ColumnId) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) } : col
      )
    );
  }, []);

  const openAddModal = useCallback((colId: ColumnId) => {
    setEditingTask(null);
    setDefaultColumnId(colId);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setDefaultColumnId(task.columnId);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.tags ?? []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee =
        assigneeFilter === 'all' ||
        (assigneeFilter === 'unassigned' ? !task.assignee : task.assignee?.id === assigneeFilter);
      return matchesSearch && matchesPriority && matchesAssignee;
    }),
  }));

  const sortedFlatTasks = useMemo(() => {
    const flat = flattenColumnOrder(filteredColumns);
    return sortFlatTasks(flat, directorySort);
  }, [filteredColumns, directorySort]);

  const totalFiltered = sortedFlatTasks.length;
  const directoryTotalPages = Math.max(1, Math.ceil(totalFiltered / DIRECTORY_PAGE_SIZE));

  useEffect(() => {
    setDirectoryPage((p) => Math.min(Math.max(1, p), directoryTotalPages));
  }, [directoryTotalPages]);

  const safeDirectoryPage = Math.min(directoryPage, directoryTotalPages);
  const directorySlice = sortedFlatTasks.slice(
    (safeDirectoryPage - 1) * DIRECTORY_PAGE_SIZE,
    safeDirectoryPage * DIRECTORY_PAGE_SIZE
  );

  const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);
  const doneTasks = columns.find((c) => c.id === 'done')?.tasks.length ?? 0;

  if (loadError) {
    return (
      <div data-testid="kanban-board" className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
        <div
          data-testid="board-error"
          role="alert"
          className="max-w-md w-full rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-6 text-center"
        >
          <p data-testid="board-error-message" className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
            Unable to load board data
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Something went wrong while fetching tasks. Please try again.
          </p>
          <button
            type="button"
            data-testid="board-error-retry"
            onClick={dismissLoadError}
            className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="kanban-board" className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  Project Board
                </h1>
                <p data-testid="progress-counter" className="text-xs text-slate-500 dark:text-slate-400">
                  {doneTasks}/{totalTasks} tasks complete
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
            <input
              type="text"
              data-testid="search-input"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              data-testid="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className="text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              data-testid="assignee-filter"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {ASSIGNEES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              data-testid="sort-select"
              value={directorySort}
              onChange={(e) => setDirectorySort(e.target.value as DirectorySortOption)}
              aria-label="Sort matching tasks"
              className="text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="default">Sort: Column order</option>
              <option value="title">Sort: Title (A–Z)</option>
              <option value="due-date">Sort: Due date</option>
              <option value="priority-desc">Sort: Priority (high first)</option>
              <option value="created-desc">Sort: Created (newest)</option>
            </select>

            <button
              data-testid="add-task-btn"
              onClick={() => openAddModal('todo')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>

            <button
              data-testid="dark-mode-toggle"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {darkMode ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 110 10A5 5 0 0112 7z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {(searchQuery || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
          <div data-testid="active-filter-chips" className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400">Filters:</span>
            {searchQuery && (
              <FilterChip
                removeTestId="filter-chip-remove-search"
                label={`"${searchQuery}"`}
                onRemove={() => setSearchQuery('')}
              />
            )}
            {priorityFilter !== 'all' && (
              <FilterChip
                removeTestId="filter-chip-remove-priority"
                label={`Priority: ${priorityFilter}`}
                onRemove={() => setPriorityFilter('all')}
              />
            )}
            {assigneeFilter !== 'all' && (
              <FilterChip
                removeTestId="filter-chip-remove-assignee"
                label={`Assignee: ${assigneeFilter === 'unassigned' ? 'Unassigned' : ASSIGNEES.find((a) => a.id === assigneeFilter)?.name ?? assigneeFilter}`}
                onRemove={() => setAssigneeFilter('all')}
              />
            )}
            <button
              data-testid="clear-all-filters"
              onClick={() => { setSearchQuery(''); setPriorityFilter('all'); setAssigneeFilter('all'); }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </header>

      {totalFiltered === 0 && (
        <div data-testid="empty-results" role="status" className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-4">
          <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            No tasks match your search or filters. Try adjusting filters or clearing them to see tasks again.
          </div>
        </div>
      )}

      {/* Board */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div data-testid="board-columns" className="flex gap-5 overflow-x-auto pb-4">
            {filteredColumns.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                onAddTask={openAddModal}
                onEditTask={openEditModal}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        </DragDropContext>
      </main>

      {/* Paginated directory of current matches (read-only; sort does not affect drag order). */}
      {totalFiltered > 0 && (
        <section
          data-testid="task-directory"
          className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-10"
          aria-label="Matching tasks directory"
        >
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Matching tasks</h2>
              <p data-testid="pagination-info" className="text-xs text-slate-500 dark:text-slate-400">
                Page {safeDirectoryPage} of {directoryTotalPages} · {totalFiltered} task{totalFiltered === 1 ? '' : 's'}{' '}
                total
              </p>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden mb-3">
              {directorySlice.map((t) => (
                <li
                  key={t.id}
                  data-testid="paginated-task-row"
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm bg-slate-50/80 dark:bg-slate-800/40"
                >
                  <span data-testid="paginated-task-title" className="text-slate-800 dark:text-slate-100 truncate">
                    {t.title}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 capitalize">
                    {t.priority}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                data-testid="pagination-prev"
                disabled={safeDirectoryPage <= 1}
                onClick={() => setDirectoryPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                type="button"
                data-testid="pagination-next"
                disabled={safeDirectoryPage >= directoryTotalPages}
                onClick={() => setDirectoryPage((p) => Math.min(directoryTotalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <AddTaskModal
          isEditing={!!editingTask}
          task={editingTask}
          defaultColumnId={defaultColumnId}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
  removeTestId,
}: {
  label: string;
  onRemove: () => void;
  removeTestId?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
      {label}
      <button
        type="button"
        data-testid={removeTestId}
        onClick={onRemove}
        className="hover:text-indigo-900 dark:hover:text-indigo-100"
        aria-label={`Remove filter ${label}`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
