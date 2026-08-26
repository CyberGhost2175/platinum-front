type IconProps = {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
};

export function Icon({ name, filled, className = "", size }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled" : ""} ${className}`}
      style={size ? { fontSize: size } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
