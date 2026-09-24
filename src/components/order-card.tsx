import { Store } from "lucide-react";
import { formatMoney, Order } from "@/lib/types";

export function OrderCard({ order, showCustomer = false }: { order: Order; showCustomer?: boolean }) {
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
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{order.status}</p>
        </div>
      </header>

      <ul className="divide-y divide-border">
        {order.items.map((item) => (
          <li key={item.id} className="px-5 py-4">
            <div className="flex justify-between gap-4 text-sm">
              <span>
                {item.product.name} <span className="text-muted-foreground">— Required: {item.quantity}</span>
              </span>
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
          </li>
        ))}
      </ul>

      <footer className="flex flex-col items-end gap-1 border-t border-border px-5 py-3 text-sm">
        <span className="text-muted-foreground">Subtotal {formatMoney(order.subtotal)}</span>
        {Number(order.discountAmount) > 0 && (
          <span className="text-emerald-700">
            {order.discountType === "PRODUCT" ? "Product" : "Platform"} discount −{formatMoney(order.discountAmount)}
          </span>
        )}
      </footer>
    </article>
  );
}
