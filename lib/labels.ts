import type {
  GoldTone,
  ItemCategory,
  ItemStatus,
  Location,
  MetalCategory,
  OrderStatus,
  UserRole,
} from "./types";

export const LOCATION_TYPE_LABEL: Record<Location["type"], string> = {
  warehouse: "Склад",
  store: "Салон",
  display: "Витрина",
};

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  rings: "Кольца",
  earrings: "Серьги",
  studs: "Пусеты",
  necklaces: "Колье",
  bracelets: "Браслеты",
  chains: "Цепи",
};

export const METAL_LABEL: Record<MetalCategory, string> = {
  gold: "Золото",
  silver: "Серебро",
  diamonds: "Бриллианты",
};

export const GOLD_TONE_LABEL: Record<GoldTone, string> = {
  yellow: "Золотое",
  white: "Белое",
  red: "Красное",
};

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  in_stock: "На складе",
  on_display: "Витрина",
  sold: "Продан",
  in_repair: "Ремонт",
  in_cleaning: "Чистка",
  on_commission: "Комиссия",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Администратор",
  store_manager: "Менеджер салона",
  cashier: "Кассир",
  online_manager: "Онлайн",
  warehouse: "Склад",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  assembled: "Собран",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export function metalLine(metal: MetalCategory, tone: GoldTone | null) {
  if (metal === "gold" && tone) {
    return `${METAL_LABEL[metal]} (${GOLD_TONE_LABEL[tone]})`;
  }
  return METAL_LABEL[metal];
}

export function displayName(user: {
  firstName?: string;
  lastName?: string;
  email?: string;
} | null | undefined) {
  if (!user) return "—";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "—";
}
