import { type HTMLAttributes, type ReactNode } from 'react';

const variantStyles = {
  default: 'bg-card-light dark:bg-card-dark shadow-sm',
  elevated: 'bg-card-light dark:bg-card-dark shadow-md hover:shadow-lg hover:-translate-y-0.5',
  outlined: 'bg-card-light dark:bg-card-dark border border-stone-200 dark:border-stone-700',
} as const;

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variantStyles;
  padding?: keyof typeof paddingStyles;
  children: ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl transition-all duration-200
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
