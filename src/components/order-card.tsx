"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product-thumb";
import { ReturnDialog } from "@/components/return-dialog";
import { formatMoney, Order } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-secondary text-secondary-foreground",
  PARTIALLY_RETURNED: "bg-amber-100 text-amber-800",
  RETURNED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function OrderCard({ order, showCustomer = false, canReturn = false }: { order: Order; showCustomer?: boolean; canReturn?: boolean }) {
  const [returnOpen, setReturnOpen] = useState(false);
  const hasReturnableItems = order.items.some((i) => i.quantity - i.returnedQuantity > 0);

  return (
    <article className="border border-border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="mt-1 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
          {showCustomer && (
            <p className="mt-1 text-sm">
              {order.customer.name} <span className="text-muted-foreground">· {order.customer.email}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl">{formatMoney(order.total)}</p>
          <Badge className={`rounded-none text-[11px] uppercase tracking-wider ${STATUS_STYLE[order.status] ?? "bg-secondary"}`}>
            {order.status.replace("_", " ")}
          </Badge>
        </div>
      </header>

      <ul className="divide-y divide-border">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-3 px-5 py-4">
            <Link href={`/products/${item.product.id}`} className="shrink-0">
              <ProductThumb images={item.product.images} name={item.product.name} className="size-14 object-cover" />
            </Link>
            <div className="flex-1">
              <div className="flex justify-between gap-4 text-sm">
                <Link href={`/products/${item.product.id}`} className="hover:underline">
                  {item.product.name} <span className="text-muted-foreground">— Required: {item.quantity}</span>
                </Link>
                <span>{formatMoney(item.lineTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatMoney(item.unitPrice)} each</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {item.allocations.map((a) => (
                  <li key={a.id} className="flex items-center gap-1.5 bg-secondary px-2 py-1 text-xs">
                    <Store className="size-3" />
                    {a.store.name} → {a.quantity}
                  </li>
                ))}
              </ul>
              {item.returnedQuantity > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                  <RotateCcw className="size-3" />
                  {item.returnedQuantity} of {item.quantity} returned
                  {item.returns.length > 0 && (
                    <span className="text-muted-foreground">
                      ({item.returns.map((r) => `${r.quantity} → ${r.store.name}`).join(", ")})
                    </span>
                  )}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-border px-5 py-3">
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Subtotal {formatMoney(order.subtotal)}</span>
          {Number(order.discountAmount) > 0 && (
            <span className="text-emerald-700">
              {order.discountType === "PRODUCT" ? "Product" : "Platform"} discount −{formatMoney(order.discountAmount)}
            </span>
          )}
        </div>
        {canReturn && hasReturnableItems && (
          <Button variant="outline" size="sm" className="rounded-none" onClick={() => setReturnOpen(true)}>
            <RotateCcw /> Return items
          </Button>
        )}
      </footer>

      {canReturn && <ReturnDialog order={order} open={returnOpen} onOpenChange={setReturnOpen} />}
    </article>
  );
}
