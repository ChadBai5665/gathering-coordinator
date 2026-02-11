const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

const statusColors = {
  online: 'bg-teal-500',
  away: 'bg-amber-400',
  offline: 'bg-stone-400',
} as const;

const ringColors = {
  joined: 'ring-secondary-400',
  departed: 'ring-primary-500',
  arrived: 'ring-teal-500',
} as const;

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeMap;
  status?: keyof typeof statusColors;
  participantStatus?: keyof typeof ringColors;
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-emerald-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  name,
  src,
  size = 'md',
  status,
  participantStatus,
}: AvatarProps) {
  const ringClass = participantStatus
    ? `ring-2 ${ringColors[participantStatus]}`
    : '';

  return (
    <div className="relative inline-flex shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`
            rounded-full object-cover
            ${sizeMap[size]}
            ${ringClass}
          `}
        />
      ) : (
        <div
          className={`
            flex items-center justify-center rounded-full font-semibold text-white
            ${sizeMap[size]}
            ${getColorFromName(name)}
            ${ringClass}
          `}
          aria-label={name}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`
            absolute bottom-0 right-0 block rounded-full
            ring-2 ring-card-light dark:ring-card-dark
            ${size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'}
            ${statusColors[status]}
          `}
          aria-label={status}
        />
      )}
    </div>
  );
}
