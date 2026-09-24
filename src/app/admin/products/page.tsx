"use client";

import { useState } from "react";
import { z } from "zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/states";
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog";
import { ResourceTable, StatusPill } from "@/components/admin/resource-table";
import { ProductThumb } from "@/components/product-thumb";
import { formatMoney, Product } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  price: z.number({ error: "Price is required" }).positive("Price must be greater than 0"),
  images: z.array(z.string()).max(8).optional(),
  isActive: z.boolean(),
});

export default function AdminProductsPage() {
  const { list, save, remove } = useResource<Product>("/products", "Product", ["/inventory", "/discounts/products"]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeading
        eyebrow="Admin"
        title="Products"
        action={
          <Button className="rounded-none" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus /> Add product
          </Button>
        }
      />
      <ResourceTable
        query={list}
        emptyTitle="No products yet"
        columns={[
          {
            header: "Product",
            cell: (p) => (
              <div className="flex items-center gap-3">
                <ProductThumb images={p.images} name={p.name} className="size-10 shrink-0 object-cover" />
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                </div>
              </div>
            ),
          },
          { header: "Price", cell: (p) => formatMoney(p.price) },
          { header: "Total stock", cell: (p) => p.availableQuantity },
          { header: "Status", cell: (p) => <StatusPill active={p.isActive} /> },
        ]}
        onEdit={(p) => { setEditing(p); setOpen(true); }}
        onDelete={(p) => remove.mutate(p.id)}
        deleteLabel={(p) => p.name}
        deleting={remove.isPending}
      />
      <ResourceFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit product" : "New product"}
        schema={schema}
        isEdit={!!editing}
        pending={save.isPending}
        defaultValues={
          editing
            ? {
                name: editing.name,
                description: editing.description ?? "",
                price: Number(editing.price),
                images: editing.images,
                isActive: editing.isActive,
              }
            : { name: "", description: "", images: [], isActive: true }
        }
        fields={[
          { name: "name", label: "Name" },
          { name: "description", label: "Description" },
          { name: "price", label: "Price (₹)", type: "number", step: "0.01" },
          { name: "images", label: "Images", type: "images" },
          { name: "isActive", label: "Active (visible to customers)", type: "checkbox" },
        ]}
        onSubmit={(v) =>
          save.mutate(
            { id: editing?.id, data: { ...v, description: v.description || null } },
            { onSuccess: () => setOpen(false) },
          )
        }
      />
    </>
  );
}
