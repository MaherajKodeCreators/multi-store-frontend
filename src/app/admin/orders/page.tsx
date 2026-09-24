"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { OrderCard } from "@/components/order-card";
import { EmptyState, ErrorState, LoadingState, PageHeading } from "@/components/states";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { formatMoney, Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["orders", "admin"],
    queryFn: async ({ signal }) => (await apiClient.get<Order[]>("/orders", { signal })).data,
  });

  const term = search.trim().toLowerCase();
  const orders =
    query.data?.filter(
      (o) =>
        !term ||
        o.id.toLowerCase().includes(term) ||
        o.customer.name.toLowerCase().includes(term) ||
        o.customer.email.toLowerCase().includes(term),
    ) ?? [];
  const revenue = query.data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  return (
    <>
      <PageHeading
        eyebrow="Admin"
        title="Customer orders"
        action={
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-0 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order, name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-none border-0 border-b pl-6 shadow-none focus-visible:ring-0"
              aria-label="Search orders"
            />
          </div>
        }
      />

      {query.data && query.data.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:max-w-md">
          <div className="border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Orders</p>
            <p className="font-serif text-3xl">{query.data.length}</p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Revenue</p>
            <p className="font-serif text-3xl">{formatMoney(revenue)}</p>
          </div>
        </div>
      )}

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState title={term ? "No matching orders" : "No orders yet"} description={term ? undefined : "Customer orders will appear here."} />
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} showCustomer />
          ))}
        </div>
      )}
    </>
  );
}
