"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { Notice, PageLoading } from "@/components/notice";
import { useToast } from "@/components/toast";
import { api, errorMessage } from "@/lib/api";
import { GOLD_TONE_LABEL, ITEM_CATEGORY_LABEL, METAL_LABEL } from "@/lib/labels";
import type { GoldTone, ItemCategory, MetalCategory, ProductWithStock, Supplier } from "@/lib/types";

const fieldClass =
  "w-full rounded border border-border bg-surface-lowest px-3 py-2.5 text-body text-on-surface";

const TONE_SWATCH: Record<GoldTone, string> = {
  yellow: "#d4b46a",
  white: "#d9d6d0",
  red: "#c9896a",
};

export function ProductFormScreen({ productId }: { productId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(productId);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [metal, setMetal] = useState<MetalCategory>("gold");
  const [tone, setTone] = useState<GoldTone>("yellow");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, item] = await Promise.all([
          api.catalog.suppliers().catch(() => [] as Supplier[]),
          productId ? api.products.get(productId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setSuppliers(list);
        if (item) {
          setProduct(item);
          setMetal(item.metalCategory);
          setTone(item.goldTone ?? "yellow");
        }
      } catch (err) {
        if (!cancelled) {
          const message = errorMessage(err);
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, toast]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sku = String(form.get("sku") || "").trim();
    const body = {
      sku: sku || undefined,
      name: String(form.get("name")),
      weight: String(form.get("weight")),
      metalCategory: metal,
      goldTone: metal === "gold" ? tone : editing ? null : undefined,
      itemCategory: String(form.get("itemCategory")) as ItemCategory,
      supplierId: String(form.get("supplierId")),
      price: String(form.get("price") || "") || undefined,
      costPrice: String(form.get("costPrice") || "") || undefined,
    };
    setBusy(true);
    setError(null);
    try {
      if (editing && productId) {
        await api.products.update(productId, body);
        toast.success("Товар сохранён");
      } else {
        await api.products.create(body);
        toast.success("Товар добавлен");
      }
      router.push("/sklad");
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title={editing ? "Редактирование товара" : "Новый товар"} showSearch={false}>
      <div className="p-page">
        <button
          type="button"
          onClick={() => router.push("/sklad")}
          className="mb-6 flex items-center gap-1 text-body text-secondary hover:text-gold"
        >
          <Icon name="arrow_back" size={18} />
          К списку товаров
        </button>

        {loading ? <PageLoading /> : (
          <form
            onSubmit={onSubmit}
            className="relative mx-auto max-w-3xl overflow-hidden rounded-lg border border-border bg-surface p-8"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                <Icon name={editing ? "edit" : "diamond"} size={24} />
              </div>
              <div>
                <h1 className="text-h1 text-on-surface">
                  {editing ? "Изменить артикул" : "Добавить товар"}
                </h1>
                <p className="mt-1 text-body text-secondary">
                  {editing
                    ? "Обновите карточку номенклатуры. Цвет золота нужен только для золотых изделий."
                    : "Заполните карточку товара. Артикул можно не указывать — система выдаст его сама."}
                </p>
              </div>
            </div>

            {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}

            <section className="mb-8 grid gap-4 md:grid-cols-2">
              <h2 className="text-h2 md:col-span-2">Основное</h2>
              <label className="flex flex-col gap-1.5">
                <span className="label-caps text-secondary">Артикул</span>
                <input name="sku" defaultValue={product?.sku ?? ""} placeholder="PT-000001" className={fieldClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label-caps text-secondary">Название</span>
                <input name="name" required defaultValue={product?.name ?? ""} placeholder="Кольцо 585" className={fieldClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label-caps text-secondary">Категория</span>
                <select name="itemCategory" defaultValue={product?.itemCategory ?? "rings"} className={fieldClass}>
                  {(Object.entries(ITEM_CATEGORY_LABEL) as Array<[ItemCategory, string]>).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label-caps text-secondary">Вес, г</span>
                <input name="weight" required defaultValue={product?.weight ?? ""} placeholder="2.350" className={fieldClass} />
              </label>
            </section>

            <section className="mb-8 space-y-4">
              <h2 className="text-h2">Металл</h2>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(METAL_LABEL) as Array<[MetalCategory, string]>).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMetal(id)}
                    className={
                      metal === id
                        ? "rounded border border-gold bg-surface-low px-3 py-3 text-body text-on-surface"
                        : "rounded border border-border bg-background px-3 py-3 text-body text-secondary hover:border-gold"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              {metal === "gold" ? (
                <div>
                  <p className="mb-2 label-caps text-secondary">Цвет золота</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(GOLD_TONE_LABEL) as GoldTone[]).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTone(id)}
                        className={
                          tone === id
                            ? "flex items-center gap-2 rounded border border-gold bg-surface-low px-3 py-3 text-body"
                            : "flex items-center gap-2 rounded border border-border bg-background px-3 py-3 text-body text-secondary hover:border-gold"
                        }
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-border"
                          style={{ background: TONE_SWATCH[id] }}
                        />
                        {GOLD_TONE_LABEL[id]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-secondary">Для серебра и бриллиантов цвет золота не выбирается.</p>
              )}
            </section>

            <section className="mb-8 grid gap-4 md:grid-cols-3">
              <h2 className="text-h2 md:col-span-3">Поставщик и цена</h2>
              <label className="flex flex-col gap-1.5 md:col-span-3">
                <span className="label-caps text-secondary">Поставщик</span>
                <select name="supplierId" required defaultValue={product?.supplierId ?? ""} className={fieldClass}>
                  <option value="">Выберите поставщика</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label-caps text-secondary">Цена, тг</span>
                <input name="price" defaultValue={product?.price ?? ""} placeholder="45990.00" className={fieldClass} />
              </label>
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="label-caps text-secondary">Себестоимость, тг</span>
                <input name="costPrice" defaultValue={product?.costPrice ?? ""} placeholder="22100.00" className={fieldClass} />
              </label>
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-gold px-6 py-3 label-caps text-on-primary hover:bg-surface-tint disabled:opacity-50"
              >
                {busy ? "Сохранение…" : editing ? "Сохранить" : "Добавить товар"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/sklad")}
                className="rounded border border-border px-6 py-3 label-caps text-on-surface hover:bg-surface-high"
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
