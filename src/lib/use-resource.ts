"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, getErrorMessage } from "@/lib/api-client";

export function useResource<T extends { id: string }>(path: string, label: string, related: string[] = []) {
  const queryClient = useQueryClient();
  const key = ["admin", path];

  const list = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => (await apiClient.get<T[]>(path, { signal })).data,
  });

  const invalidate = async () => {
    // An initial load still in flight started before this write; TanStack would reuse it on invalidate
    // (it only cancels fetches that already have data), so cancel it explicitly to force a fresh fetch.
    await queryClient.cancelQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: key });
    related.forEach((r) => queryClient.invalidateQueries({ queryKey: ["admin", r] }));
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const save = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: unknown }) =>
      id ? (await apiClient.put<T>(`${path}/${id}`, data)).data : (await apiClient.post<T>(path, data)).data,
    onSuccess: (_d, vars) => {
      toast.success(`${label} ${vars.id ? "updated" : "created"}`);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, `Could not save ${label.toLowerCase()}`)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) =>
      (await apiClient.delete<{ deleted: boolean; deactivated?: boolean }>(`${path}/${id}`)).data,
    onSuccess: (res) => {
      toast.success(
        res.deactivated ? `${label} is used by past orders, so it was deactivated instead` : `${label} deleted`,
      );
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error, `Could not delete ${label.toLowerCase()}`)),
  });

  return { list, save, remove };
}
