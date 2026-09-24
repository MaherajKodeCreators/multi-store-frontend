// Prisma serializes Decimal columns as strings.
export type Money = string | number;

export interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export interface ProductDiscount {
  id: string;
  productId: string;
  minQuantity: number;
  discountPercentage: Money;
  isActive: boolean;
  product?: { id: string; name: string };
}

export interface PlatformDiscount {
  id: string;
  minOrderAmount: Money;
  discountPercentage: Money;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: Money;
  images: string[];
  isActive: boolean;
  availableQuantity: number;
  productDiscounts: ProductDiscount[];
}

export interface ProductDetail extends Product {
  stores: Array<{ id: string; name: string; address: string; quantity: number }>;
}

export function imageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  return apiBase.replace(/\/api\/?$/, "") + path;
}

export interface InventoryRow {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  store: { id: string; name: string };
  product: { id: string; name: string };
}

export interface Allocation {
  storeId: string;
  storeName: string;
  quantity: number;
  distanceKm: number | null;
}

export interface QuoteLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discountPercentage: number;
  discountAmount: number;
  allocations: Allocation[];
}

export interface Quote {
  subtotal: number;
  discountType: "PRODUCT" | "PLATFORM" | null;
  discountAmount: number;
  total: number;
  platformDiscountPercentage: number | null;
  items: QuoteLine[];
}

export interface Order {
  id: string;
  status: string;
  subtotal: Money;
  discountAmount: Money;
  discountType: string | null;
  total: Money;
  createdAt: string;
  customer: { id: string; name: string; email: string };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: Money;
    lineTotal: Money;
    returnedQuantity: number;
    product: { id: string; name: string; images: string[] };
    allocations: Array<{ id: string; quantity: number; store: { id: string; name: string } }>;
    returns: Array<{ id: string; quantity: number; createdAt: string; store: { id: string; name: string } }>;
  }>;
}

export interface ReturnItemInput {
  orderItemId: string;
  quantity: number;
}

export const formatMoney = (value: Money) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));
