import { type ButtonHTMLAttributes, type ReactNode } from 'react';

const variants = {
  primary:
    'bg-primary-500 hover:bg-primary-700 text-white shadow-sm hover:shadow-md',
  secondary:
    'bg-stone-100 hover:bg-stone-200 text-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-100',
  ghost:
    'bg-transparent hover:bg-stone-100 text-stone-700 dark:hover:bg-stone-800 dark:text-stone-300',
  danger:
    'bg-danger-500 hover:bg-danger-600 text-white shadow-sm hover:shadow-md',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-md gap-2',
  lg: 'px-6 py-3 text-base rounded-md gap-2.5',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2
        dark:focus:ring-offset-background-dark
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}
