import React, { useId } from 'react';

export type SelectOption = { value: string; label: string };

export type SelectFieldProps = {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'>;

export function SelectField({
  label,
  options,
  error,
  hint,
  className = '',
  required,
  disabled,
  'aria-describedby': ariaDescribedBy,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [ariaDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
        {required ? (
          <span className="text-red-600 dark:text-red-400" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
      <div className="relative">
        <select
          id={id}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={[
            'block w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-slate-900 shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-slate-900 dark:text-slate-100',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40 dark:border-red-500'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/40 dark:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/30',
            disabled ? 'cursor-not-allowed opacity-60' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...selectProps}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          aria-hidden="true"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
