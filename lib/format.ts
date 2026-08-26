import { LOCALE } from "./i18n";

export function formatMoney(value: number, withSymbol = true) {
  const formatted = value.toLocaleString(LOCALE);
  return withSymbol ? `${formatted} тг` : formatted;
}

export function formatMoneyFixed(value: number) {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toNumber(value: string | number | null | undefined) {
  if (value == null || value === "") return 0;
  return typeof value === "number" ? value : Number(value);
}

/** Product.price — сумма строкой `"45990.00"`. */
export function formatRubles(value: string | number | null | undefined, withSymbol = true) {
  if (value == null || value === "") return "—";
  return formatMoney(toNumber(value), withSymbol);
}

/** Чек / смена / аналитика — копейки. */
export function formatKopecks(value: string | number | null | undefined, withSymbol = true) {
  return formatMoney(toNumber(value) / 100, withSymbol);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDuration(from: string, to: string | null | undefined) {
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—";
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

export function deviceLabel(userAgent: string | null | undefined) {
  if (!userAgent) return "—";
  if (/iPhone|Android.+Mobile|Mobile/i.test(userAgent)) return "Телефон";
  if (/iPad|Tablet/i.test(userAgent)) return "Планшет";
  return "Компьютер";
}
