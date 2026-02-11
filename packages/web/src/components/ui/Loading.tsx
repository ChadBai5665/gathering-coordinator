import { type ReactNode } from 'react';

// ── Spinner ──

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin text-primary-500 ${spinnerSizes[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="加载中"
      role="status"
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
  );
}

// ── Skeleton ──

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle';
}

const skeletonVariants = {
  text: 'h-4 w-full rounded',
  card: 'h-32 w-full rounded-2xl',
  circle: 'h-10 w-10 rounded-full',
};

export function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-stone-200 dark:bg-stone-700
        ${skeletonVariants[variant]}
        ${className}
      `}
      aria-hidden="true"
    />
  );
}

// ── Full-page Loading ──

interface LoadingOverlayProps {
  message?: string;
  children?: ReactNode;
}

export function LoadingOverlay({ message = '加载中...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
      <Spinner size="lg" />
      <p className="text-sm text-stone-500 dark:text-stone-400">{message}</p>
    </div>
  );
}
