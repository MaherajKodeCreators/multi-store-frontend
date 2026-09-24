"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/states";
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog";
import { ResourceTable } from "@/components/admin/resource-table";
import { apiClient } from "@/lib/api-client";
import { InventoryRow, Product, Store } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

const quantity = z.number({ error: "Quantity is required" }).int("Whole numbers only").min(0, "Cannot be negative");

const createSchema = z.object({
  storeId: z.string().min(1, "Choose a store"),
  productId: z.string().min(1, "Choose a product"),
  quantity,
});
const editSchema = z.object({ storeId: z.string(), productId: z.string(), quantity });

export default function AdminInventoryPage() {
  const { list, save, remove } = useResource<InventoryRow>("/inventory", "Inventory");
  const stores = useQuery({ queryKey: ["admin", "/stores"], queryFn: async ({ signal }) => (await apiClient.get<Store[]>("/stores", { signal })).data });
  const products = useQuery({ queryKey: ["admin", "/products"], queryFn: async ({ signal }) => (await apiClient.get<Product[]>("/products", { signal })).data });
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!list.data || !filter) return list;
    return { ...list, data: list.data.filter((r) => r.storeId === filter || r.productId === filter) } as typeof list;
  }, [list, filter]);

  return (
    <>
      <PageHeading
        eyebrow="Admin"
        title="Inventory"
        action={
          <div className="flex flex-wrap gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 border border-input bg-transparent px-2 text-sm"
              aria-label="Filter inventory"
            >
              <option value="">All stores & products</option>
              <optgroup label="Store">
                {stores.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>
              <optgroup label="Product">
                {products.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            </select>
            <Button className="rounded-none" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus /> Add stock
            </Button>
          </div>
        }
      />
      <ResourceTable
        query={filtered}
        emptyTitle="No inventory records"
        columns={[
          { header: "Product", cell: (r) => <span className="font-medium">{r.product.name}</span> },
          { header: "Store", cell: (r) => r.store.name },
          {
            header: "Quantity",
            cell: (r) => <span className={r.quantity === 0 ? "text-destructive" : r.quantity < 5 ? "text-amber-700" : ""}>{r.quantity}</span>,
          },
        ]}
        onEdit={(r) => { setEditing(r); setOpen(true); }}
        onDelete={(r) => remove.mutate(r.id)}
        deleteLabel={(r) => `${r.product.name} @ ${r.store.name}`}
        deleting={remove.isPending}
      />
      <ResourceFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Update stock: ${editing.product.name} @ ${editing.store.name}` : "Add stock to a store"}
        schema={editing ? editSchema : createSchema}
        isEdit={!!editing}
        pending={save.isPending}
        defaultValues={editing ? { storeId: editing.storeId, productId: editing.productId, quantity: editing.quantity } : { storeId: "", productId: "" }}
        fields={[
          { name: "storeId", label: "Store", type: "select", disabledOnEdit: true, options: stores.data?.map((s) => ({ value: s.id, label: s.name })) },
          { name: "productId", label: "Product", type: "select", disabledOnEdit: true, options: products.data?.map((p) => ({ value: p.id, label: p.name })) },
          { name: "quantity", label: "Quantity", type: "number", step: "1" },
        ]}
        onSubmit={(v) =>
          save.mutate(
            editing ? { id: editing.id, data: { quantity: v.quantity } } : { data: v },
            { onSuccess: () => setOpen(false) },
          )
        }
      />
    </>
  );
}
