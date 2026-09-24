"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { LoadingState } from "@/components/states";

export function RequireAuth({ role, children }: { role?: "ADMIN" | "CUSTOMER"; children: React.ReactNode }) {
  const { user, ready, signingOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && (!role || user.role === role);

  useEffect(() => {
    // A deliberate logout navigates on its own; redirecting here too would race it.
    if (!ready || signingOut) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (role && user.role !== role) router.replace(user.role === "ADMIN" ? "/admin/orders" : "/products");
  }, [ready, signingOut, user, role, router, pathname]);

  if (!ready || !allowed) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <LoadingState rows={3} />
      </div>
    );
  }
  return <>{children}</>;
}
