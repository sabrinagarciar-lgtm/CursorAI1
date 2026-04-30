import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Column, Task, Priority, ColumnId, INITIAL_COLUMNS, ASSIGNEES, NewTaskFormData } from './types';
import BoardColumn from './BoardColumn';
import AddTaskModal from './AddTaskModal';

type PriorityFilter = Priority | 'all';
type AssigneeFilter = string | 'all';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<ColumnId>('todo');

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    applyDarkMode(prefersDark);
  }, []);

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

  const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);
  const doneTasks = columns.find((c) => c.id === 'done')?.tasks.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
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

            <button
              onClick={() => openAddModal('todo')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>

            <button
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
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400">Filters:</span>
            {searchQuery && (
              <FilterChip label={`"${searchQuery}"`} onRemove={() => setSearchQuery('')} />
            )}
            {priorityFilter !== 'all' && (
              <FilterChip label={`Priority: ${priorityFilter}`} onRemove={() => setPriorityFilter('all')} />
            )}
            {assigneeFilter !== 'all' && (
              <FilterChip
                label={`Assignee: ${assigneeFilter === 'unassigned' ? 'Unassigned' : ASSIGNEES.find((a) => a.id === assigneeFilter)?.name ?? assigneeFilter}`}
                onRemove={() => setAssigneeFilter('all')}
              />
            )}
            <button
              onClick={() => { setSearchQuery(''); setPriorityFilter('all'); setAssigneeFilter('all'); }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </header>

      {/* Board */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-4">
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

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900 dark:hover:text-indigo-100">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
