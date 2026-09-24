import { RequireAuth } from "@/components/require-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="ADMIN">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">{children}</div>
    </RequireAuth>
  );
}
