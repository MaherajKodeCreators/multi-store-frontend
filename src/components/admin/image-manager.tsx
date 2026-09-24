"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { imageUrl } from "@/lib/types";

export function ImageManager({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((f) => form.append("images", f));
      return (await apiClient.post<{ urls: string[] }>("/uploads/images", form)).data.urls;
    },
    onSuccess: (urls) => onChange([...value, ...urls].slice(0, 8)),
    onError: (error) => toast.error(getErrorMessage(error, "Upload failed")),
  });

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) return toast.error("Enter a full http(s) image URL");
    onChange([...value, trimmed].slice(0, 8));
    setUrlInput("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide">Images</span>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((src, i) => (
            <li key={src + i} className="relative size-16 shrink-0 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-managed thumbnail preview */}
              <img src={imageUrl(src)} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length < 8 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-none"
            disabled={upload.isPending}
            onClick={() => fileRef.current?.click()}
          >
            <Plus /> {upload.isPending ? "Uploading..." : "Upload image"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={(e) => {
              // e.target.files is a live FileList — snapshot it before the async mutation runs,
              // since clearing input.value right after also empties the live list.
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length) upload.mutate(files);
            }}
          />
          <div className="flex gap-2">
            <Input
              placeholder="or paste an image URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              className="rounded-none"
            />
            <Button type="button" variant="outline" size="sm" className="rounded-none" onClick={addUrl}>
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
