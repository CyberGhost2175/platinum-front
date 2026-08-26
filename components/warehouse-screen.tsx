"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { useConfirm } from "@/components/confirm-dialog";
import { Filter } from "@/components/filter-select";
import { Icon } from "@/components/icon";
import { Notice, PageLoading } from "@/components/notice";
import { useToast } from "@/components/toast";
import { api, errorMessage } from "@/lib/api";
import { formatRubles } from "@/lib/format";
import { ITEM_CATEGORY_LABEL, METAL_LABEL, metalLine } from "@/lib/labels";
import { can, PRODUCT_DELETE_ROLES, WAREHOUSE_WRITE_ROLES } from "@/lib/roles";
import type {
  ItemCategory,
  MetalCategory,
  PaginationMeta,
  ProductWithStock,
  Supplier,
} from "@/lib/types";

const SORT_OPTIONS = [
  { value: "createdAt:DESC", label: "Сначала новые" },
  { value: "weight:ASC", label: "Граммы ↑" },
  { value: "weight:DESC", label: "Граммы ↓" },
  { value: "supplier:ASC", label: "Поставщик А–Я" },
  { value: "supplier:DESC", label: "Поставщик Я–А" },
  { value: "name:ASC", label: "Название А–Я" },
  { value: "price:DESC", label: "Цена ↓" },
  { value: "price:ASC", label: "Цена ↑" },
];

export function WarehouseScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const canWrite = can(user?.role, WAREHOUSE_WRITE_ROLES);
  const canDelete = can(user?.role, PRODUCT_DELETE_ROLES);

  const [items, setItems] = useState<ProductWithStock[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [metal, setMetal] = useState<MetalCategory | "">("");
  const [supplierId, setSupplierId] = useState("");
  const [sort, setSort] = useState("createdAt:DESC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void api.catalog.suppliers().then(setSuppliers).catch(() => setSuppliers([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [sortBy, sortOrder] = sort.split(":") as [string, "ASC" | "DESC"];
    try {
      const result = await api.catalog.products({
        page,
        limit: 20,
        q: debounced || undefined,
        itemCategory: category,
        metalCategory: metal,
        supplierId: supplierId || undefined,
        stockStatus: "in_stock",
        sortBy,
        sortOrder,
      });
      setItems(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debounced, category, metal, supplierId, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(item: ProductWithStock) {
    const ok = await confirm({
      title: "Удалить товар?",
      description: `${item.name} (${item.sku}) и все его единицы на складе будут удалены.`,
      confirmLabel: "Удалить",
      tone: "danger",
      icon: "delete",
    });
    if (!ok) return;
    try {
      await api.products.remove(item.id);
      toast.success("Товар удалён");
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <AppShell
      searchPlaceholder="Поиск: артикул, имя, грамм, поставщик, металл, категория…"
      searchValue={query}
      onSearchChange={(value) => { setPage(1); setQuery(value); }}
    >
      <div className="flex flex-col p-page">
        {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-h1 text-on-surface">Склад</h2>
            <p className="mt-1 text-body text-secondary">Товары: добавление, изменение и удаление</p>
          </div>
          {canWrite ? (
            <Link
              href="/sklad/new"
              className="flex items-center gap-2 rounded bg-gold px-4 py-2 label-caps text-on-primary transition-colors hover:bg-surface-tint"
            >
              <Icon name="add" size={16} />
              Добавить товар
            </Link>
          ) : null}
        </div>
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded border border-border bg-surface-lowest p-4">
          <Filter
            label="Категория"
            value={category}
            onChange={(value) => { setPage(1); setCategory(value as ItemCategory | ""); }}
            options={[
              { value: "", label: "Все категории" },
              ...Object.entries(ITEM_CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Filter
            label="Металл"
            value={metal}
            onChange={(value) => { setPage(1); setMetal(value as MetalCategory | ""); }}
            options={[
              { value: "", label: "Любой" },
              ...Object.entries(METAL_LABEL).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Filter
            label="Поставщик"
            value={supplierId}
            onChange={(value) => { setPage(1); setSupplierId(value); }}
            options={[
              { value: "", label: "Все поставщики" },
              ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
            ]}
          />
          <Filter
            label="Сортировка"
            value={sort}
            onChange={(value) => { setPage(1); setSort(value); }}
            options={SORT_OPTIONS}
          />
          <button
            type="button"
            onClick={() => {
              setCategory("");
              setMetal("");
              setSupplierId("");
              setQuery("");
              setSort("createdAt:DESC");
              setPage(1);
            }}
            className="flex h-[38px] items-center gap-2 rounded border border-border px-4 label-caps"
          >
            <Icon name="filter_list" size={18} />
            Сбросить
          </button>
        </div>
        {loading ? <PageLoading /> : (
          <div className="overflow-hidden rounded border border-border bg-surface-lowest">
            <div className="premium-scroll overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="label-caps p-3 pl-4 text-secondary">Артикул</th>
                    <th className="label-caps p-3 text-secondary">Название</th>
                    <th className="label-caps p-3 text-secondary">Металл</th>
                    <th className="label-caps p-3 text-right text-secondary">Вес</th>
                    <th className="label-caps p-3 text-secondary">Поставщик</th>
                    <th className="label-caps p-3 text-right text-secondary">Цена</th>
                    {canWrite ? <th className="label-caps p-3 pr-4 text-right text-secondary"> </th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={canWrite ? 7 : 6} className="px-6 py-10 text-center text-body text-secondary">
                        Ничего не найдено
                      </td>
                    </tr>
                  ) : items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface">
                      <td className="p-2 pl-4 text-table tabular">{item.sku}</td>
                      <td className="p-2 text-body font-medium">{item.name}</td>
                      <td className="p-2 text-body">{metalLine(item.metalCategory, item.goldTone)}</td>
                      <td className="p-2 text-right text-table tabular">{Number(item.weight).toFixed(3)} г</td>
                      <td className="p-2 text-body text-secondary">{item.supplier?.name ?? "—"}</td>
                      <td className="p-2 text-right text-table tabular">{formatRubles(item.price)}</td>
                      {canWrite ? (
                        <td className="p-2 pr-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/sklad/${item.id}/edit`} className="text-secondary hover:text-gold" aria-label="Изменить">
                              <Icon name="edit" size={18} />
                            </Link>
                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() => void onDelete(item)}
                                className="text-secondary hover:text-error"
                                aria-label="Удалить"
                              >
                                <Icon name="delete" size={18} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border bg-surface p-3">
              <span className="text-[12px] text-secondary">
                Стр. {meta?.page ?? 1} из {meta?.pageCount ?? 1} · {meta?.total ?? 0} артикулов
              </span>
              <div className="flex gap-1">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 w-8 rounded border border-border disabled:opacity-50">
                  <Icon name="chevron_left" size={18} />
                </button>
                <button type="button" disabled={page >= (meta?.pageCount ?? 1)} onClick={() => setPage((p) => p + 1)} className="h-8 w-8 rounded border border-border disabled:opacity-50">
                  <Icon name="chevron_right" size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
