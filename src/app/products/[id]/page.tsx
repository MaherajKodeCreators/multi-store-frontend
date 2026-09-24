"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Minus, Plus, Store as StoreIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/states";
import { imageUrl, ProductDetail } from "@/lib/types";
import { formatMoney } from "@/lib/types";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["product", id],
    queryFn: async ({ signal }) => (await apiClient.get<ProductDetail>(`/products/${id}`, { signal })).data,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/products" className="mb-6 flex w-fit items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-3.5" /> Back to shop
      </Link>

      {query.isPending ? (
        <div className="grid gap-10 sm:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error, "Product not found")} onRetry={() => query.refetch()} />
      ) : (
        <ProductDetailView product={query.data} />
      )}
    </div>
  );
}

function ProductDetailView({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { user } = useAuth();
  const { add, items } = useCart();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const maxAddable = Math.max(product.availableQuantity - inCart, 0);
  const outOfStock = product.availableQuantity === 0;
  const isAdmin = user?.role === "ADMIN";
  const images = product.images.length > 0 ? product.images : [null];
  const activeTier = [...product.productDiscounts].sort((a, b) => b.minQuantity - a.minQuantity).find((d) => qty + inCart >= d.minQuantity);

  return (
    <div className="grid gap-10 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="aspect-square w-full overflow-hidden bg-secondary">
          {images[active] ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded/external product photo
            <img src={imageUrl(images[active]!)} alt={product.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="font-serif text-9xl text-foreground/15 italic">{product.name.charAt(0)}</span>
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2">
            {product.images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActive(i)}
                className={`size-16 shrink-0 overflow-hidden border ${active === i ? "border-foreground" : "border-border"}`}
                aria-label={`View image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded/external product photo */}
                <img src={imageUrl(src)} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{outOfStock ? "Out of stock" : `${product.availableQuantity} available`}</p>
          <h1 className="font-serif text-4xl">{product.name}</h1>
          <p className="mt-2 text-xl">{formatMoney(product.price)}</p>
        </div>

        {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}

        {product.productDiscounts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Bulk pricing</p>
            <ul className="flex flex-wrap gap-1.5">
              {product.productDiscounts.map((d) => (
                <li
                  key={d.id}
                  className={`border px-2 py-1 text-xs ${activeTier?.id === d.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}
                >
                  Buy {d.minQuantity}+ · {Number(d.discountPercentage)}% off
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.stores.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Available at</p>
            <ul className="flex flex-col gap-1">
              {product.stores.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <StoreIcon className="size-3.5" />
                  {s.name} <span className="text-xs">({s.quantity} in stock)</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isAdmin && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center border border-border">
              <button className="p-2.5 disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
                <Minus className="size-3.5" />
              </button>
              <span className="w-10 text-center text-sm" aria-live="polite">{qty}</span>
              <button
                className="p-2.5 disabled:opacity-30"
                onClick={() => setQty((q) => Math.min(maxAddable, q + 1))}
                disabled={qty >= maxAddable}
                aria-label="Increase quantity"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <Button
              className="h-11 flex-1 rounded-none uppercase tracking-[0.15em]"
              disabled={outOfStock || maxAddable === 0}
              onClick={() => {
                add({ productId: product.id, name: product.name, price: Number(product.price), image: product.images[0] }, qty);
                toast.success(`${qty} × ${product.name} added to cart`, {
                  action: { label: "View cart", onClick: () => router.push("/cart") },
                });
                setQty(1);
              }}
            >
              {outOfStock ? "Sold out" : maxAddable === 0 ? "All in cart" : "Add to cart"}
            </Button>
          </div>
        )}
        {product.productDiscounts.length > 0 && <Badge className="w-fit rounded-none bg-accent text-accent-foreground">Bulk offer available</Badge>}
      </div>
    </div>
  );
}
