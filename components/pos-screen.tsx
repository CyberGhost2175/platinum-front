"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth, useShift } from "@/components/auth-provider";
import { useConfirm } from "@/components/confirm-dialog";
import { Icon } from "@/components/icon";
import { Notice } from "@/components/notice";
import { useToast } from "@/components/toast";
import { api, errorMessage } from "@/lib/api";
import {
  formatKopecks,
  formatMinorAsTenge,
  formatRubles,
  parsePercent,
  parseTengeToMinor,
} from "@/lib/format";
import { ITEM_CATEGORY_LABEL } from "@/lib/labels";
import { can, SALE_CREATE_ROLES } from "@/lib/roles";
import type { ItemCategory, PaymentMethod, ProductWithStock, Sale } from "@/lib/types";

const CATEGORIES: Array<{ id: "all" | ItemCategory; label: string }> = [
  { id: "all", label: "Все" },
  ...(Object.entries(ITEM_CATEGORY_LABEL) as Array<[ItemCategory, string]>).map(
    ([id, label]) => ({ id, label }),
  ),
];

const compactField =
  "w-full rounded-sm border border-border bg-background px-2 py-1.5 text-right text-[13px] tabular text-on-surface outline-none placeholder:text-secondary focus:border-gold";

export function PosScreen() {
  const { user } = useAuth();
  const { shift, refresh: refreshShift } = useShift();
  const canSell = can(user?.role, SALE_CREATE_ROLES);
  const confirm = useConfirm();
  const toast = useToast();

  const [activeCategory, setActiveCategory] = useState<"all" | ItemCategory>("all");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [sale, setSale] = useState<Sale | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [focusLineId, setFocusLineId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadProducts = useCallback(async () => {
    try {
      const page = await api.catalog.products({
        limit: 40,
        itemCategory: activeCategory === "all" ? "" : activeCategory,
        q: debounced || undefined,
        stockStatus: "in_stock",
        sortBy: "name",
        sortOrder: "ASC",
      });
      setProducts(page.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [activeCategory, debounced]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!shift || !user) {
      setSale(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const sales = await api.sales.list(shift.locationId);
        const drafts = sales.filter(
          (item) =>
            item.status === "draft" &&
            item.shiftId === shift.id &&
            item.sellerId === user.id,
        );
        const keep =
          drafts.find((item) => (item.items?.length ?? 0) > 0) ?? drafts[0] ?? null;
        await Promise.all(
          drafts
            .filter((item) => item.id !== keep?.id)
            .map((item) => api.sales.cancelDraft(item.id).catch(() => undefined)),
        );
        if (!cancelled) {
          if (keep) setSale(await api.sales.get(keep.id));
          else setSale(null);
        }
      } catch {
        if (!cancelled) setSale(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shift, user]);

  async function ensureDraft() {
    if (sale) return sale;
    const created = await api.sales.createDraft();
    setSale(created);
    return created;
  }

  async function addProduct(product: ProductWithStock) {
    if (!canSell) return;
    if (!shift) {
      setError("Сначала откройте смену");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const draft = await ensureDraft();
      const next = await api.sales.addItem(draft.id, { productId: product.id, qty: 1 });
      setSale(next);
      const newest = next.items[next.items.length - 1];
      if (newest && Number(newest.price) === 0) {
        setFocusLineId(newest.id);
      }
      await loadProducts();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeLine(lineId: string) {
    if (!sale) return;
    setBusy(true);
    try {
      setSale(await api.sales.removeItem(sale.id, lineId));
      await loadProducts();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const patchLinePrice = useCallback(
    async (lineId: string, priceMinor: number) => {
      if (!sale) return;
      try {
        setSale(await api.sales.updateItem(sale.id, lineId, { priceMinor }));
        setError(null);
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [sale],
  );

  const patchDiscount = useCallback(
    async (body: { discountMinor?: number; discountPercent?: number }) => {
      if (!sale) return;
      try {
        setSale(await api.sales.updateDraft(sale.id, body));
        setError(null);
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [sale],
  );

  async function clearDraft() {
    if (!sale) return;
    const ok = await confirm({
      title: "Очистить чек?",
      description: "Все позиции будут удалены из текущего чека.",
      confirmLabel: "Очистить",
      tone: "danger",
      icon: "delete_sweep",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.sales.cancelDraft(sale.id);
      setSale(null);
      toast.success("Чек очищен");
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!sale || sale.items.length === 0) return;
    const ok = await confirm({
      title: "Подтвердить оплату?",
      description: `${formatKopecks(Number(sale.totalAmount ?? 0))} · ${payment === "cash" ? "Наличные" : "Карта"}`,
      confirmLabel: "Оплатить",
      tone: "gold",
      icon: "payments",
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const paid = await api.sales.pay(sale.id, payment);
      setNotice(null);
      toast.success(`Чек ${paid.receiptNumber ?? paid.id.slice(0, 8)} оплачен`);
      setSale(null);
      await refreshShift();
      await loadProducts();
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const lines = sale?.items ?? [];
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.price) * line.qty,
    0,
  );
  const total = Number(sale?.totalAmount ?? 0);
  const totalDiscount = Math.max(0, subtotal - total);

  return (
    <AppShell
      flush
      searchPlaceholder="Поиск по артикулу, названию..."
      searchValue={query}
      onSearchChange={setQuery}
      extraRight={
        <div className="mr-2 hidden items-center gap-2 sm:flex">
          <span className={`h-2 w-2 rounded ${shift ? "bg-success" : "bg-secondary"}`} />
          <span className="label-caps text-secondary">
            {shift ? "Смена открыта" : "Смена закрыта"}
          </span>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-0">
          {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}
          {notice ? (
            <Notice kind="ok" onClose={() => setNotice(null)}>
              {notice}
            </Notice>
          ) : null}
          {!canSell ? (
            <Notice>Ваша роль может только смотреть кассу, пробить чек нельзя.</Notice>
          ) : null}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-surface px-2 py-4 hide-scrollbar">
            {CATEGORIES.map((category) => {
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={
                    active
                      ? "px-4 py-1.5 bg-surface-high border-on-surface/20 text-on-surface rounded-sm border label-caps"
                      : "px-4 py-1.5 bg-background border border-border text-secondary hover:border-gold hover:text-gold rounded-sm transition-colors label-caps"
                  }
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          <div className="premium-scroll flex-1 overflow-y-auto p-2 py-6">
            {products.length === 0 ? (
              <p className="text-center text-body text-secondary">Ничего не найдено</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {products.map((product) => {
                  const disabled = !canSell || product.outOfStock || product.availableQty <= 0;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => addProduct(product)}
                      className="group flex flex-col overflow-hidden rounded border border-border bg-surface p-3 text-left transition-colors hover:border-gold disabled:opacity-50"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="text-table text-secondary">#{product.sku}</div>
                        {product.stale ? (
                          <span className="rounded-sm bg-gold px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-on-primary uppercase">
                            Залежка
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mb-2 line-clamp-2 text-body leading-tight font-medium text-on-surface">
                        {product.name}
                      </h3>
                      <div className="mt-auto flex items-end justify-between pt-2">
                        <div className="text-[15px] font-medium tabular text-on-surface">
                          {formatRubles(product.price)}
                        </div>
                        <span className="text-[11px] text-secondary">{product.availableQty} шт</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="flex h-full w-full shrink-0 flex-col border-t border-border bg-surface shadow-[-4px_0_24px_rgba(0,0,0,0.02)] lg:w-[400px] lg:border-t-0 lg:border-l">
          <div className="border-b border-border p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-h2 text-on-surface">Текущий чек</h2>
              <button
                type="button"
                className="text-secondary transition-colors hover:text-error"
                onClick={clearDraft}
                disabled={!sale || busy}
                aria-label="Очистить чек"
              >
                <Icon name="delete_sweep" size={20} />
              </button>
            </div>
          </div>

          <div className="premium-scroll flex-1 overflow-y-auto p-2">
            {lines.length === 0 ? (
              <p className="px-3 py-8 text-center text-body text-secondary">
                Добавьте изделие из каталога
              </p>
            ) : (
              lines.map((line) => (
                <div
                  key={line.id}
                  className="group border-b border-border p-3 transition-colors last:border-0 hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="mb-1 text-body leading-snug font-medium text-on-surface">
                        {line.product?.name ?? "Изделие"}
                      </div>
                      <div className="text-[11px] text-secondary">
                        Арт: #{line.product?.sku ?? "—"} · {line.qty} шт
                        {line.discountPercent ? ` · Скидка ${line.discountPercent}%` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-secondary opacity-0 transition-all group-hover:opacity-100 hover:text-error"
                      onClick={() => removeLine(line.id)}
                      aria-label="Убрать из чека"
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <label className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="label-caps text-secondary">Цена, тг</span>
                      <DebouncedNumberField
                        committed={Number(line.price)}
                        parse={parseTengeToMinor}
                        format={formatMinorAsTenge}
                        onCommit={(priceMinor) => void patchLinePrice(line.id, priceMinor)}
                        disabled={!canSell || busy}
                        autoFocus={focusLineId === line.id}
                        placeholder="0"
                        className={compactField}
                      />
                    </label>
                    <div className="pb-1.5 text-right text-table font-medium tabular">
                      {formatKopecks(line.lineTotal)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border bg-surface-lowest p-5">
            {sale && lines.length > 0 ? (
              <ReceiptDiscountEditor
                key={sale.id}
                percent={sale.discountPercent || 0}
                amountMinor={Number(sale.discount || 0)}
                disabled={!canSell || busy}
                onApply={(body) => void patchDiscount(body)}
              />
            ) : null}
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-secondary">
                <span className="text-body">Подытог ({count} шт.)</span>
                <span className="text-table tabular">{formatKopecks(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gold">
                <span className="text-body">Скидка</span>
                <span className="text-table tabular">− {formatKopecks(totalDiscount)}</span>
              </div>
              <div className="mt-2 flex items-end justify-between border-t border-dashed border-border pt-2">
                <span className="text-h2 font-medium text-on-surface">Итого к оплате</span>
                <span className="text-[24px] font-bold tabular text-on-surface">
                  {formatKopecks(total)}
                </span>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayment("cash")}
                className={
                  payment === "cash"
                    ? "flex items-center justify-center gap-1 rounded-sm border border-gold bg-surface-low py-2 label-caps text-on-surface"
                    : "flex items-center justify-center gap-1 rounded-sm border border-border bg-background py-2 label-caps text-on-surface hover:border-gold"
                }
              >
                <Icon name="payments" size={18} />
                <span>Наличные</span>
              </button>
              <button
                type="button"
                onClick={() => setPayment("card")}
                className={
                  payment === "card"
                    ? "flex items-center justify-center gap-1 rounded-sm border border-gold bg-surface-low py-2 label-caps text-on-surface"
                    : "flex items-center justify-center gap-1 rounded-sm border border-border bg-background py-2 label-caps text-on-surface hover:border-gold"
                }
              >
                <Icon name="credit_card" size={18} />
                <span>Карта</span>
              </button>
            </div>
            <button
              type="button"
              disabled={!canSell || lines.length === 0 || busy}
              onClick={pay}
              className="flex w-full items-center justify-center gap-2 rounded bg-gold py-4 text-[18px] font-medium text-on-primary shadow-sm transition-colors hover:bg-surface-tint disabled:opacity-40"
            >
              <span>{busy ? "…" : "ОПЛАТИТЬ"}</span>
              <Icon name="arrow_forward" />
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function formatPercentValue(value: number) {
  return value ? String(value) : "";
}

function ReceiptDiscountEditor({
  percent,
  amountMinor,
  disabled,
  onApply,
}: {
  percent: number;
  amountMinor: number;
  disabled?: boolean;
  onApply: (body: { discountMinor: number; discountPercent: number }) => void;
}) {
  const [percentText, setPercentText] = useState(() => formatPercentValue(percent));
  const [amountText, setAmountText] = useState(() => formatMinorAsTenge(amountMinor));
  const focused = useRef(false);
  const skip = useRef(true);

  useEffect(() => {
    if (focused.current) return;
    setPercentText(formatPercentValue(percent));
    setAmountText(formatMinorAsTenge(amountMinor));
  }, [percent, amountMinor]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      const discountPercent = parsePercent(percentText);
      const discountMinor = parseTengeToMinor(amountText);
      if (discountPercent === null || discountMinor === null) return;
      if (discountPercent === percent && discountMinor === amountMinor) return;
      onApply({ discountMinor, discountPercent });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [percentText, amountText, percent, amountMinor, onApply]);

  return (
    <div className="mb-4 rounded-sm border border-border bg-surface p-3">
      <p className="mb-2 label-caps text-secondary">Скидка на чек</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-secondary">Процент</span>
          <div className="relative">
            <input
              value={percentText}
              disabled={disabled}
              inputMode="numeric"
              placeholder="0"
              className={`${compactField} pr-7`}
              onFocus={() => {
                focused.current = true;
              }}
              onChange={(event) => setPercentText(event.target.value)}
              onBlur={() => {
                focused.current = false;
                const parsed = parsePercent(percentText);
                setPercentText(formatPercentValue(parsed ?? percent));
              }}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[12px] text-secondary">
              %
            </span>
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-secondary">Сумма, тг</span>
          <input
            value={amountText}
            disabled={disabled}
            inputMode="decimal"
            placeholder="0"
            className={compactField}
            onFocus={() => {
              focused.current = true;
            }}
            onChange={(event) => setAmountText(event.target.value)}
            onBlur={() => {
              focused.current = false;
              const parsed = parseTengeToMinor(amountText);
              setAmountText(formatMinorAsTenge(parsed ?? amountMinor));
            }}
          />
        </label>
      </div>
    </div>
  );
}

function DebouncedNumberField({
  committed,
  parse,
  format,
  onCommit,
  disabled,
  autoFocus,
  placeholder,
  className,
}: {
  committed: number;
  parse: (raw: string) => number | null;
  format: (value: number) => string;
  onCommit: (value: number) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(() => format(committed));
  const focused = useRef(false);
  const lastSent = useRef(committed);

  useEffect(() => {
    if (focused.current) return;
    lastSent.current = committed;
    setText(format(committed));
  }, [committed, format]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const parsed = parse(text);
      if (parsed === null || parsed === lastSent.current) return;
      lastSent.current = parsed;
      onCommit(parsed);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [text, parse, onCommit]);

  return (
    <input
      value={text}
      disabled={disabled}
      autoFocus={autoFocus}
      inputMode="decimal"
      placeholder={placeholder}
      className={className}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        focused.current = false;
        const parsed = parse(text);
        if (parsed === null) {
          setText(format(committed));
          lastSent.current = committed;
          return;
        }
        setText(format(parsed));
        if (parsed !== lastSent.current) {
          lastSent.current = parsed;
          onCommit(parsed);
        }
      }}
    />
  );
}
