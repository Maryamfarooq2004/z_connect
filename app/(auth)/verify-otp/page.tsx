"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { verifyOtpSchema, VerifyOtpFields } from "@/schemas/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { PrimaryButton } from "@/components/ui/Buttons";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpFields>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onSubmit = async (data: VerifyOtpFields) => {
    if (!email) {
      toast.error("Error", {
        description: "Missing email context.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authService.verifyResetOtp(email, data.otp);
      if (response.success && response.data) {
        toast.success("Code validated!", {
          description: "Proceeding to set your new password.",
        });
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(response.data.token)}`
        );
      } else {
        toast.error("Validation failed", {
          description: response.error || "Incorrect OTP. Try mock code '123456'.",
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        toast.success("Verification dispatched!", {
          description: `Dispatched new recovery OTP to ${email}.`,
        });
        setResendCooldown(60);
      } else {
        toast.error("Could not resend recovery OTP.");
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      {/* Asymmetrical Typography Header */}
      <div className="space-y-1 mb-8">
        <h2 className="text-3xl font-display font-light tracking-tight text-text-primary">
          Verify OTP
        </h2>
        <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary/70">
          Validating reset code for {email || "directory entry"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
            OTP CODE
          </label>
          <Input
            type="text"
            placeholder="••••••"
            maxLength={6}
            className="text-center tracking-[0.4em] font-mono text-lg font-semibold"
            error={errors.otp?.message}
            disabled={isLoading}
            {...register("otp")}
          />
        </div>

        <div className="p-3 bg-bg-surface border border-border-subtle rounded">
          <p className="text-[9px] font-mono uppercase tracking-wider text-text-secondary/80 mb-1">
            // Sandbox Mode Code:
          </p>
          <p className="text-[11px] font-mono text-text-secondary/90">
            Use the OTP code <span className="font-bold text-accent-primary">123456</span>
          </p>
        </div>

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-2">
          Verify Recovery Code
        </PrimaryButton>
      </form>

      <div className="mt-8 pt-4 border-t border-border-subtle flex justify-between items-center text-xs font-mono uppercase tracking-wider">
        <button
          onClick={handleResend}
          disabled={isLoading || resendCooldown > 0 || !email}
          className="font-bold text-accent-primary hover:underline disabled:opacity-50"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
        </button>
        <Link href="/login" className="text-text-secondary/60 hover:text-text-primary">
          Sign In
        </Link>
      </div>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <AuthCard>
          <div className="flex justify-center items-center h-48">
            <div className="h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </AuthCard>
      }>
        <VerifyOtpForm />
      </Suspense>
    </AuthLayout>
  );
}
