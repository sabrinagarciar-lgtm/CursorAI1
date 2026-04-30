import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Column, Task, ColumnId } from './types';
import TaskCard from './TaskCard';

interface BoardColumnProps {
  column: Column;
  onAddTask: (columnId: ColumnId) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string, columnId: ColumnId) => void;
}

const COLUMN_HEADER_STYLES: Record<ColumnId, string> = {
  todo: 'text-slate-700 dark:text-slate-300',
  'in-progress': 'text-indigo-700 dark:text-indigo-300',
  done: 'text-emerald-700 dark:text-emerald-300',
};

const COLUMN_COUNT_STYLES: Record<ColumnId, string> = {
  todo: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  'in-progress': 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  done: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
};

export default function BoardColumn({ column, onAddTask, onEditTask, onDeleteTask }: BoardColumnProps) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${column.accentColor} flex-shrink-0`} />
          <h2 className={`text-sm font-semibold ${COLUMN_HEADER_STYLES[column.id]}`}>
            {column.title}
          </h2>
          <span
            className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium flex items-center justify-center ${COLUMN_COUNT_STYLES[column.id]}`}
          >
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          aria-label={`Add task to ${column.title}`}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Droppable Task List */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 flex flex-col gap-2.5 min-h-[120px] rounded-xl p-2 transition-colors duration-150 ${
              snapshot.isDraggingOver
                ? 'bg-indigo-50 dark:bg-indigo-950/50 ring-2 ring-indigo-300 dark:ring-indigo-700'
                : 'bg-slate-200/60 dark:bg-slate-800/60'
            }`}
          >
            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">No tasks here</p>
                <button
                  onClick={() => onAddTask(column.id)}
                  className="mt-2 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                >
                  Add one
                </button>
              </div>
            )}

            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Task Button (footer) */}
      <button
        onClick={() => onAddTask(column.id)}
        className="mt-2 flex items-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add task
      </button>
    </div>
  );
}
