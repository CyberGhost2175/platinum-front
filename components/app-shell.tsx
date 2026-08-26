"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

type AppShellProps = {
  children: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  title?: string;
  center?: React.ReactNode;
  extraRight?: React.ReactNode;
  showOpenShift?: boolean;
  showSearch?: boolean;
  flush?: boolean;
};

export function AppShell({
  children,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  title,
  center,
  extraRight,
  showOpenShift = true,
  showSearch = true,
  flush = false,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 bg-background text-on-surface">
      <div className="hidden md:block">
        <div className="fixed top-0 left-0 z-20 h-full">
          <Sidebar />
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/20"
            aria-label="Закрыть меню"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-sidebar bg-background shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:ml-sidebar">
        <Header
          onMenu={() => setMenuOpen(true)}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          title={title}
          center={center}
          extraRight={extraRight}
          showOpenShift={showOpenShift}
          showSearch={showSearch}
        />
        <div
          className={
            flush
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "premium-scroll flex-1 overflow-y-auto"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
