"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { resetPasswordSchema, ResetPasswordFields } from "@/schemas/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { PrimaryButton } from "@/components/ui/Buttons";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: ResetPasswordFields) => {
    if (!token) {
      toast.error("Invalid Request", {
        description: "Missing verification token.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(data.password, token);
      if (response.success) {
        toast.success("Password reset completed!", {
          description: "New password registered successfully.",
        });
        
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        toast.error("Reset failed", {
          description: response.error || "Could not register password reset.",
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      {/* Asymmetrical Typography Header */}
      <div className="space-y-1 mb-8">
        <h2 className="text-3xl font-display font-light tracking-tight text-text-primary">
          New Password
        </h2>
        <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary/70">
          Reset password // ZConnect.Directory
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
            New Password
          </label>
          <PasswordInput
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={isLoading}
            {...register("password")}
          />
          <PasswordStrength value={passwordValue} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
            Confirm Password
          </label>
          <PasswordInput
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            {...register("confirmPassword")}
          />
        </div>

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-4">
          Register New Password
        </PrimaryButton>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <AuthCard>
          <div className="flex justify-center items-center h-48">
            <div className="h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </AuthCard>
      }>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
