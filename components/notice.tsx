"use client";

import { Icon } from "./icon";

export function Notice({
  kind = "error",
  children,
  onClose,
}: {
  kind?: "error" | "ok";
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={
        kind === "ok"
          ? "mb-4 flex items-start justify-between gap-3 rounded border border-success/30 bg-success/5 px-4 py-3 text-body text-on-surface"
          : "mb-4 flex items-start justify-between gap-3 rounded border border-error/30 bg-error/5 px-4 py-3 text-body text-on-surface"
      }
    >
      <p>{children}</p>
      {onClose ? (
        <button type="button" className="text-secondary hover:text-on-surface" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      ) : null}
    </div>
  );
}

export function PageLoading({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center text-body text-secondary">
      {label}
    </div>
  );
}
