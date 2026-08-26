import type { UserRole } from "./types";

export const SHIFT_ROLES: UserRole[] = ["admin", "store_manager", "cashier"];
export const SALE_CREATE_ROLES: UserRole[] = ["admin", "cashier"];
export const SALE_REFUND_ROLES: UserRole[] = ["admin", "store_manager"];
export const ANALYTICS_ROLES: UserRole[] = ["admin", "store_manager", "online_manager"];
export const WAREHOUSE_ROLES: UserRole[] = [
  "admin",
  "store_manager",
  "warehouse",
  "cashier",
];
export const WAREHOUSE_WRITE_ROLES: UserRole[] = [
  "admin",
  "store_manager",
  "warehouse",
];
export const PRODUCT_DELETE_ROLES: UserRole[] = ["admin", "store_manager"];
export const SETTINGS_ROLES: UserRole[] = ["admin"];
export const ONLINE_ROLES: UserRole[] = [
  "admin",
  "store_manager",
  "online_manager",
  "warehouse",
];
export const POS_ROLES: UserRole[] = ["admin", "store_manager", "cashier"];
export const USERS_ROLES: UserRole[] = ["admin"];

export function can(role: UserRole | undefined, allowed: UserRole[]) {
  return !!role && allowed.includes(role);
}

export function homePath(role: UserRole) {
  switch (role) {
    case "warehouse":
      return "/sklad";
    case "online_manager":
      return "/online";
    case "store_manager":
      return "/analytics";
    default:
      return "/kassa";
  }
}

export type NavItem = {
  href: string;
  icon: string;
  label: string;
  roles: UserRole[];
};

export const MAIN_NAV: NavItem[] = [
  { href: "/sklad", icon: "inventory_2", label: "Склад", roles: WAREHOUSE_ROLES },
  { href: "/kassa", icon: "point_of_sale", label: "Продажи", roles: POS_ROLES },
  { href: "/smena", icon: "history_toggle_off", label: "Смена", roles: SHIFT_ROLES },
  { href: "/online", icon: "shopping_bag", label: "Онлайн", roles: ONLINE_ROLES },
  { href: "/analytics", icon: "analytics", label: "Аналитика", roles: ANALYTICS_ROLES },
  {
    href: "/account",
    icon: "person",
    label: "Аккаунт",
    roles: ["admin", "store_manager", "cashier", "online_manager", "warehouse"],
  },
];
