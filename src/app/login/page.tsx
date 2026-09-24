"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/auth-field";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { AuthResponse } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: async (values: LoginValues) => (await apiClient.post<AuthResponse>("/auth/login", values)).data,
    onSuccess: (data) => {
      signIn(data);
      toast.success(`Welcome back, ${data.user.name}`);
      const next = new URLSearchParams(window.location.search).get("next");
      const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
      const home = data.user.role === "ADMIN" ? "/admin/orders" : "/products";
      const nextMatchesRole = safeNext && safeNext.startsWith("/admin") === (data.user.role === "ADMIN");
      router.push(nextMatchesRole ? safeNext : home);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Login failed")),
  });

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm rounded-none border-border/60 shadow-none">
        <CardHeader className="items-center gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Welcome back</p>
          <h1 className="font-serif text-3xl italic text-foreground">Sign in</h1>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="-mt-1 text-right">
              <Link href="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" disabled={mutation.isPending} className="h-11 w-full rounded-none">
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
