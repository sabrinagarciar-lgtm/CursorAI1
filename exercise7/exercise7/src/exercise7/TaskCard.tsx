import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, ColumnId, PRIORITY_CONFIG } from './types';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, columnId: ColumnId) => void;
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
          className={`relative rounded-lg border bg-white dark:bg-slate-900 transition-all duration-150 select-none cursor-grab active:cursor-grabbing ${
            snapshot.isDragging
              ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700 rotate-1 scale-105 z-50'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          style={provided.draggableProps.style}
        >
          {/* Card Body */}
          <div className="p-3">
            {/* Top row: priority badge + actions */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${priority.bgLight} ${priority.bgDark} ${priority.textLight} ${priority.textDark}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>

              {/* Action buttons (visible on hover) */}
              <div
                className={`flex items-center gap-0.5 transition-opacity duration-100 ${
                  showActions || snapshot.isDragging ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                  aria-label="Edit task"
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id, task.columnId); }}
                  aria-label="Delete task"
                  className="p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Title */}
            <h3
              className={`text-sm font-medium leading-snug mb-1 ${
                task.columnId === 'done'
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {/* Description snippet */}
            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                {task.description}
              </p>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom row: assignee + due date */}
            <div className="flex items-center justify-between mt-2">
              {task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: task.assignee.color }}
                    title={task.assignee.name}
                  >
                    {task.assignee.initials}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                    {task.assignee.name.split(' ')[0]}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600" />
                  <span className="text-xs text-slate-400 dark:text-slate-500">Unassigned</span>
                </div>
              )}

              {task.dueDate && (
                <div
                  className={`flex items-center gap-1 text-xs ${
                    task.columnId === 'done'
                      ? 'text-slate-400 dark:text-slate-500'
                      : overdue
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {overdue && task.columnId !== 'done' && <span>Overdue · </span>}
                  {formatDate(task.dueDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
