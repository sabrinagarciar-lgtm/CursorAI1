import React, { useCallback } from 'react';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface TaskListProps {
  tasks: Task[];
  onToggleComplete?: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggleComplete }) => {
  const handleToggleComplete = useCallback(
    (taskId: string) => {
      onToggleComplete?.(taskId);
    },
    [onToggleComplete]
  );

  return (
    <ul className="space-y-3 list-none p-0 m-0">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={`
            group relative overflow-hidden rounded-xl border
            bg-white/95 backdrop-blur-sm shadow-sm
            transition-all duration-300 ease-out
            hover:shadow-md hover:-translate-y-0.5
            ${task.completed
              ? 'border-emerald-200/60 opacity-90'
              : 'border-slate-200/80 border-l-4 border-l-indigo-500'
            }
          `}
        >
          <div className="flex items-center gap-4 p-5">
            {onToggleComplete && (
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleComplete(task.id)}
                className="
                  w-5 h-5 rounded-md border-2 border-slate-300
                  text-indigo-600 focus:ring-2 focus:ring-indigo-500/50
                  cursor-pointer transition-colors
                  checked:bg-indigo-600 checked:border-indigo-600
                "
                aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
              />
            )}
            <div className="flex-1 min-w-0">
              <h3
                className={`
                  font-semibold text-lg tracking-tight
                  ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}
                `}
              >
                {task.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                {task.description}
              </p>
            </div>
            <span
              className={`
                shrink-0 px-3 py-1 rounded-full text-xs font-medium
                ${task.completed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
                }
              `}
            >
              {task.completed ? 'Done' : 'Pending'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TaskList;
