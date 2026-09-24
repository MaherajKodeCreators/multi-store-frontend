"use client";

import { createContext, useCallback, useContext } from "react";
import { getLocalStore, useLocalStore } from "@/lib/storage";
import { useAuth } from "@/providers/auth-provider";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  add: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const EMPTY: CartItem[] = [];
const cartKey = (userId: string | undefined) => `cart:${userId ?? "guest"}`;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Each account (and signed-out browsing) gets its own persisted cart, keyed by user id.
  const cartStore = getLocalStore<CartItem[]>(cartKey(user?.id), EMPTY);
  const items = useLocalStore(cartStore);
  const update = useCallback((fn: (prev: CartItem[]) => CartItem[]) => cartStore.set(fn(cartStore.get())), [cartStore]);

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, quantity: number) => {
      update((prev) =>
        prev.some((i) => i.productId === item.productId)
          ? prev.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i))
          : [...prev, { ...item, quantity }],
      );
    },
    [update],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      update((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      );
    },
    [update],
  );

  const remove = useCallback((productId: string) => update((prev) => prev.filter((i) => i.productId !== productId)), [update]);
  const clear = useCallback(() => cartStore.set(null), [cartStore]);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return <CartContext.Provider value={{ items, count, add, setQuantity, remove, clear }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
