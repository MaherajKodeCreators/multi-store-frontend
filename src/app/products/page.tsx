"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "@/components/states";
import { ProductThumb } from "@/components/product-thumb";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { formatMoney, Product } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["products", search],
    queryFn: async ({ signal }) => (await apiClient.get<Product[]>("/products", { params: search ? { search } : {}, signal })).data,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <PageHeading
        eyebrow="The collection"
        title="Shop all products"
        action={
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-none border-0 border-b pl-6 shadow-none focus-visible:ring-0"
              aria-label="Search products"
            />
          </div>
        }
      />

      {query.isPending ? (
        <LoadingState rows={4} />
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState title="No products found" description={search ? "Try a different search." : "Check back soon for new arrivals."} />
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const maxAddable = Math.max(product.availableQuantity - inCart, 0);
  const outOfStock = product.availableQuantity === 0;
  const isAdmin = user?.role === "ADMIN";
  const activeTier = [...product.productDiscounts]
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((d) => qty + inCart >= d.minQuantity);

  return (
    <article className="group flex flex-col">
      <Link href={`/products/${product.id}`} className="relative flex aspect-[4/5] overflow-hidden bg-secondary">
        <ProductThumb
          images={product.images}
          name={product.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.productDiscounts.length > 0 && (
          <Badge className="absolute top-3 left-3 rounded-none bg-accent text-[10px] uppercase tracking-wider text-accent-foreground">
            Bulk offer
          </Badge>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-primary/80 py-2 text-center text-[10px] uppercase tracking-[0.25em] text-primary-foreground">
            Sold out
          </span>
        )}
      </Link>

      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        <Link href={`/products/${product.id}`}>
          <h2 className="font-serif text-xl hover:underline">{product.name}</h2>
        </Link>
        {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
        <p className="text-sm font-medium">{formatMoney(product.price)}</p>
        <p className="text-xs text-muted-foreground">{outOfStock ? "Out of stock" : `${product.availableQuantity} available`}</p>

        {product.productDiscounts.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {product.productDiscounts.map((d) => (
              <li
                key={d.id}
                className={`border px-2 py-0.5 text-[11px] ${activeTier?.id === d.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}
              >
                Buy {d.minQuantity}+ · {Number(d.discountPercentage)}% off
              </li>
            ))}
          </ul>
        )}

        {!isAdmin && (
          <div className="mt-auto flex items-center gap-2 pt-4">
            <div className="flex items-center border border-border">
              <button
                className="p-2 disabled:opacity-30"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-8 text-center text-sm" aria-live="polite">
                {qty}
              </span>
              <button
                className="p-2 disabled:opacity-30"
                onClick={() => setQty((q) => Math.min(maxAddable, q + 1))}
                disabled={qty >= maxAddable}
                aria-label="Increase quantity"
              >
                <Plus className="size-3" />
              </button>
            </div>
            <Button
              className="h-9 flex-1 rounded-none text-xs uppercase tracking-[0.15em]"
              disabled={outOfStock || maxAddable === 0}
              onClick={() => {
                add({ productId: product.id, name: product.name, price: Number(product.price), image: product.images[0] }, qty);
                toast.success(`${qty} × ${product.name} added to cart`);
                setQty(1);
              }}
            >
              {maxAddable === 0 && !outOfStock ? "All in cart" : "Add to cart"}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
