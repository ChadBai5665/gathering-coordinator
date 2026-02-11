interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Material Icons Round 包装组件
 */
export function Icon({ name, size = 24, className = '' }: IconProps) {
  return (
    <span
      className={`material-icons-round select-none leading-none ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
