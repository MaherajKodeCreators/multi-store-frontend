"use client";

import { useState } from "react";
import { z } from "zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/states";
import { ResourceFormDialog } from "@/components/admin/resource-form-dialog";
import { ResourceTable, StatusPill } from "@/components/admin/resource-table";
import { Store } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

const num = (msg: string) => z.number({ error: msg });

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().trim().min(1, "Address is required"),
  latitude: num("Latitude is required").min(-90).max(90),
  longitude: num("Longitude is required").min(-180).max(180),
  isActive: z.boolean(),
});

export default function AdminStoresPage() {
  const { list, save, remove } = useResource<Store>("/stores", "Store", ["/inventory"]);
  const [editing, setEditing] = useState<Store | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeading
        eyebrow="Admin"
        title="Stores"
        action={
          <Button className="rounded-none" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus /> Add store
          </Button>
        }
      />
      <ResourceTable
        query={list}
        emptyTitle="No stores yet"
        columns={[
          { header: "Name", cell: (s) => <span className="font-medium">{s.name}</span> },
          { header: "Address", cell: (s) => s.address },
          { header: "Coordinates", cell: (s) => `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}`, className: "hidden md:table-cell" },
          { header: "Status", cell: (s) => <StatusPill active={s.isActive} /> },
        ]}
        onEdit={(s) => { setEditing(s); setOpen(true); }}
        onDelete={(s) => remove.mutate(s.id)}
        deleteLabel={(s) => s.name}
        deleting={remove.isPending}
      />
      <ResourceFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit store" : "New store"}
        schema={schema}
        isEdit={!!editing}
        pending={save.isPending}
        defaultValues={editing ?? { name: "", address: "", isActive: true }}
        fields={[
          { name: "name", label: "Name" },
          { name: "address", label: "Address" },
          { name: "latitude", label: "Latitude", type: "number", step: "any" },
          { name: "longitude", label: "Longitude", type: "number", step: "any" },
          { name: "isActive", label: "Active", type: "checkbox" },
        ]}
        onSubmit={(values) => {
          const { name, address, latitude, longitude, isActive } = values;
          save.mutate({ id: editing?.id, data: { name, address, latitude, longitude, isActive } }, { onSuccess: () => setOpen(false) });
        }}
      />
    </>
  );
}
