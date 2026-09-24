"use client";

import { createContext, useCallback, useContext } from "react";
import { createLocalStore, useLocalStore } from "@/lib/storage";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
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
const cartStore = createLocalStore<CartItem[]>("cart", EMPTY);
const update = (fn: (prev: CartItem[]) => CartItem[]) => cartStore.set(fn(cartStore.get()));

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useLocalStore(cartStore);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity: number) => {
    update((prev) =>
      prev.some((i) => i.productId === item.productId)
        ? prev.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i))
        : [...prev, { ...item, quantity }],
    );
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    update((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const remove = useCallback((productId: string) => update((prev) => prev.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => cartStore.set(null), []);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return <CartContext.Provider value={{ items, count, add, setQuantity, remove, clear }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
