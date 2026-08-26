"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth, useShift } from "@/components/auth-provider";
import { useConfirm } from "@/components/confirm-dialog";
import { Icon } from "@/components/icon";
import { Notice, PageLoading } from "@/components/notice";
import { useToast } from "@/components/toast";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, formatDuration, formatKopecks, formatTime } from "@/lib/format";
import { displayName } from "@/lib/labels";
import { can, SALE_REFUND_ROLES } from "@/lib/roles";
import type { Shift, ShiftState } from "@/lib/types";

export function ShiftScreen() {
  const { user } = useAuth();
  const { shift, loading, error, close, refresh, open } = useShift();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [history, setHistory] = useState<Shift[]>([]);
  const [past, setPast] = useState<ShiftState | null>(null);
  const canRefund = can(user?.role, SALE_REFUND_ROLES);
  const confirm = useConfirm();
  const toast = useToast();
  const locationId = shift?.locationId ?? user?.locationId ?? "";

  const loadHistory = useCallback(async () => {
    if (!locationId) {
      setHistory([]);
      return;
    }
    try {
      const rows = await api.shifts.list(locationId);
      setHistory(rows.filter((row) => row.status === "closed"));
    } catch {
      setHistory([]);
    }
  }, [locationId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function handleClose() {
    const ok = await confirm({
      title: "Закрыть смену?",
      description: "Касса будет закрыта. Новые продажи станут недоступны до открытия следующей смены.",
      confirmLabel: "Закрыть",
      tone: "gold",
      icon: "lock",
    });
    if (!ok) return;
    setLocalError(null);
    setBusy(true);
    try {
      await close();
      toast.success("Смена закрыта");
      await loadHistory();
    } catch (err) {
      const message = errorMessage(err);
      setLocalError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleOpen() {
    setLocalError(null);
    setBusy(true);
    try {
      await open();
      toast.success("Смена открыта");
    } catch (err) {
      const message = errorMessage(err);
      setLocalError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function refund(id: string) {
    const ok = await confirm({
      title: "Сторнировать чек?",
      description: "Чек будет отменён. Это действие нельзя отменить.",
      confirmLabel: "Сторно",
      tone: "danger",
      icon: "undo",
    });
    if (!ok) return;
    setBusy(true);
    setLocalError(null);
    try {
      await api.sales.refund(id);
      toast.success("Чек сторнирован");
      await refresh();
    } catch (err) {
      const message = errorMessage(err);
      setLocalError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const receipts = shift?.receipts ?? [];
  const summary = shift?.summary;

  async function openPast(id: string) {
    if (past?.id === id) {
      setPast(null);
      return;
    }
    setBusy(true);
    try {
      setPast(await api.shifts.get(id));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title={shift ? `Смена: ${formatDateTime(shift.openedAt)}` : "Смена"}
      showSearch={false}
      showOpenShift={false}
    >
      <div className="p-page">
        {error || localError ? (
          <Notice onClose={() => setLocalError(null)}>{localError || error}</Notice>
        ) : null}
        {loading && !shift ? <PageLoading /> : null}

        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-display text-on-surface">
              {shift ? "Текущая смена" : "Смена не открыта"}
            </h2>
            <p className="text-body text-secondary">
              {shift
                ? `Кассир: ${displayName(shift.cashier)} • ${shift.location?.name ?? ""} • Открыта: ${formatTime(shift.openedAt)}`
                : "Откройте смену, чтобы принимать чеки"}
            </p>
          </div>
          {shift ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleClose}
              className="flex items-center gap-2 rounded border border-border bg-surface px-6 py-2.5 label-caps text-on-surface transition-colors hover:border-gold disabled:opacity-50"
            >
              <Icon name="lock" size={18} />
              Закрыть смену
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={handleOpen}
              className="flex items-center gap-2 rounded bg-gold px-6 py-2.5 label-caps text-on-primary hover:bg-surface-tint disabled:opacity-50"
            >
              Открыть смену
            </button>
          )}
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Kpi label="Выручка за смену" value={formatKopecks(summary?.grandTotal ?? 0)} icon="trending_up" />
          <Kpi label="Наличные в кассе" value={formatKopecks(summary?.cashTotal ?? 0)} />
          <Kpi label="Чеков пробито" value={`${summary?.receiptsCount ?? 0} шт`} />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border bg-surface-lowest px-6 py-4">
            <h3 className="text-h2 text-on-surface">Чеки смены</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-6 py-3 font-medium label-caps text-secondary">Время</th>
                  <th className="px-6 py-3 font-medium label-caps text-secondary">Тип</th>
                  <th className="px-6 py-3 font-medium label-caps text-secondary">Документ</th>
                  <th className="px-6 py-3 text-right font-medium label-caps text-secondary">Сумма</th>
                  {canRefund ? <th className="px-6 py-3" /> : null}
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-body text-secondary">
                      Пока нет оплаченных чеков
                    </td>
                  </tr>
                ) : (
                  receipts.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-lowest">
                      <td className="px-6 py-3 text-table tabular text-secondary">{formatTime(row.date)}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-high px-2 py-0.5 label-caps">
                          <span className={row.status === "paid" ? "h-1.5 w-1.5 rounded-full bg-gold" : "h-1.5 w-1.5 rounded-full bg-secondary"} />
                          {row.status === "refunded"
                            ? "Сторно"
                            : row.paymentMethod === "cash"
                              ? "Продажа (Наличные)"
                              : "Продажа (Карта)"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-body">{row.receiptNumber ?? row.id.slice(0, 8)}</td>
                      <td className={`px-6 py-3 text-right text-table tabular ${row.status === "refunded" ? "text-error" : ""}`}>
                        {formatKopecks(row.totalAmount)}
                      </td>
                      {canRefund ? (
                        <td className="px-6 py-3 text-right">
                          {row.status === "paid" ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => refund(row.id)}
                              className="label-caps text-secondary hover:text-error"
                            >
                              Сторно
                            </button>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border bg-surface-lowest px-6 py-4">
            <h3 className="text-h2 text-on-surface">История смен</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-6 py-3 font-medium label-caps text-secondary">Открыта</th>
                  <th className="px-6 py-3 font-medium label-caps text-secondary">Закрыта</th>
                  <th className="px-6 py-3 font-medium label-caps text-secondary">Кассир</th>
                  <th className="px-6 py-3 font-medium label-caps text-secondary">Длительность</th>
                  <th className="px-6 py-3 text-right font-medium label-caps text-secondary">Выручка</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-body text-secondary">
                      Закрытых смен пока нет
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
                    const total = Number(row.cashTotal) + Number(row.cardTotal);
                    const active = past?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer border-b border-border last:border-0 hover:bg-surface-lowest ${active ? "bg-surface-lowest" : ""}`}
                        onClick={() => void openPast(row.id)}
                      >
                        <td className="px-6 py-3 text-table tabular">{formatDateTime(row.openedAt)}</td>
                        <td className="px-6 py-3 text-table tabular text-secondary">{formatDateTime(row.closedAt)}</td>
                        <td className="px-6 py-3 text-body">{displayName(row.cashier)}</td>
                        <td className="px-6 py-3 text-body text-secondary">{formatDuration(row.openedAt, row.closedAt)}</td>
                        <td className="px-6 py-3 text-right text-table tabular">{formatKopecks(total)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {past ? (
            <div className="border-t border-border px-6 py-4">
              <p className="mb-3 text-[12px] text-secondary">
                Чеки смены {formatDateTime(past.openedAt)} · {past.receipts.length} шт
              </p>
              {past.receipts.length === 0 ? (
                <p className="text-body text-secondary">В этой смене не было оплаченных чеков</p>
              ) : (
                <div className="space-y-2">
                  {past.receipts.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-4 text-body">
                      <span className="text-secondary">{formatTime(row.date)}</span>
                      <span className="flex-1">{row.receiptNumber ?? row.id.slice(0, 8)}</span>
                      <span className={row.status === "refunded" ? "tabular text-error" : "tabular"}>
                        {formatKopecks(row.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface p-6">
      <p className="mb-2 label-caps text-secondary">{label}</p>
      <p className="text-h1 text-on-surface">{value}</p>
      {icon ? (
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-5">
          <Icon name={icon} size={128} />
        </div>
      ) : null}
    </div>
  );
}
