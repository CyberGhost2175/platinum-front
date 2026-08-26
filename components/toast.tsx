"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Icon } from "./icon";

export type ToastKind = "ok" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3800);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("ok", message),
      error: (message) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              toast.kind === "ok"
                ? "toast-item pointer-events-auto flex max-w-[440px] items-start gap-3 rounded-lg border border-success/35 bg-surface px-4 py-3 text-body text-on-surface shadow-[0_16px_40px_rgba(28,27,24,0.16)]"
                : "toast-item pointer-events-auto flex max-w-[440px] items-start gap-3 rounded-lg border border-error/35 bg-surface px-4 py-3 text-body text-on-surface shadow-[0_16px_40px_rgba(28,27,24,0.16)]"
            }
          >
            <span
              className={
                toast.kind === "ok"
                  ? "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
                  : "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-error/15 text-error"
              }
            >
              <Icon name={toast.kind === "ok" ? "check" : "error"} size={18} />
            </span>
            <p className="pt-1">{toast.message}</p>
            <button
              type="button"
              className="ml-2 text-secondary hover:text-on-surface"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              aria-label="Закрыть"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used within ToastProvider");
  return toast;
}
