"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/states";
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog";
import { ResourceTable, StatusPill } from "@/components/admin/resource-table";
import { apiClient } from "@/lib/api-client";
import { formatMoney, PlatformDiscount, Product, ProductDiscount } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

const percentage = z
  .number({ error: "Percentage is required" })
  .gt(0, "Must be greater than 0")
  .max(100, "Cannot exceed 100%");

const productSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  minQuantity: z.number({ error: "Minimum quantity is required" }).int("Whole numbers only").min(1, "At least 1"),
  discountPercentage: percentage,
  isActive: z.boolean(),
});

const platformSchema = z.object({
  minOrderAmount: z.number({ error: "Minimum order amount is required" }).min(0, "Cannot be negative"),
  discountPercentage: percentage,
  isActive: z.boolean(),
});

export default function AdminDiscountsPage() {
  return (
    <>
      <PageHeading eyebrow="Admin" title="Discounts" />
      <p className="-mt-4 mb-10 max-w-2xl text-sm text-muted-foreground">
        Product discounts apply per item once its quantity reaches the threshold. If any product discount applies, the
        order-level platform discount is skipped — the two never combine.
      </p>
      <div className="flex flex-col gap-14">
        <ProductDiscounts />
        <PlatformDiscounts />
      </div>
    </>
  );
}

function ProductDiscounts() {
  const { list, save, remove } = useResource<ProductDiscount>("/discounts/products", "Product discount");
  const products = useQuery({ queryKey: ["admin", "/products"], queryFn: async ({ signal }) => (await apiClient.get<Product[]>("/products", { signal })).data });
  const [editing, setEditing] = useState<ProductDiscount | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="font-serif text-2xl">Product quantity discounts</h2>
        <Button className="rounded-none" size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> Add
        </Button>
      </div>
      <ResourceTable
        query={list}
        emptyTitle="No product discounts"
        columns={[
          { header: "Product", cell: (d) => <span className="font-medium">{d.product?.name}</span> },
          { header: "Min quantity", cell: (d) => `${d.minQuantity}+` },
          { header: "Discount", cell: (d) => `${Number(d.discountPercentage)}%` },
          { header: "Status", cell: (d) => <StatusPill active={d.isActive} /> },
        ]}
        onEdit={(d) => { setEditing(d); setOpen(true); }}
        onDelete={(d) => remove.mutate(d.id)}
        deleteLabel={(d) => `${d.product?.name} discount`}
        deleting={remove.isPending}
      />
      <ResourceFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit product discount" : "New product discount"}
        schema={productSchema}
        isEdit={!!editing}
        pending={save.isPending}
        defaultValues={
          editing
            ? { productId: editing.productId, minQuantity: editing.minQuantity, discountPercentage: Number(editing.discountPercentage), isActive: editing.isActive }
            : { productId: "", isActive: true }
        }
        fields={[
          { name: "productId", label: "Product", type: "select", options: products.data?.map((p) => ({ value: p.id, label: p.name })) },
          { name: "minQuantity", label: "Minimum quantity", type: "number", step: "1" },
          { name: "discountPercentage", label: "Discount %", type: "number", step: "0.01" },
          { name: "isActive", label: "Active", type: "checkbox" },
        ]}
        onSubmit={(v) => save.mutate({ id: editing?.id, data: v }, { onSuccess: () => setOpen(false) })}
      />
    </section>
  );
}

function PlatformDiscounts() {
  const { list, save, remove } = useResource<PlatformDiscount>("/discounts/platform", "Platform discount");
  const [editing, setEditing] = useState<PlatformDiscount | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="font-serif text-2xl">Platform order discounts</h2>
        <Button className="rounded-none" size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> Add
        </Button>
      </div>
      <ResourceTable
        query={list}
        emptyTitle="No platform discounts"
        columns={[
          { header: "Min order amount", cell: (d) => formatMoney(d.minOrderAmount) },
          { header: "Discount", cell: (d) => `${Number(d.discountPercentage)}%` },
          { header: "Status", cell: (d) => <StatusPill active={d.isActive} /> },
        ]}
        onEdit={(d) => { setEditing(d); setOpen(true); }}
        onDelete={(d) => remove.mutate(d.id)}
        deleteLabel={(d) => `${Number(d.discountPercentage)}% platform discount`}
        deleting={remove.isPending}
      />
      <ResourceFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit platform discount" : "New platform discount"}
        schema={platformSchema}
        isEdit={!!editing}
        pending={save.isPending}
        defaultValues={
          editing
            ? { minOrderAmount: Number(editing.minOrderAmount), discountPercentage: Number(editing.discountPercentage), isActive: editing.isActive }
            : { isActive: true }
        }
        fields={[
          { name: "minOrderAmount", label: "Minimum order amount (₹)", type: "number", step: "0.01" },
          { name: "discountPercentage", label: "Discount %", type: "number", step: "0.01" },
          { name: "isActive", label: "Active", type: "checkbox" },
        ]}
        onSubmit={(v) => save.mutate({ id: editing?.id, data: v }, { onSuccess: () => setOpen(false) })}
      />
    </section>
  );
}
