const variantStyles = {
  default: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
  success: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200',
} as const;

interface BadgeProps {
  children: string;
  variant?: keyof typeof variantStyles;
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5
        text-xs font-semibold
        ${variantStyles[variant]}
      `}
    >
      {children}
    </span>
  );
}
