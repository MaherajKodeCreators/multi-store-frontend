"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/order-card";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "@/components/states";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { Order } from "@/lib/types";

export default function OrdersPage() {
  return (
    <RequireAuth role="CUSTOMER">
      <MyOrders />
    </RequireAuth>
  );
}

function MyOrders() {
  const query = useQuery({
    queryKey: ["orders"],
    queryFn: async ({ signal }) => (await apiClient.get<Order[]>("/orders", { signal })).data,
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <PageHeading eyebrow="Account" title="My orders" />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Your placed orders and their store allocation will appear here."
          action={
            <Button asChild className="rounded-none">
              <Link href="/products">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {query.data.map((o) => (
            <OrderCard key={o.id} order={o} canReturn />
          ))}
        </div>
      )}
    </div>
  );
}
