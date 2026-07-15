"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

interface AuthContextType {
  user: any;
  isLoading: boolean;
  login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  signup: (data: any) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (fullName: string, username: string) => Promise<any>;
  socialLogin: (provider: "google" | "apple", flow?: "signIn" | "signUp") => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ success: boolean; data?: { token: string }; error?: string }>;
  resetPassword: (password: string, token: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  // Sync user state
  useEffect(() => {
    if (isUserLoaded) {
      if (clerkUser) {
        setUser({
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          username: clerkUser.username || "",
          fullName: clerkUser.fullName || "",
          avatarUrl: clerkUser.imageUrl || "",
          createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : "",
        });
      } else {
        setUser(null);
      }
    }
  }, [clerkUser, isUserLoaded]);

  const isReady = isUserLoaded && !!clerk && !!clerk.client;

  // Login Action
  const login = async (credentials: any) => {
    if (!isReady) return { success: false, error: "Auth client not ready" };
    try {
      const result = await clerk.client.signIn.create({
        identifier: credentials.username || credentials.email,
        password: credentials.password,
      });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        return { success: true };
      }
      return { success: false, error: "Please complete authentication." };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || "Login failed" };
    }
  };

  // Signup Action
  const signup = async (data: any) => {
    if (!isReady) return { success: false, error: "Auth client not ready" };
    try {
      await clerk.client.signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        emailAddress: data.email,
        password: data.password,
      });

      // Prepare email code verification
      await clerk.client.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || "Signup failed" };
    }
  };

  // Verify OTP for Signup
  const verifyOtp = async (otp: string) => {
    if (!isReady) return { success: false, error: "Auth client not ready" };
    try {
      const completeSignUp = await clerk.client.signUp.attemptEmailAddressVerification({
        code: otp,
      });

      if (completeSignUp.status === "complete") {
        await clerk.setActive({ session: completeSignUp.createdSessionId });
        return { success: true };
      }
      return { success: false, error: "Verification incomplete" };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || "Invalid code" };
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (!isReady) return { success: false, error: "Auth client not ready" };
    try {
      await clerk.client.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || "Resend failed" };
    }
  };

  // Social Login / Signup
  const socialLogin = async (provider: "google" | "apple", flow: "signIn" | "signUp" = "signIn") => {
    if (!isReady) return { success: false, error: "Auth client not ready" };
    try {
      const target = flow === "signUp" ? clerk.client.signUp : clerk.client.signIn;
      await target.authenticateWithRedirect({
        strategy: provider === "google" ? "oauth_google" : "oauth_apple",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Social login failed" };
    }
  };

  // Forgot Password (Request reset OTP)
  const forgotPassword = async (email: string) => {
    if (!isReady) return { success: false, error: "Auth client not ready" };
    try {
      await clerk.client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || "Request failed" };
    }
  };

  // Verify Reset OTP
  const verifyResetOtp = async (email: string, otp: string) => {
    if (!isReady) return { success: false, error: "Auth client not ready" };
    try {
      const result = await clerk.client.signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: otp,
      });
      if (result.status === "needs_new_password") {
        return { success: true, data: { token: otp } };
      }
      return { success: false, error: "Verification incomplete" };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || "Invalid OTP code" };
    }
  };

  // Reset Password
  const resetPassword = async (password: string, token: string) => {
    if (!isReady) return { success: false, error: "Auth client not ready" };
    try {
      const result = await clerk.client.signIn.resetPassword({
        password: password,
      });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        return { success: true };
      }
      return { success: false, error: "Password reset incomplete" };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || "Failed to reset password" };
    }
  };

  // Logout
  const logout = async () => {
    await clerk.signOut();
    router.push("/login");
  };

  // Update Profile
  const updateProfile = async (fullName: string, username: string) => {
    if (!clerkUser) return;
    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      const updatedUser = await clerkUser.update({
        firstName,
        lastName,
        username,
      });
      return { success: true, data: updatedUser };
    } catch (err: any) {
      return { success: false, error: err.message || "Update failed" };
    }
  };

  const isLoading = !isReady;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        socialLogin,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
