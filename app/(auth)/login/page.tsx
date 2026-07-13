"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { loginSchema, LoginFields } from "@/schemas/auth.schema";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PrimaryButton, Divider } from "@/components/ui/Buttons";
import { SocialButton } from "@/components/ui/SocialButton";

export default function LoginPage() {
  const { login, socialLogin } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    try {
      const response = await login(data);
      if (response.success) {
        toast.success("Authentication successful", {
          description: "Access authorized for ZConnect.",
        });
        router.push("/dashboard");
      } else {
        toast.error("Authentication failed", {
          description: response.error || "Please verify credentials and try again.",
        });
      }
    } catch (err) {
      toast.error("Process error", {
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setIsLoading(true);
    try {
      const mockToken = `mock_${provider}_token`;
      const response = await socialLogin(provider, mockToken);
      if (response.success) {
        toast.success("Authentication successful", {
          description: `Access authorized via ${provider}.`,
        });
        router.push("/dashboard");
      } else {
        toast.error("OAuth registration failed.");
      }
    } catch (err) {
      toast.error("Social login encountered an error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        {/* Asymmetric Typography Header */}
        <div className="space-y-1 mb-8">
          <h2 className="text-3xl font-display font-light tracking-tight text-text-primary">
            Sign In
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-secondary/70">
            Secure Entry // ZConnect.Directory
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary pl-0.5">
              Username
            </label>
            <Input
              type="text"
              placeholder="e.g. system_admin"
              error={errors.username?.message}
              disabled={isLoading}
              {...register("username")}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between pl-0.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[9px] font-mono uppercase tracking-widest text-accent-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <PasswordInput
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isLoading}
              {...register("password")}
            />
          </div>

          {/* Clean minimal Checkbox */}
          <div className="flex items-center pl-0.5">
            <input
              type="checkbox"
              id="rememberMe"
              disabled={isLoading}
              className="h-3.5 w-3.5 rounded border-border-subtle bg-bg-surface text-accent-primary focus:ring-1 focus:ring-accent-primary accent-accent-primary cursor-pointer"
              {...register("rememberMe")}
            />
            <label
              htmlFor="rememberMe"
              className="ml-2.5 text-xs font-mono uppercase tracking-widest text-text-secondary hover:text-text-primary select-none cursor-pointer"
            >
              Remember access
            </label>
          </div>

          <PrimaryButton type="submit" isLoading={isLoading} className="mt-4">
            Authenticate Access
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
          No directory record?{" "}
          <Link
            href="/signup"
            className="font-bold text-accent-primary hover:underline"
          >
            Register
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
