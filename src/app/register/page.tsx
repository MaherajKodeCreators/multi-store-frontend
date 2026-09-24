"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/auth-field";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { AuthResponse } from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const mutation = useMutation({
    mutationFn: async ({ name, email, password }: RegisterValues) =>
      (await apiClient.post<AuthResponse>("/auth/register", { name, email, password, ...location })).data,
    onSuccess: (data) => {
      signIn(data);
      toast.success("Account created");
      router.push("/products");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Registration failed")),
  });

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error("Location is not supported by this browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        toast.error("Could not get your location");
        setLocating(false);
      },
    );
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm rounded-none border-border/60 shadow-none">
        <CardHeader className="items-center gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Join us</p>
          <h1 className="font-serif text-3xl italic text-foreground">Create account</h1>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <Field id="name" label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
            <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <Field
              id="confirmPassword"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <div className="flex items-center justify-between gap-2 border border-dashed border-border px-3 py-2.5 text-xs">
              <span className="text-muted-foreground">
                {location
                  ? `Location set (${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)})`
                  : "Optional: location for nearest-store delivery"}
              </span>
              <button type="button" onClick={detectLocation} disabled={locating} className="flex shrink-0 items-center gap-1 underline underline-offset-4">
                <MapPin className="size-3" />
                {locating ? "Locating..." : location ? "Update" : "Use mine"}
              </button>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="mt-2 h-11 w-full rounded-none">
              {mutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
