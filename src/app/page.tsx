"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 bg-secondary/60 px-6 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">New season · Many stores, one order</p>
      <h1 className="font-serif text-5xl leading-tight sm:text-7xl">
        The New <span className="italic">Essentials</span>
      </h1>
      <p className="max-w-md text-muted-foreground">
        Browse pieces stocked across our stores, unlock quantity discounts, and receive each order from the nearest store
        that has it.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild className="h-11 rounded-none px-8 uppercase tracking-[0.15em]">
          <Link href={isAdmin ? "/admin/orders" : "/products"}>{isAdmin ? "Open dashboard" : "Shop the collection"}</Link>
        </Button>
        {!user && (
          <Button asChild variant="outline" className="h-11 rounded-none px-8 uppercase tracking-[0.15em]">
            <Link href="/register">Create account</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
