"use client";

import { Icon } from "./icon";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`text-secondary transition-colors hover:text-gold ${className}`}
      aria-label={dark ? "Светлая тема" : "Тёмная тема"}
      title={dark ? "Светлая тема" : "Тёмная тема"}
    >
      <Icon name={dark ? "light_mode" : "dark_mode"} filled size={18} />
    </button>
  );
}
