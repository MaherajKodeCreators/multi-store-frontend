"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { UseQueryResult } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { getErrorMessage } from "@/lib/api-client";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T extends { id: string }> {
  query: UseQueryResult<T[]>;
  columns: Column<T>[];
  emptyTitle: string;
  onEdit: (row: T) => void;
  onDelete?: (row: T) => void;
  deleteLabel?: (row: T) => string;
  deleting?: boolean;
}

export function ResourceTable<T extends { id: string }>({ query, columns, emptyTitle, onEdit, onDelete, deleteLabel, deleting }: Props<T>) {
  const [confirm, setConfirm] = useState<T | null>(null);

  if (query.isPending) return <LoadingState />;
  if (query.isError) return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  if (query.data.length === 0) return <EmptyState title={emptyTitle} description="Use the button above to add one." />;

  return (
    <>
      <div className="overflow-x-auto border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.header} className={`text-[11px] uppercase tracking-wider ${c.className ?? ""}`}>
                  {c.header}
                </TableHead>
              ))}
              <TableHead className="w-24 text-right text-[11px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((c) => (
                  <TableCell key={c.header} className={c.className}>
                    {c.cell(row)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row)} aria-label="Edit">
                    <Pencil />
                  </Button>
                  {onDelete && (
                    <Button variant="ghost" size="icon-sm" onClick={() => setConfirm(row)} aria-label="Delete">
                      <Trash2 />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="rounded-none sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">Delete {confirm && deleteLabel?.(confirm)}?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-none" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-none"
              disabled={deleting}
              onClick={() => {
                if (confirm) onDelete?.(confirm);
                setConfirm(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={`px-2 py-0.5 text-[11px] uppercase tracking-wider ${active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}
