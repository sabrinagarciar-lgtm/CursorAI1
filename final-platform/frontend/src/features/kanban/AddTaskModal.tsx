import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Priority, ColumnId, ASSIGNEES, NewTaskFormData } from './types';

interface AddTaskModalProps {
  isEditing: boolean;
  task: Task | null;
  defaultColumnId: ColumnId;
  onSubmit: (data: NewTaskFormData) => void;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Not time-sensitive' },
  { value: 'medium', label: 'Medium', description: 'Normal priority' },
  { value: 'high', label: 'High', description: 'Needs attention soon' },
  { value: 'urgent', label: 'Urgent', description: 'Immediate action required' },
];

const COLUMN_OPTIONS: { value: ColumnId; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

function getInitialForm(task: Task | null, defaultColumnId: ColumnId): NewTaskFormData {
  if (task) {
    return {
      title: task.title,
      description: task.description ?? '',
      assigneeId: task.assignee?.id ?? '',
      dueDate: task.dueDate ?? '',
      priority: task.priority,
      tags: (task.tags ?? []).join(', '),
      columnId: task.columnId,
    };
  }
  return {
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
    priority: 'medium',
    tags: '',
    columnId: defaultColumnId,
  };
}

export default function AddTaskModal({ isEditing, task, defaultColumnId, onSubmit, onClose }: AddTaskModalProps) {
  const [form, setForm] = useState<NewTaskFormData>(() => getInitialForm(task, defaultColumnId));
  const [errors, setErrors] = useState<Partial<Record<keyof NewTaskFormData, string>>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateField = useCallback(
    <K extends keyof NewTaskFormData>(field: K, value: NewTaskFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — dedicated hit target so outside clicks reliably close */}
      <button
        type="button"
        data-testid="modal-backdrop"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 dark:bg-black/70 cursor-default border-0 p-0"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div
        data-testid="task-modal"
        className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 data-testid="modal-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            data-testid="modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleRef}
                data-testid="modal-title-input"
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="What needs to be done?"
                className={`w-full px-3 py-2 text-sm rounded-md border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.title
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.title && (
                <p data-testid="modal-title-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                data-testid="modal-description-input"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Add more context..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Column + Priority row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Column
                </label>
                <select
                  data-testid="modal-column-select"
                  value={form.columnId}
                  onChange={(e) => updateField('columnId', e.target.value as ColumnId)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {COLUMN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  data-testid="modal-priority-select"
                  value={form.priority}
                  onChange={(e) => updateField('priority', e.target.value as Priority)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee + Due Date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assignee
                </label>
                <select
                  data-testid="modal-assignee-select"
                  value={form.assigneeId}
                  onChange={(e) => updateField('assigneeId', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {ASSIGNEES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  data-testid="modal-due-date-input"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tags
                <span className="ml-1 font-normal text-slate-400">(comma-separated)</span>
              </label>
              <input
                data-testid="modal-tags-input"
                type="text"
                value={form.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="frontend, bug, design..."
                className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {form.tags && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {form.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              data-testid="modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              data-testid="modal-submit-btn"
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
