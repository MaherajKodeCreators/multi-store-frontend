"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/auth-field";
import { apiClient, getErrorMessage } from "@/lib/api-client";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: async (values: Values) => (await apiClient.post<{ message: string }>("/auth/forgot-password", values)).data,
    onSuccess: () => setSent(true),
  });

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm rounded-none border-border/60 shadow-none">
        <CardHeader className="items-center gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Reset your password</p>
          <h1 className="font-serif text-3xl italic text-foreground">Forgot password</h1>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                If <span className="text-foreground">{getValues("email")}</span> is registered, a 6-digit code has been sent. It
                expires in 10 minutes.
              </p>
              <Button
                className="h-11 w-full rounded-none"
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(getValues("email"))}`)}
              >
                Enter code
              </Button>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
              <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
              <Button type="submit" disabled={mutation.isPending} className="mt-2 h-11 w-full rounded-none">
                {mutation.isPending ? "Sending..." : "Send reset code"}
              </Button>
              {mutation.isError && <p className="text-center text-xs text-destructive">{getErrorMessage(mutation.error)}</p>}
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
