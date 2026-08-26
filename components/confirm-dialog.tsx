"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Icon } from "./icon";

export type ConfirmTone = "danger" | "gold";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: string;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

type Pending = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending((current) => {
        current?.resolve(false);
        return { ...options, resolve };
      });
    });
  }, []);

  const finish = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title ?? ""}
        description={pending?.description}
        confirmLabel={pending?.confirmLabel ?? "Подтвердить"}
        cancelLabel={pending?.cancelLabel ?? "Отмена"}
        tone={pending?.tone ?? "gold"}
        icon={pending?.icon}
        onCancel={() => finish(false)}
        onConfirm={() => finish(true)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used within ConfirmProvider");
  return confirm;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone,
  icon,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmTone;
  icon?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const iconName = icon ?? (tone === "danger" ? "error" : "help");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="confirm-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="confirm-card">
        <div className="confirm-accent" />
        <div
          className={
            tone === "danger"
              ? "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger"
              : "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold"
          }
        >
          <Icon name={iconName} size={26} />
        </div>
        <h2 id={titleId} className="text-center text-h2 text-on-surface">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="mt-2 text-center text-body text-secondary">
            {description}
          </p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-border bg-surface px-4 py-2.5 label-caps text-on-surface transition-colors hover:bg-surface-high focus-visible:border-gold"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={
              tone === "danger"
                ? "rounded bg-danger px-4 py-2.5 label-caps text-white transition-opacity hover:opacity-90 focus-visible:opacity-90 dark:text-[#161513]"
                : "rounded bg-gold px-4 py-2.5 label-caps text-on-primary transition-colors hover:bg-surface-tint focus-visible:bg-surface-tint"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
