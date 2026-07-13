"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { PrimaryButton } from "@/components/ui/Buttons";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email address";
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: "idle" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (token) {
      const verifyToken = async () => {
        setIsVerifying(true);
        try {
          const res = await authService.verifyEmail(token);
          if (res.success) {
            setVerificationResult({
              status: "success",
              message: "Your email has been verified. You can now access your workspace.",
            });
            toast.success("Email verified!");
          } else {
            setVerificationResult({
              status: "error",
              message: res.error || "The verification link is invalid or has expired.",
            });
            toast.error("Verification failed");
          }
        } catch (err) {
          setVerificationResult({
            status: "error",
            message: "An unexpected error occurred during email verification.",
          });
        } finally {
          setIsVerifying(false);
        }
      };
      verifyToken();
    }
  }, [token]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      const res = await authService.resendVerification(email);
      if (res.success) {
        toast.success("Verification dispatched!");
        setResendCooldown(60);
      } else {
        toast.error("Failed to resend");
      }
    } catch (err) {
      toast.error("Resend error");
    } finally {
      setIsResending(false);
    }
  };

  if (token) {
    return (
      <AuthCard>
        {isVerifying ? (
          <div className="text-center py-8 space-y-4">
            <div className="h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-display font-medium">Verifying your email...</h2>
            <p className="text-xs font-mono uppercase tracking-wider text-text-secondary">Please wait while we validate credentials.</p>
          </div>
        ) : verificationResult.status === "success" ? (
          <div className="text-center py-6 space-y-6">
            <div className="h-10 w-10 bg-accent-success/15 border border-accent-success/30 rounded-full flex items-center justify-center mx-auto text-accent-success font-semibold">
              ✓
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-medium tracking-tight text-text-primary">
                Email Verified
              </h2>
              <p className="text-xs font-mono uppercase tracking-wider text-text-secondary max-w-xs mx-auto">
                {verificationResult.message}
              </p>
            </div>
            <Link href="/login" className="block w-full">
              <PrimaryButton>Continue to Workspace</PrimaryButton>
            </Link>
          </div>
        ) : (
          <div className="text-center py-6 space-y-6">
            <div className="h-10 w-10 bg-accent-error/15 border border-accent-error/30 rounded-full flex items-center justify-center mx-auto text-accent-error font-mono">
              !
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-medium tracking-tight text-text-primary">
                Verification Failed
              </h2>
              <p className="text-xs font-mono uppercase tracking-wider text-text-secondary max-w-xs mx-auto text-accent-error">
                {verificationResult.message}
              </p>
            </div>
            <Link href="/signup" className="block w-full">
              <PrimaryButton>Return to Sign Up</PrimaryButton>
            </Link>
          </div>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center py-6 space-y-6">
        <div className="h-10 w-10 bg-accent-primary/10 border border-accent-primary/20 rounded-full flex items-center justify-center mx-auto text-accent-primary font-semibold text-lg">
          ✉
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-display font-light tracking-tight text-text-primary">
            Check your inbox
          </h2>
          <p className="text-xs font-mono uppercase tracking-wider text-text-secondary max-w-xs mx-auto">
            Sent verification link to <br />
            <span className="font-semibold text-text-primary">{email}</span>.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-text-secondary/65">
            Click the link in the email to activate your account.
          </p>
          <div className="p-3 bg-bg-base/40 border border-border-subtle rounded text-left">
            <p className="text-[9px] font-mono uppercase tracking-wider text-text-secondary/80 mb-1">
              // Sandbox Mode link:
            </p>
            <p className="text-[11px] font-mono text-text-secondary/90 leading-relaxed">
              Visit: <br />
              <Link
                href={`/verify-email?token=${encodeURIComponent(email)}`}
                className="font-medium text-accent-primary hover:underline break-all"
              >
                /verify-email?token={email}
              </Link>
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            No email?{" "}
            <button
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="font-bold text-accent-primary hover:underline disabled:opacity-50 cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Link"}
            </button>
          </div>
          
          <Link href="/login" className="inline-block text-[10px] font-mono uppercase tracking-widest text-text-secondary/60 hover:text-text-primary transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <AuthCard>
          <div className="flex justify-center items-center h-48">
            <div className="h-4 w-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </AuthCard>
      }>
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}
