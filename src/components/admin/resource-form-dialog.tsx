"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FieldConfig {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox";
  step?: string;
  options?: Array<{ value: string; label: string }>;
  disabledOnEdit?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  schema: z.ZodType<FieldValues, FieldValues>;
  fields: FieldConfig[];
  defaultValues: FieldValues;
  isEdit: boolean;
  pending: boolean;
  onSubmit: (values: FieldValues) => void;
}

export function ResourceFormDialog({ open, onOpenChange, title, schema, fields, defaultValues, isEdit, pending, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldValues>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    if (open) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">{title}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {fields.map((f) => {
            const error = errors[f.name]?.message as string | undefined;
            const disabled = isEdit && f.disabledOnEdit;
            if (f.type === "checkbox") {
              return (
                <label key={f.name} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" {...register(f.name)} />
                  {f.label}
                </label>
              );
            }
            return (
              <div key={f.name} className="flex flex-col gap-1.5">
                <Label htmlFor={f.name} className="text-xs uppercase tracking-wide">
                  {f.label}
                </Label>
                {f.type === "select" ? (
                  <select
                    id={f.name}
                    disabled={disabled}
                    aria-invalid={!!error}
                    className="h-9 border border-input bg-transparent px-2 text-sm disabled:opacity-50"
                    {...register(f.name)}
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type ?? "text"}
                    step={f.step}
                    disabled={disabled}
                    aria-invalid={!!error}
                    className="rounded-none"
                    {...register(f.name, { valueAsNumber: f.type === "number" })}
                  />
                )}
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            );
          })}
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-none" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
