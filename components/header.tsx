"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { useAuth, useShift } from "./auth-provider";
import { ThemeToggle } from "./theme-toggle";
import { can, SHIFT_ROLES } from "@/lib/roles";
import { errorMessage } from "@/lib/api";
import { displayName } from "@/lib/labels";

type HeaderProps = {
  onMenu?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  title?: string;
  center?: React.ReactNode;
  extraRight?: React.ReactNode;
  showOpenShift?: boolean;
  showSearch?: boolean;
};

export function Header({
  onMenu,
  searchPlaceholder = "Поиск по артикулу...",
  searchValue,
  onSearchChange,
  title,
  center,
  extraRight,
  showOpenShift = true,
  showSearch = true,
}: HeaderProps) {
  const { user } = useAuth();
  const { shift, open, loading } = useShift();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canShift = can(user?.role, SHIFT_ROLES);

  async function handleOpenShift() {
    setError(null);
    setBusy(true);
    try {
      await open();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const initials = displayName(user)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-header w-full items-center justify-between gap-4 border-b border-border bg-surface px-page">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="text-secondary md:hidden"
          onClick={onMenu}
          aria-label="Меню"
        >
          <Icon name="menu" />
        </button>
        {title ? (
          <h2 className="truncate text-h2 font-bold tracking-tight text-on-surface">
            {title}
          </h2>
        ) : null}
        {showSearch ? (
          <div className="relative hidden w-full max-w-md md:block">
            <Icon
              name="search"
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
            />
            <input
              className="w-full rounded-sm border border-border bg-background py-2 pr-4 pl-10 text-body text-on-surface placeholder:text-secondary transition-colors focus:border-gold"
              placeholder={searchPlaceholder}
              type="search"
              value={onSearchChange ? (searchValue ?? "") : undefined}
              onChange={
                onSearchChange
                  ? (event) => onSearchChange(event.target.value)
                  : undefined
              }
            />
          </div>
        ) : null}
      </div>

      {center ? (
        <div className="hidden shrink-0 items-center justify-center lg:flex">
          {center}
        </div>
      ) : null}

      <div className="flex shrink-0 items-center justify-end gap-3">
        {error ? <span className="max-w-[180px] truncate text-[11px] text-error">{error}</span> : null}
        {extraRight}
        {user?.location?.name ? (
          <div className="hidden min-w-0 max-w-[220px] items-center gap-2 sm:flex" title={user.location.name}>
            <Icon name="storefront" size={16} className="shrink-0 text-gold" />
            <span className="truncate label-caps text-secondary">{user.location.name}</span>
          </div>
        ) : null}
        {showOpenShift && canShift && !shift ? (
          <button
            type="button"
            disabled={busy || loading}
            onClick={handleOpenShift}
            className="ml-1 rounded-sm border border-gold px-4 py-1.5 label-caps text-gold transition-colors hover:bg-gold hover:text-on-primary disabled:opacity-50"
          >
            {busy ? "Открытие…" : "Открыть смену"}
          </button>
        ) : null}
        <ThemeToggle />
        <div
          className="relative ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-high text-[11px] font-bold text-on-surface"
          title={displayName(user)}
        >
          {initials || "?"}
        </div>
      </div>
    </header>
  );
}
