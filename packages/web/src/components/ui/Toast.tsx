import { Icon } from './Icon';
import type { Toast as ToastData, ToastType } from '@/hooks/useToast';

const typeConfig: Record<ToastType, { icon: string; bg: string; border: string }> = {
  success: {
    icon: 'check_circle',
    bg: 'bg-teal-50 dark:bg-teal-950',
    border: 'border-teal-200 dark:border-teal-800',
  },
  error: {
    icon: 'error',
    bg: 'bg-danger-50 dark:bg-danger-950',
    border: 'border-danger-200 dark:border-danger-800',
  },
  warning: {
    icon: 'warning',
    bg: 'bg-primary-50 dark:bg-primary-950',
    border: 'border-primary-200 dark:border-primary-800',
  },
  info: {
    icon: 'info',
    bg: 'bg-secondary-50 dark:bg-secondary-950',
    border: 'border-secondary-200 dark:border-secondary-800',
  },
};

const typeIconColor: Record<ToastType, string> = {
  success: 'text-teal-500',
  error: 'text-danger-500',
  warning: 'text-primary-500',
  info: 'text-secondary-500',
};

interface ToastItemProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = typeConfig[toast.type];

  return (
    <div
      className={`
        animate-slide-in flex items-center gap-3 rounded-md border
        px-4 py-3 shadow-lg
        ${config.bg} ${config.border}
      `}
      role="alert"
    >
      <Icon
        name={config.icon}
        size={20}
        className={typeIconColor[toast.type]}
      />
      <p className="flex-1 text-sm text-stone-800 dark:text-stone-200">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="rounded-full p-0.5 text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
        aria-label="关闭通知"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
