import { translateMessage } from "./i18n";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./session";
import type {
  AnalyticsCategories,
  AnalyticsPeriod,
  AnalyticsRevenue,
  AnalyticsSellers,
  AnalyticsSummary,
  AuthHistoryEvent,
  CatalogDictionaries,
  Customer,
  Item,
  ItemCategory,
  ItemStatus,
  Location,
  LoginResult,
  MeUser,
  MetalCategory,
  Order,
  Paginated,
  PaymentMethod,
  ProductSearchResult,
  ProductWithStock,
  Sale,
  Shift,
  ShiftState,
  StaffUser,
  StockStatus,
  Supplier,
  TokenPair,
  UserRole,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env");
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return translateMessage(error.message, error.status);
  if (error instanceof Error) return translateMessage(error.message);
  return "Неизвестная ошибка";
}

function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

function nestMessage(body: unknown, fallback: string, status?: number) {
  if (!body || typeof body !== "object") return translateMessage(fallback, status);
  const message = (body as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return translateMessage(message, status);
  if (Array.isArray(message) && message.length) {
    return translateMessage(message.map(String).join(". "), status);
  }
  return translateMessage(fallback, status);
}

async function parseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      clearTokens();
      return false;
    }
    const data = (await response.json()) as TokenPair;
    setTokens(data.accessToken, data.refreshToken);
    return true;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && options.auth !== false && options.retry !== false) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return request<T>(path, { ...options, retry: false });
    }
  }

  if (response.status === 204) return undefined as T;

  const body = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      nestMessage(body, response.statusText || "Ошибка запроса", response.status),
      body,
    );
  }
  return body as T;
}

async function requestBlob(path: string) {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { headers });
  if (response.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) return requestBlob(path);
  }
  if (!response.ok) {
    const body = await parseBody(response);
    throw new ApiError(response.status, nestMessage(body, "Не удалось скачать файл", response.status), body);
  }
  return {
    blob: await response.blob(),
    filename:
      response.headers.get("content-disposition")?.match(/filename="?([^"]+)"?/i)?.[1] ??
      "report.xlsx",
  };
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResult>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      }),
    me: () => request<MeUser>("/api/auth/me"),
    updateProfile: (body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string | null;
      locationId?: string | null;
    }) => request<MeUser>("/api/auth/me", { method: "PATCH", body }),
    history: () => request<AuthHistoryEvent[]>("/api/auth/history"),
    changePassword: (password: string) =>
      request<void>("/api/auth/password", {
        method: "PATCH",
        body: { password },
      }),
    refresh: (refreshToken: string) =>
      request<TokenPair>("/api/auth/refresh", {
        method: "POST",
        body: { refreshToken },
        auth: false,
      }),
    logout: (refreshToken: string) =>
      request<void>("/api/auth/logout", {
        method: "POST",
        body: { refreshToken },
        auth: false,
      }),
    forgotPassword: (email: string) =>
      request<{ message: string; devToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
        auth: false,
      }),
    resetPassword: (token: string, newPassword: string) =>
      request<void>("/api/auth/reset-password", {
        method: "POST",
        body: { token, newPassword },
        auth: false,
      }),
  },
  catalog: {
    dictionaries: () => request<CatalogDictionaries>("/api/catalog/dictionaries"),
    suppliers: () => request<Supplier[]>("/api/catalog/suppliers"),
    search: (q: string, limit = 40) =>
      request<ProductSearchResult[]>(`/api/catalog/search${qs({ q, limit })}`),
    products: (params: {
      page?: number;
      limit?: number;
      itemCategory?: ItemCategory | "";
      metalCategory?: MetalCategory | "";
      goldTone?: string;
      stockStatus?: StockStatus | "";
      q?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
      supplierId?: string;
      locationId?: string;
    } = {}) =>
      request<Paginated<ProductWithStock>>(`/api/catalog/products${qs(params)}`),
    product: (id: string) => request<ProductWithStock>(`/api/catalog/products/${id}`),
  },
  products: {
    get: (id: string) => request<ProductWithStock>(`/api/products/${id}`),
    create: (body: {
      sku?: string;
      name: string;
      weight: string;
      metalCategory: MetalCategory;
      goldTone?: string | null;
      itemCategory: ItemCategory;
      supplierId: string;
      price?: string;
      costPrice?: string;
    }) => request<ProductWithStock>("/api/products", { method: "POST", body }),
    update: (
      id: string,
      body: {
        sku?: string;
        name?: string;
        weight?: string;
        metalCategory?: MetalCategory;
        goldTone?: string | null;
        itemCategory?: ItemCategory;
        supplierId?: string;
        price?: string | null;
        costPrice?: string | null;
      },
    ) => request<ProductWithStock>(`/api/products/${id}`, { method: "PATCH", body }),
    remove: (id: string) =>
      request<void>(`/api/products/${id}`, { method: "DELETE" }),
  },
  suppliers: {
    list: (includeInactive = true) =>
      request<Supplier[]>(`/api/suppliers${qs({ includeInactive })}`),
    create: (body: { name: string; phone?: string; email?: string }) =>
      request<Supplier>("/api/suppliers", { method: "POST", body }),
    update: (
      id: string,
      body: { name?: string; phone?: string | null; email?: string | null; isActive?: boolean },
    ) => request<Supplier>(`/api/suppliers/${id}`, { method: "PATCH", body }),
    remove: (id: string) =>
      request<void>(`/api/suppliers/${id}`, { method: "DELETE" }),
  },
  locations: {
    list: () => request<Location[]>("/api/locations"),
    get: (id: string) => request<Location>(`/api/locations/${id}`),
    create: (body: { name: string; type: Location["type"]; parentId?: string }) =>
      request<Location>("/api/locations", { method: "POST", body }),
    update: (
      id: string,
      body: { name?: string; type?: Location["type"]; parentId?: string | null },
    ) => request<Location>(`/api/locations/${id}`, { method: "PATCH", body }),
    remove: (id: string) =>
      request<void>(`/api/locations/${id}`, { method: "DELETE" }),
  },
  items: {
    list: (params: {
      page?: number;
      limit?: number;
      locationId?: string;
      productId?: string;
      status?: ItemStatus | "";
      itemCategory?: ItemCategory | "";
      metalCategory?: MetalCategory | "";
      supplierId?: string;
      q?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}) => request<Paginated<Item>>(`/api/items${qs(params)}`),
    updateStatus: (id: string, status: ItemStatus, comment?: string) =>
      request<Item>(`/api/items/${id}/status`, {
        method: "PATCH",
        body: { status, comment },
      }),
  },
  shifts: {
    current: () => request<ShiftState>("/api/shifts/current"),
    open: (locationId?: string) =>
      request<Shift>("/api/shifts/open", {
        method: "POST",
        body: locationId ? { locationId } : {},
      }),
    close: (id: string) =>
      request<ShiftState>(`/api/shifts/${id}/close`, { method: "POST" }),
    list: (locationId?: string) =>
      request<Shift[]>(`/api/shifts${qs({ locationId })}`),
    get: (id: string) => request<ShiftState>(`/api/shifts/${id}`),
  },
  sales: {
    list: (locationId?: string) =>
      request<Sale[]>(`/api/sales${qs({ locationId })}`),
    get: (id: string) => request<Sale>(`/api/sales/${id}`),
    createDraft: (body: { customerId?: string; locationId?: string } = {}) =>
      request<Sale>("/api/sales/drafts", { method: "POST", body }),
    updateDraft: (
      id: string,
      body: {
        customerId?: string | null;
        discountMinor?: number;
        discountPercent?: number;
        promoCode?: string;
      },
    ) => request<Sale>(`/api/sales/drafts/${id}`, { method: "PATCH", body }),
    addItem: (id: string, body: { itemId?: string; productId?: string; qty?: number }) =>
      request<Sale>(`/api/sales/drafts/${id}/items`, { method: "POST", body }),
    updateItem: (id: string, lineId: string, body: { qty?: number }) =>
      request<Sale>(`/api/sales/drafts/${id}/items/${lineId}`, {
        method: "PATCH",
        body,
      }),
    removeItem: (id: string, lineId: string) =>
      request<Sale>(`/api/sales/drafts/${id}/items/${lineId}`, { method: "DELETE" }),
    cancelDraft: (id: string) =>
      request<void>(`/api/sales/drafts/${id}`, { method: "DELETE" }),
    pay: (id: string, paymentMethod: PaymentMethod) =>
      request<Sale>(`/api/sales/drafts/${id}/pay`, {
        method: "POST",
        body: { paymentMethod },
      }),
    refund: (id: string, reason?: string) =>
      request<Sale>(`/api/sales/${id}/refund`, {
        method: "POST",
        body: reason ? { reason } : {},
      }),
  },
  customers: {
    list: () => request<Customer[]>("/api/customers"),
  },
  orders: {
    list: () => request<Order[]>("/api/orders"),
  },
  analytics: {
    summary: (period: AnalyticsPeriod) =>
      request<AnalyticsSummary>(`/api/analytics/summary${qs({ period })}`),
    revenue: (period: AnalyticsPeriod) =>
      request<AnalyticsRevenue>(`/api/analytics/revenue${qs({ period })}`),
    categories: (period: AnalyticsPeriod) =>
      request<AnalyticsCategories>(
        `/api/analytics/categories${qs({ period, groupBy: "itemCategory" })}`,
      ),
    sellers: (period: AnalyticsPeriod) =>
      request<AnalyticsSellers>(`/api/analytics/sellers${qs({ period, limit: 10 })}`),
    export: async (report: string, period: AnalyticsPeriod, format: "xlsx" | "pdf" = "xlsx") => {
      const file = await requestBlob(
        `/api/analytics/export${qs({ report, period, format })}`,
      );
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
  users: {
    list: () => request<StaffUser[]>("/api/users"),
    create: (body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      phone?: string;
      locationId?: string;
    }) => request<StaffUser>("/api/users", { method: "POST", body }),
    update: (
      id: string,
      body: {
        email?: string;
        firstName?: string;
        lastName?: string;
        role?: UserRole;
        phone?: string | null;
        locationId?: string | null;
        status?: "active" | "blocked";
      },
    ) => request<StaffUser>(`/api/users/${id}`, { method: "PATCH", body }),
    setPassword: (id: string, password: string) =>
      request<void>(`/api/users/${id}/password`, {
        method: "PATCH",
        body: { password },
      }),
    remove: (id: string) =>
      request<void>(`/api/users/${id}`, { method: "DELETE" }),
  },
};
