export type UserRole =
  | "admin"
  | "store_manager"
  | "cashier"
  | "online_manager"
  | "warehouse";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  locationId: string | null;
};

export type MeUser = AuthUser & {
  firstName: string;
  lastName: string;
  totpEnabled: boolean;
  location?: Location | null;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type LoginOk = TokenPair & { status: "ok"; user: AuthUser };
export type LoginTotpRequired = { status: "totp_required"; challengeId: string };
export type LoginTotpEnrollment = {
  status: "totp_enrollment";
  challengeId: string;
  otpauthUrl: string;
  secret: string;
};
export type LoginResult = LoginOk | LoginTotpRequired | LoginTotpEnrollment;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type MetalCategory = "gold" | "silver" | "diamonds";
export type GoldTone = "red" | "yellow" | "white";
export type ItemCategory =
  | "rings"
  | "earrings"
  | "studs"
  | "necklaces"
  | "bracelets"
  | "chains";
export type StockStatus = "in_stock" | "out_of_stock" | "low";
export type ItemStatus =
  | "in_stock"
  | "on_display"
  | "sold"
  | "in_repair"
  | "in_cleaning"
  | "on_commission";

export type CatalogDictionaries = {
  metalCategories: MetalCategory[];
  goldTones: GoldTone[];
  itemCategories: ItemCategory[];
  itemStatuses: ItemStatus[];
  locationTypes: string[];
  stockStatuses: StockStatus[];
};

export type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  weight: string;
  metalCategory: MetalCategory;
  goldTone: GoldTone | null;
  itemCategory: ItemCategory;
  supplierId: string;
  supplier?: Supplier;
  price: string | null;
  costPrice: string | null;
  outOfStock: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductWithStock = Product & {
  availableQty: number;
  stale: boolean;
};

export type ProductSearchResult = ProductWithStock & {
  match: "sku" | "name" | "supplier";
  score: number;
};

export type Location = {
  id: string;
  type: "warehouse" | "store" | "display";
  name: string;
  parentId: string | null;
};

export type Item = {
  id: string;
  uniqueTag: string;
  productId: string;
  locationId: string;
  batchId: string | null;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  location?: Location;
};

export type ShiftStatus = "open" | "closed";

export type ShiftSummary = {
  cashTotal: number;
  cardTotal: number;
  grandTotal: number;
  receiptsCount: number;
  averageCheck: number;
  soldItemsCount: number;
};

export type Shift = {
  id: string;
  cashierId: string;
  locationId: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt: string | null;
  cashTotal: string;
  cardTotal: string;
  cashier?: { id: string; firstName?: string; lastName?: string; email?: string };
  location?: Location;
};

export type AuthHistoryEvent = {
  id: string;
  action: string;
  createdAt: string;
  payload: { ip?: string | null; userAgent?: string | null } | null;
};

export type ShiftState = Shift & {
  summary: ShiftSummary;
  receipts: Sale[];
};

export type PaymentMethod = "cash" | "card";
export type SaleStatus = "draft" | "paid" | "refunded";

export type Customer = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  loyaltyPoints: number;
  notes: string | null;
};

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string;
  itemId: string | null;
  qty: number;
  price: string;
  discount: string;
  discountPercent: number;
  promoCode: string | null;
  lineTotal: string;
  product?: Product;
  item?: Item | null;
};

export type Sale = {
  id: string;
  date: string;
  receiptNumber: string | null;
  locationId: string;
  sellerId: string;
  shiftId: string | null;
  customerId: string | null;
  paymentMethod: PaymentMethod | null;
  channel: "offline" | "online";
  status: SaleStatus;
  promoCode: string | null;
  discountPercent: number;
  discount: string;
  totalAmount: string;
  originalSaleId: string | null;
  items: SaleItem[];
  customer?: Customer | null;
  seller?: { id: string; firstName?: string; lastName?: string; email?: string };
};

export type AnalyticsPeriod = "day" | "week" | "month" | "year";

export type AnalyticsSummary = {
  revenueMinor: number;
  receiptsCount: number;
  itemsQty: number;
  averageCheck: number;
  period?: unknown;
  scope?: unknown;
};

export type AnalyticsRevenue = {
  totals: {
    revenueMinor: number;
    receiptsCount: number;
    itemsQty: number;
    averageCheck: number;
  };
  byBucket: Array<{
    bucket: string;
    revenueMinor: number;
    receiptsCount: number;
    itemsQty: number;
  }>;
};

export type AnalyticsCategories = {
  groupBy: string;
  items: Array<{ key: string; qty: number; revenueMinor: number }>;
};

export type AnalyticsSeller = {
  rank: number;
  sellerId: string;
  email: string;
  firstName: string;
  lastName: string;
  receiptsCount: number;
  revenueMinor: number;
  itemsQty?: number;
};

export type AnalyticsSellers = {
  items: AnalyticsSeller[];
};

export type OrderStatus =
  | "new"
  | "confirmed"
  | "assembled"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: string;
  comment: string | null;
  createdAt: string;
  customer?: Customer;
  items?: Array<{ id: string; qty: number; productId?: string }>;
};

export type StaffUser = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: "active" | "blocked";
  locationId: string | null;
  location?: Location | null;
  totpEnabled: boolean;
  createdAt: string;
};
