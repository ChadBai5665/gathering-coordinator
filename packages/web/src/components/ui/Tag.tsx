import { Icon } from './Icon';

const variantStyles = {
  default: 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
  success: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
} as const;

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
} as const;

interface TagProps {
  children: string;
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  removable?: boolean;
  onRemove?: () => void;
}

export function Tag({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
}: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`移除 ${children}`}
        >
          <Icon name="close" size={12} />
        </button>
      )}
    </span>
  );
}
