"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { formatMoney, Order } from "@/lib/types";

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReturnDialog({ order, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const returnable = order.items.filter((i) => i.quantity - i.returnedQuantity > 0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const setQty = (itemId: string, max: number, next: number) => {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, Math.min(max, next)) }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
      return (await apiClient.post<Order>(`/orders/${order.id}/return`, { items })).data;
    },
    onSuccess: () => {
      toast.success("Return processed. Inventory and totals have been updated.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setQuantities({});
      onOpenChange(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not process return")),
  });

  const hasSelection = Object.values(quantities).some((q) => q > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">
            Return items — Order #{order.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {returnable.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every item on this order has already been returned.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {returnable.map((item) => {
                const max = item.quantity - item.returnedQuantity;
                const qty = quantities[item.id] ?? 0;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {max} of {item.quantity} eligible for return · {formatMoney(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex items-center border border-border">
                      <button
                        type="button"
                        className="p-2 disabled:opacity-30"
                        onClick={() => setQty(item.id, max, qty - 1)}
                        disabled={qty <= 0}
                        aria-label={`Decrease return quantity for ${item.product.name}`}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
                      <button
                        type="button"
                        className="p-2 disabled:opacity-30"
                        onClick={() => setQty(item.id, max, qty + 1)}
                        disabled={qty >= max}
                        aria-label={`Increase return quantity for ${item.product.name}`}
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">
              Returned inventory goes back to the original store(s). Discounts on this order are recalculated based on what
              remains after the return.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {returnable.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              className="rounded-none"
              disabled={!hasSelection || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Processing..." : "Confirm return"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
