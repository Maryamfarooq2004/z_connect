"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { forgotPasswordSchema, ForgotPasswordFields } from "@/schemas/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { PrimaryButton } from "@/components/ui/Buttons";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(data.email);
      if (response.success) {
        toast.success("Verification dispatched!", {
          description: `Dispatched an OTP code to ${data.email}.`,
        });
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      } else {
        toast.error("Process failed", {
          description: response.error || "Could not request password recovery.",
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        {/* Asymmetrical Typography Header */}
        <div className="space-y-1 mb-8">
          <h2 className="text-3xl font-display font-light tracking-tight text-text-primary">
            Request OTP
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-secondary/70">
            Forgot Password // ZConnect.Directory
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="e.g. hello@zconnect.design"
              error={errors.email?.message}
              disabled={isLoading}
              {...register("email")}
            />
          </div>

          <PrimaryButton type="submit" isLoading={isLoading} className="mt-4">
            Send Recovery Code
          </PrimaryButton>
        </form>

        <p className="mt-8 text-center text-xs font-mono uppercase tracking-widest text-text-secondary">
          Remember credentials?{" "}
          <Link
            href="/login"
            className="font-bold text-accent-primary hover:underline"
          >
            Sign In
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
