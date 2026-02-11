import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  iconLeft?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, iconLeft, className = '', id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-md border border-stone-300 bg-white
              px-3 py-2.5 text-sm text-stone-900
              placeholder:text-stone-400
              transition-colors duration-200
              focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20
              disabled:cursor-not-allowed disabled:opacity-50
              dark:border-stone-600 dark:bg-surface-dark dark:text-stone-100
              dark:placeholder:text-stone-500
              dark:focus:border-primary-500
              ${iconLeft ? 'pl-10' : ''}
              ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            className="text-xs text-danger-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
