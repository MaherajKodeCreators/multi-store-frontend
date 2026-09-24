import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"input"> & { label: string; error?: string; variant?: "underline" | "box" };

export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { label, error, id, className, variant = "underline", ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wide">
        {label}
      </Label>
      <Input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          variant === "underline"
            ? "rounded-none border-0 border-b border-input px-0 shadow-none focus-visible:border-foreground focus-visible:ring-0"
            : "rounded-none",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});
