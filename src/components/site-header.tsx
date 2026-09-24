"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";

const customerLinks = [
  { href: "/products", label: "Shop" },
  { href: "/orders", label: "My Orders" },
];

const adminLinks = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/discounts", label: "Discounts" },
];

export function SiteHeader() {
  const { user, ready, signOut } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const links = user?.role === "ADMIN" ? adminLinks : customerLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="bg-primary py-1.5 text-center text-[10px] uppercase tracking-[0.3em] text-primary-foreground">
        Nearest-store fulfilment · Quantity discounts on every order
      </div>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="font-serif text-2xl tracking-wide">
          Maison <span className="italic text-muted-foreground">Store</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(l.href) && "text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user?.role !== "ADMIN" && (
            <Link href="/cart" className="relative" aria-label={`Cart, ${count} items`}>
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          )}
          {ready &&
            (user ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-muted-foreground sm:inline">{user.name}</span>
                <button
                  onClick={() => {
                    signOut();
                    router.push("/login");
                  }}
                  className="text-xs uppercase tracking-[0.2em] underline-offset-4 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-xs uppercase tracking-[0.2em] underline-offset-4 hover:underline">
                Sign in
              </Link>
            ))}
        </div>
      </div>

      <nav className="flex gap-5 overflow-x-auto border-t border-border px-6 py-2 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "shrink-0 text-[11px] uppercase tracking-[0.2em] text-muted-foreground",
              pathname.startsWith(l.href) && "text-foreground",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
