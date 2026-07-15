"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { signupSchema, SignupFields } from "@/schemas/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { PrimaryButton, Divider } from "@/components/ui/Buttons";
import { SocialButton } from "@/components/ui/SocialButton";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setIsLoading(true);
    try {
      const { signIn } = await import("next-auth/react");
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (err) {
      toast.error("Social login encountered an error.");
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: SignupFields) => {
    setIsLoading(true);
    try {
      const { confirmPassword, terms, ...signupData } = data;
      const response = await signup(signupData);

      if (response.success) {
        toast.success("Registration initiated!", {
          description: "A verification dispatch has been sent to your inbox.",
        });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        toast.error("Registration failed", {
          description: response.error || response.message || "Please verify credentials and try again.",
        });
      }
    } catch (err: any) {
      toast.error("Process error", {
        description: err?.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard className="max-w-[440px]">
        {/* Asymmetrical Typography Header */}
        <div className="space-y-1 mb-8">
          <h2 className="text-3xl font-display font-light tracking-tight text-text-primary">
            Register Account
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-secondary/70">
            System Registration // ZConnect.Directory
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
                First Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Avery"
                error={errors.firstName?.message}
                disabled={isLoading}
                {...register("firstName")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
                Last Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Jenkins"
                error={errors.lastName?.message}
                disabled={isLoading}
                {...register("lastName")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
              Username
            </label>
            <Input
              type="text"
              placeholder="e.g. averyj"
              error={errors.username?.message}
              disabled={isLoading}
              {...register("username")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="e.g. avery@organization.com"
              error={errors.email?.message}
              disabled={isLoading}
              {...register("email")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
              Password
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

          <div className="pt-2 pl-0.5">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                disabled={isLoading}
                className="mt-0.5 h-3.5 w-3.5 rounded border-border-subtle bg-bg-surface text-accent-primary focus:ring-1 focus:ring-accent-primary accent-accent-primary cursor-pointer"
                {...register("terms")}
              />
              <label
                htmlFor="terms"
                className="ml-2.5 text-[10px] leading-normal font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary select-none cursor-pointer"
              >
                Accept{" "}
                <Link href="/terms" className="underline text-accent-primary">
                  Terms
                </Link>{" "}
                &{" "}
                <Link href="/privacy" className="underline text-accent-primary">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-[11px] text-accent-error font-mono uppercase tracking-wider pl-1 mt-1">
                // {errors.terms.message}
              </p>
            )}
          </div>

          <PrimaryButton type="submit" isLoading={isLoading} className="mt-4">
            Initialize Account
          </PrimaryButton>
        </form>

        <Divider label="OAuth Credentials" />

        <div className="grid grid-cols-2 gap-3">
          <SocialButton
            provider="google"
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading}
          />
          <SocialButton
            provider="apple"
            onClick={() => handleSocialLogin("apple")}
            disabled={isLoading}
          />
        </div>

        <p className="mt-8 text-center text-xs font-mono uppercase tracking-widest text-text-secondary">
          Have an account?{" "}
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
