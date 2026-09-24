"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Minus, Plus, Store, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, PageHeading } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/components/product-thumb";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { formatMoney, Order, Quote } from "@/lib/types";
import { useCart } from "@/providers/cart-provider";

export default function CartPage() {
  return (
    <RequireAuth role="CUSTOMER">
      <Cart />
    </RequireAuth>
  );
}

function Cart() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, setQuantity, remove, clear } = useCart();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const payload = { items: items.map(({ productId, quantity }) => ({ productId, quantity })), ...location };

  // Backend is the source of truth for prices, discounts and store allocation.
  const quote = useQuery({
    queryKey: ["quote", payload],
    queryFn: async ({ signal }) => (await apiClient.post<Quote>("/orders/quote", payload, { signal })).data,
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const placeOrder = useMutation({
    mutationFn: async () => (await apiClient.post<Order>("/orders", payload)).data,
    onSuccess: (order) => {
      clear();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Order #${order.id.slice(0, 8).toUpperCase()} placed`);
      router.push("/orders");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not place order"));
      quote.refetch();
    },
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Location is not supported by this browser");
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => toast.error("Could not get your location"),
    );
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <PageHeading eyebrow="Your bag" title="Shopping cart" />
        <EmptyState
          title="Your cart is empty"
          description="Discover pieces from our stores and add them here."
          action={
            <Button asChild className="rounded-none">
              <Link href="/products">Continue shopping</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const q = quote.data;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <PageHeading eyebrow="Your bag" title="Shopping cart" />
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => {
            const line = q?.items.find((l) => l.productId === item.productId);
            return (
              <li key={item.productId} className="flex flex-col gap-3 py-5">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/products/${item.productId}`} className="flex items-center gap-3">
                    <ProductThumb images={item.image ? [item.image] : []} name={item.name} className="size-16 shrink-0 object-cover" />
                    <div>
                      <p className="font-serif text-xl">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{formatMoney(line?.unitPrice ?? item.price)} each</p>
                    </div>
                  </Link>
                  <button onClick={() => remove(item.productId)} aria-label={`Remove ${item.name}`} className="text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center border border-border">
                    <button className="p-2" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Decrease quantity">
                      <Minus className="size-3" />
                    </button>
                    <span className="w-10 text-center text-sm">{item.quantity}</span>
                    <button className="p-2" onClick={() => setQuantity(item.productId, item.quantity + 1)} aria-label="Increase quantity">
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatMoney(line?.lineTotal ?? item.price * item.quantity)}</p>
                    {line && line.discountAmount > 0 && (
                      <p className="text-xs text-emerald-700">
                        {line.discountPercentage}% bulk discount −{formatMoney(line.discountAmount)}
                      </p>
                    )}
                  </div>
                </div>
                {line && (
                  <ul className="flex flex-wrap gap-2">
                    {line.allocations.map((a) => (
                      <li key={a.storeId} className="flex items-center gap-1.5 bg-secondary px-2 py-1 text-xs">
                        <Store className="size-3" />
                        {a.storeName} → {a.quantity}
                        {a.distanceKm !== null && <span className="text-muted-foreground">({a.distanceKm} km)</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <aside className="flex h-fit flex-col gap-4 border border-border bg-card p-6">
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Order summary</h2>

          {quote.isError ? (
            <ErrorState message={getErrorMessage(quote.error)} onRetry={() => quote.refetch()} />
          ) : !q ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <dl className={`flex flex-col gap-2 text-sm ${quote.isFetching ? "opacity-60" : ""}`}>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatMoney(q.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {q.discountType === "PRODUCT"
                    ? "Product discount"
                    : q.discountType === "PLATFORM"
                      ? `Order discount (${q.platformDiscountPercentage}%)`
                      : "Discount"}
                </dt>
                <dd className={q.discountAmount > 0 ? "text-emerald-700" : ""}>−{formatMoney(q.discountAmount)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-3 font-serif text-2xl">
                <dt>Total</dt>
                <dd>{formatMoney(q.total)}</dd>
              </div>
              {q.discountType === "PRODUCT" && (
                <p className="text-xs text-muted-foreground">Product discounts can&apos;t be combined with order-level offers.</p>
              )}
            </dl>
          )}

          <button onClick={useMyLocation} className="flex items-center gap-1.5 text-xs underline underline-offset-4">
            <MapPin className="size-3" />
            {location ? "Using your current location" : "Use current location for nearest stores"}
          </button>

          <Button
            className="h-11 rounded-none uppercase tracking-[0.15em]"
            disabled={!q || quote.isError || quote.isFetching || placeOrder.isPending}
            onClick={() => placeOrder.mutate()}
          >
            {placeOrder.isPending ? "Placing order..." : "Place order"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
