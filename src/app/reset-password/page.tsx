"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/auth-field";
import { apiClient, getErrorMessage } from "@/lib/api-client";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    otp: z.string().length(6, "Enter the 6-digit code"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get("email") ?? "" },
  });

  const mutation = useMutation({
    mutationFn: async ({ email, otp, newPassword }: Values) =>
      (await apiClient.post<{ message: string }>("/auth/reset-password", { email, otp, newPassword })).data,
    onSuccess: () => {
      toast.success("Password reset. Sign in with your new password.");
      router.push("/login");
    },
  });

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm rounded-none border-border/60 shadow-none">
        <CardHeader className="items-center gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Check your email</p>
          <h1 className="font-serif text-3xl italic text-foreground">Enter reset code</h1>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <Field
              id="otp"
              label="6-digit code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              error={errors.otp?.message}
              {...register("otp")}
            />
            <Field
              id="newPassword"
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <Field
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Button type="submit" disabled={mutation.isPending} className="mt-2 h-11 w-full rounded-none">
              {mutation.isPending ? "Resetting..." : "Reset password"}
            </Button>
            {mutation.isError && <p className="text-center text-xs text-destructive">{getErrorMessage(mutation.error)}</p>}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="text-foreground underline underline-offset-4">
              Resend code
            </Link>
            {" · "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
