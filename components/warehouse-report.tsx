"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter } from "@/components/filter-select";
import { Icon } from "@/components/icon";
import { Notice, PageLoading } from "@/components/notice";
import { api, errorMessage } from "@/lib/api";
import { formatGrams } from "@/lib/format";
import {
  GOLD_TONE_LABEL,
  ITEM_CATEGORY_LABEL,
  LOCATION_TYPE_LABEL,
  METAL_LABEL,
  metalLine,
} from "@/lib/labels";
import type {
  GoldTone,
  ItemCategory,
  Location,
  MetalCategory,
  StockReport,
  StockReportBucket,
  StockReportProduct,
  StockReportScope,
  Supplier,
} from "@/lib/types";

const SCOPE_OPTIONS: Array<{ value: StockReportScope | ""; label: string }> = [
  { value: "available", label: "Склад + витрина" },
  { value: "in_stock", label: "Только склад" },
  { value: "on_display", label: "Только витрина" },
];

export function WarehouseReport({ search }: { search: string }) {
  const [report, setReport] = useState<StockReport | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [metal, setMetal] = useState<MetalCategory | "">("");
  const [tone, setTone] = useState<GoldTone | "">("");
  const [supplierId, setSupplierId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [scope, setScope] = useState<StockReportScope>("available");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.catalog.suppliers().then(setSuppliers).catch(() => setSuppliers([]));
    void api.locations.list().then(setLocations).catch(() => setLocations([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(
        await api.catalog.stockReport({
          q: search || undefined,
          itemCategory: category,
          metalCategory: metal,
          goldTone: tone || undefined,
          supplierId: supplierId || undefined,
          locationId: locationId || undefined,
          scope,
          productLimit: 10,
        }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, category, metal, tone, supplierId, locationId, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  function reset() {
    setCategory("");
    setMetal("");
    setTone("");
    setSupplierId("");
    setLocationId("");
    setScope("available");
  }

  const totals = report?.totals;
  const showTone = metal === "" || metal === "gold";

  return (
    <>
      {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded border border-border bg-surface-lowest p-4">
        <Filter
          label="Категория"
          value={category}
          onChange={(value) => setCategory(value as ItemCategory | "")}
          options={[
            { value: "", label: "Все изделия" },
            ...Object.entries(ITEM_CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Filter
          label="Металл"
          value={metal}
          onChange={(value) => {
            setMetal(value as MetalCategory | "");
            if (value && value !== "gold") setTone("");
          }}
          options={[
            { value: "", label: "Любой" },
            ...Object.entries(METAL_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
        {showTone ? (
          <Filter
            label="Цвет золота"
            value={tone}
            onChange={(value) => setTone(value as GoldTone | "")}
            options={[
              { value: "", label: "Любой цвет" },
              ...Object.entries(GOLD_TONE_LABEL).map(([value, label]) => ({ value, label })),
            ]}
          />
        ) : null}
        <Filter
          label="Поставщик"
          value={supplierId}
          onChange={setSupplierId}
          options={[
            { value: "", label: "Все поставщики" },
            ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
          ]}
        />
        {locations.length > 0 ? (
          <Filter
            label="Точка"
            value={locationId}
            onChange={setLocationId}
            options={[
              { value: "", label: "Все точки" },
              ...locations.map((location) => ({
                value: location.id,
                label: `${location.name} · ${LOCATION_TYPE_LABEL[location.type]}`,
              })),
            ]}
          />
        ) : null}
        <Filter
          label="Где лежит"
          value={scope}
          onChange={(value) => setScope((value || "available") as StockReportScope)}
          options={SCOPE_OPTIONS}
        />
        <button
          type="button"
          onClick={reset}
          className="flex h-[38px] items-center gap-2 rounded border border-border px-4 label-caps"
        >
          <Icon name="filter_list" size={18} />
          Сбросить
        </button>
      </div>

      {loading ? (
        <PageLoading />
      ) : !report || !totals ? (
        <p className="py-10 text-center text-body text-secondary">Нет данных</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Золота осталось"
              value={formatGrams(totals.goldGrams)}
              hint="В наличии по выбранным фильтрам"
              icon="diamond"
              gold
            />
            <Kpi
              label="Всего металла"
              value={formatGrams(totals.grams)}
              hint="Золото, серебро и бриллианты"
              icon="scale"
            />
            <Kpi
              label="Изделий"
              value={String(totals.units)}
              hint="Физических единиц"
              icon="inventory_2"
            />
            <Kpi
              label="Артикулов"
              value={String(totals.skuCount)}
              hint="Разных позиций"
              icon="category"
            />
          </div>

          {report.byMetal.length > 1 ? (
            <div className="mb-6 rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-4 text-h2">По металлу</h3>
              <RankList
                items={report.byMetal}
                labelOf={(item) => METAL_LABEL[item.key as MetalCategory] ?? item.name}
              />
            </div>
          ) : null}

          {report.byGoldTone.length > 0 ? (
            <div className="mb-6 rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-1 text-h2">Золото по цвету</h3>
              <p className="mb-4 text-[12px] text-secondary">Доля от остатка золота в граммах</p>
              <RankList
                items={report.byGoldTone}
                labelOf={(item) => GOLD_TONE_LABEL[item.key as GoldTone] ?? item.name}
              />
            </div>
          ) : null}

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-1 text-h2">Поставщики</h3>
              <p className="mb-4 text-[12px] text-secondary">
                У кого больше всего металла осталось на складе
              </p>
              {report.bySupplier.length === 0 ? (
                <Empty />
              ) : (
                <RankList items={report.bySupplier} labelOf={(item) => item.name} markEnds />
              )}
            </section>
            <section className="rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-1 text-h2">Изделия</h3>
              <p className="mb-4 text-[12px] text-secondary">Каких категорий больше и меньше</p>
              {report.byCategory.length === 0 ? (
                <Empty />
              ) : (
                <RankList
                  items={report.byCategory}
                  labelOf={(item) => ITEM_CATEGORY_LABEL[item.key as ItemCategory] ?? item.name}
                  markEnds
                />
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ProductRank title="Больше всего остатка" items={report.most} empty="Нет остатков" />
            <ProductRank title="Меньше всего остатка" items={report.least} empty="Нет остатков" />
          </div>
        </>
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon,
  gold,
}: {
  label: string;
  value: string;
  hint: string;
  icon: string;
  gold?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-surface p-5 ${gold ? "border-gold/50" : "border-border"}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="label-caps text-secondary">{label}</span>
        <Icon name={icon} size={18} className={gold ? "text-gold" : "text-secondary"} />
      </div>
      <div className="text-h1 font-bold tabular">{value}</div>
      <p className="mt-1 text-[12px] text-secondary">{hint}</p>
    </div>
  );
}

function RankList({
  items,
  labelOf,
  markEnds,
}: {
  items: StockReportBucket[];
  labelOf: (item: StockReportBucket) => string;
  markEnds?: boolean;
}) {
  const max = Math.max(1, ...items.map((item) => Number(item.grams)));
  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const width = Math.max(4, (Number(item.grams) / max) * 100);
        const most = markEnds && index === 0;
        const least = markEnds && items.length > 1 && index === items.length - 1;
        return (
          <li key={item.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-body font-medium">
                {labelOf(item)}
                {most ? (
                  <span className="ml-2 text-[10px] font-bold tracking-wider text-gold uppercase">больше</span>
                ) : null}
                {least ? (
                  <span className="ml-2 text-[10px] font-bold tracking-wider text-secondary uppercase">меньше</span>
                ) : null}
              </span>
              <span className="shrink-0 text-table tabular">{formatGrams(item.grams)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-high">
              <div className="h-full rounded-full bg-gold" style={{ width: `${width}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-secondary">
              {item.units} шт · {item.skuCount} арт. · {item.share}% от веса
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProductRank({
  title,
  items,
  empty,
}: {
  title: string;
  items: StockReportProduct[];
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-h2">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-body text-secondary">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.productId} className="flex items-start justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="truncate text-body font-medium">{item.name}</div>
                <div className="text-[11px] text-secondary">
                  #{item.sku} · {metalLine(item.metalCategory, item.goldTone)} ·{" "}
                  {ITEM_CATEGORY_LABEL[item.itemCategory]} · {item.supplierName}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-table font-medium tabular">{formatGrams(item.grams)}</div>
                <div className="text-[11px] text-secondary">{item.units} шт</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Empty() {
  return <p className="py-6 text-body text-secondary">По этим фильтрам остатков нет</p>;
}
