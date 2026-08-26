"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { Notice, PageLoading } from "@/components/notice";
import { api, errorMessage } from "@/lib/api";
import { formatKopecks } from "@/lib/format";
import { displayName, ITEM_CATEGORY_LABEL } from "@/lib/labels";
import type {
  AnalyticsCategories,
  AnalyticsPeriod,
  AnalyticsRevenue,
  AnalyticsSeller,
  AnalyticsSummary,
} from "@/lib/types";

const PERIODS: Array<{ id: AnalyticsPeriod; label: string }> = [
  { id: "day", label: "День" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
];

const DONUT = ["#C9B07A", "#8A8074", "#6E8B78", "#B7A48C", "#5C574F", "#D4C4A8"];

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenue, setRevenue] = useState<AnalyticsRevenue | null>(null);
  const [categories, setCategories] = useState<AnalyticsCategories | null>(null);
  const [sellers, setSellers] = useState<AnalyticsSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [nextSummary, nextRevenue, nextCategories, nextSellers] = await Promise.all([
          api.analytics.summary(period),
          api.analytics.revenue(period),
          api.analytics.categories(period),
          api.analytics.sellers(period),
        ]);
        if (cancelled) return;
        setSummary(nextSummary);
        setRevenue(nextRevenue);
        setCategories(nextCategories);
        setSellers(nextSellers.items ?? []);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <AppShell
      title="Аналитика"
      showSearch={false}
      extraRight={
        <div className="mr-3 hidden items-center gap-2 sm:flex">
          <div className="flex items-center rounded border border-border bg-surface-low p-1">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={
                  period === item.id
                    ? "rounded bg-white px-3 py-1 label-caps text-on-surface shadow-sm"
                    : "px-3 py-1 label-caps text-secondary transition-colors hover:text-on-surface"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => api.analytics.export("revenue", period).catch((err) => setError(errorMessage(err)))}
            className="rounded border border-border px-3 py-1.5 label-caps hover:border-gold"
          >
            Скачать Excel
          </button>
        </div>
      }
    >
      <div className="p-page">
        {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}
        {loading ? <PageLoading /> : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Выручка" value={formatKopecks(summary?.revenueMinor ?? 0)} icon="payments" goldIcon />
              <Kpi label="Чеков" value={String(summary?.receiptsCount ?? 0)} icon="receipt_long" />
              <Kpi label="Средний чек" value={formatKopecks(summary?.averageCheck ?? 0)} icon="calculate" />
              <Kpi label="Изделий" value={String(summary?.itemsQty ?? 0)} icon="diamond" />
            </div>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-surface p-6 lg:col-span-2">
                <h3 className="mb-6 text-h2 font-medium">Динамика выручки</h3>
                <RevenueChart buckets={revenue?.byBucket ?? []} />
              </div>
              <div className="rounded-lg border border-border bg-surface p-6">
                <h3 className="mb-6 text-h2 font-medium">Продажи по категориям</h3>
                <DonutChart items={categories?.items ?? []} />
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="border-b border-border p-6">
                <h3 className="text-h2 font-medium">Рейтинг продавцов</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-low">
                    <th className="px-6 py-3 label-caps text-secondary">#</th>
                    <th className="px-6 py-3 label-caps text-secondary">Продавец</th>
                    <th className="px-6 py-3 text-right label-caps text-secondary">Чеков</th>
                    <th className="px-6 py-3 text-right label-caps text-secondary">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => (
                    <tr key={seller.sellerId} className="border-b border-border hover:bg-surface-lowest">
                      <td className="px-6 py-3 text-body">{seller.rank}</td>
                      <td className="px-6 py-3 text-body">{displayName(seller)}</td>
                      <td className="px-6 py-3 text-right text-table">{seller.receiptsCount}</td>
                      <td className="px-6 py-3 text-right text-table tabular">{formatKopecks(seller.revenueMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, icon, goldIcon }: { label: string; value: string; icon: string; goldIcon?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-2 flex items-start justify-between">
        <span className="label-caps text-secondary">{label}</span>
        <Icon name={icon} size={18} className={goldIcon ? "text-gold" : "text-secondary"} />
      </div>
      <div className="text-h1 font-bold">{value}</div>
    </div>
  );
}

function RevenueChart({ buckets }: { buckets: Array<{ bucket: string; revenueMinor: number }> }) {
  const width = 700;
  const height = 220;
  const pad = { l: 48, r: 12, t: 16, b: 32 };
  const values = buckets.map((item) => item.revenueMinor / 100);
  const max = Math.max(1, ...values);
  if (values.length === 0) {
    return <p className="text-body text-secondary">Нет данных за период</p>;
  }
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const points = values.map((value, index) => ({
    x: pad.l + (index / Math.max(1, values.length - 1)) * innerW,
    y: pad.t + innerH - (value / max) * innerH,
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${pad.t + innerH} L ${points[0].x} ${pad.t + innerH} Z`;

  return (
    <div className="h-64 w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A66B" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C9A66B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#revenueFill)" />
        <path d={line} fill="none" stroke="#C9A66B" strokeWidth="2" />
        {points.map((point, index) => (
          <circle key={buckets[index].bucket} cx={point.x} cy={point.y} r="3" fill="#fff" stroke="#C9A66B" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ items }: { items: Array<{ key: string; qty: number; revenueMinor: number }> }) {
  const total = items.reduce((sum, item) => sum + item.revenueMinor, 0) || 1;
  const radius = 70;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const slices = items.reduce<
    Array<{ key: string; qty: number; revenueMinor: number; dash: string; offset: number; color: string }>
  >((acc, item, index) => {
    const length = (item.revenueMinor / total) * circumference;
    const offset = acc.reduce((sum, slice) => sum + (slice.revenueMinor / total) * circumference, 0);
    acc.push({
      ...item,
      dash: `${length} ${circumference - length}`,
      offset,
      color: DONUT[index % DONUT.length],
    });
    return acc;
  }, []);

  return (
    <div className="flex h-64 flex-col items-center justify-center">
      <svg viewBox="0 0 180 180" className="h-40 w-40">
        <g transform="rotate(-90 90 90)">
          {slices.map((slice) => (
            <circle
              key={slice.key}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={slice.dash}
              strokeDashoffset={-slice.offset}
            />
          ))}
        </g>
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {items.map((item, index) => (
          <div key={item.key} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT[index % DONUT.length] }} />
            <span className="text-[11px] text-secondary">
              {ITEM_CATEGORY_LABEL[item.key as keyof typeof ITEM_CATEGORY_LABEL] ?? item.key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
