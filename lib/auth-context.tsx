"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk, useSignIn, useSignUp } from "@clerk/nextjs";

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
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
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

  const isReady = isUserLoaded && !!signIn && !!signUp;

  // Login Action
  const login = async (credentials: any) => {
    if (!signIn) return { success: false, error: "Auth client not ready" };
    
    // Automatically terminate previous session if one exists on the device
    if (clerk.session) {
      try {
        await clerk.signOut();
      } catch (e) {
        console.error("Error signing out previous session:", e);
      }
    }

    try {
      const { error } = await (signIn as any).create({
        identifier: credentials.username || credentials.email,
        password: credentials.password,
      });

      if (error) {
        const isExists = error.code === "session_exists" || error.message?.includes("session_exists");
        if (isExists) {
          try {
            await clerk.signOut();
            const retry = await (signIn as any).create({
              identifier: credentials.username || credentials.email,
              password: credentials.password,
            });
            if (retry.error) {
              return { success: false, error: retry.error.longMessage || retry.error.message || "Login failed" };
            }
            if ((signIn as any).status === "complete") {
              await clerk.setActive({ session: (signIn as any).createdSessionId });
              return { success: true };
            }
          } catch (retryErr: any) {
            return { success: false, error: retryErr.message || "Login failed" };
          }
        }
        return { success: false, error: error.longMessage || error.message || "Login failed" };
      }

      if ((signIn as any).status === "complete") {
        await clerk.setActive({ session: (signIn as any).createdSessionId });
        return { success: true };
      }
      return { success: false, error: "Please complete authentication." };
    } catch (err: any) {
      const isExists = err?.errors?.some((e: any) => e.code === "session_exists") || err?.code === "session_exists" || err?.message?.includes("session_exists");
      if (isExists) {
        try {
          await clerk.signOut();
          const retry = await (signIn as any).create({
            identifier: credentials.username || credentials.email,
            password: credentials.password,
          });
          if ((signIn as any).status === "complete") {
            await clerk.setActive({ session: (signIn as any).createdSessionId });
            return { success: true };
          }
        } catch (retryErr: any) {
          return { success: false, error: retryErr.errors?.[0]?.message || retryErr.message || "Login failed" };
        }
      }
      return { success: false, error: err.errors?.[0]?.message || err.message || "Login failed" };
    }
  };

  // Signup Action
  const signup = async (data: any) => {
    if (!signUp) return { success: false, error: "Auth client not ready" };
    try {
      const { error } = await (signUp as any).create({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        emailAddress: data.email,
        password: data.password,
      });

      if (error) {
        return { success: false, error: error.longMessage || error.message || "Signup failed" };
      }

      // Prepare email code verification
      const { error: prepError } = await (signUp as any).prepareEmailAddressVerification({ strategy: "email_code" });
      if (prepError) {
        return { success: false, error: prepError.longMessage || prepError.message || "Failed to send verification code" };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || err.message || "Signup failed" };
    }
  };

  // Verify OTP for Signup
  const verifyOtp = async (otp: string) => {
    if (!signUp) return { success: false, error: "Auth client not ready" };
    try {
      const { error } = await (signUp as any).attemptEmailAddressVerification({
        code: otp,
      });

      if (error) {
        return { success: false, error: error.longMessage || error.message || "Invalid code" };
      }

      if ((signUp as any).status === "complete") {
        await clerk.setActive({ session: (signUp as any).createdSessionId });
        return { success: true };
      }
      return { success: false, error: "Verification incomplete" };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || err.message || "Invalid code" };
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (!signUp) return { success: false, error: "Auth client not ready" };
    try {
      const { error } = await (signUp as any).prepareEmailAddressVerification({ strategy: "email_code" });
      if (error) {
        return { success: false, error: error.longMessage || error.message || "Resend failed" };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || err.message || "Resend failed" };
    }
  };

  // Social Login / Signup using Clerk v7 .sso() method
  const socialLogin = async (provider: "google" | "apple", flow: "signIn" | "signUp" = "signIn") => {
    try {
      const strategy = provider === "google" ? "oauth_google" : "oauth_apple";

      const handleSessionExists = (err: any) => {
        const isExists = err?.errors?.some((e: any) => e.code === "session_exists") || err?.code === "session_exists";
        if (isExists) {
          router.push("/dashboard");
          return true;
        }
        return false;
      };

      if (flow === "signUp") {
        if (!signUp) return { success: false, error: "Auth client not ready" };
        const { error } = await (signUp as any).sso({
          strategy,
          redirectCallbackUrl: "/sso-callback",
          redirectUrl: "/dashboard",
        });
        if (error) {
          if (handleSessionExists(error)) {
            return { success: true };
          }
          console.error("Social signup error:", JSON.stringify(error, null, 2));
          return { success: false, error: error.longMessage || error.message || "Social signup failed" };
        }
      } else {
        if (!signIn) return { success: false, error: "Auth client not ready" };
        const { error } = await (signIn as any).sso({
          strategy,
          redirectCallbackUrl: "/sso-callback",
          redirectUrl: "/dashboard",
        });
        if (error) {
          if (handleSessionExists(error)) {
            return { success: true };
          }
          console.error("Social login error:", JSON.stringify(error, null, 2));
          return { success: false, error: error.longMessage || error.message || "Social login failed" };
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error("Social login exception:", err);
      const isExists = err?.errors?.some((e: any) => e.code === "session_exists") || err?.code === "session_exists";
      if (isExists) {
        router.push("/dashboard");
        return { success: true };
      }
      return { success: false, error: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "Social login failed" };
    }
  };

  // Forgot Password (Request reset OTP)
  const forgotPassword = async (email: string) => {
    if (!signIn) return { success: false, error: "Auth client not ready" };
    try {
      const { error } = await (signIn as any).create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      if (error) {
        return { success: false, error: error.longMessage || error.message || "Request failed" };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || err.message || "Request failed" };
    }
  };

  // Verify Reset OTP
  const verifyResetOtp = async (email: string, otp: string) => {
    if (!signIn) return { success: false, error: "Auth client not ready" };
    try {
      const { error } = await (signIn as any).attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: otp,
      });
      if (error) {
        return { success: false, error: error.longMessage || error.message || "Invalid OTP code" };
      }
      if ((signIn as any).status === "needs_new_password") {
        return { success: true, data: { token: otp } };
      }
      return { success: false, error: "Verification incomplete" };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || err.message || "Invalid OTP code" };
    }
  };

  // Reset Password
  const resetPassword = async (password: string, _token: string) => {
    if (!signIn) return { success: false, error: "Auth client not ready" };
    try {
      const { error } = await (signIn as any).resetPassword({
        password: password,
      });
      if (error) {
        return { success: false, error: error.longMessage || error.message || "Failed to reset password" };
      }
      if ((signIn as any).status === "complete") {
        await clerk.setActive({ session: (signIn as any).createdSessionId });
        return { success: true };
      }
      return { success: false, error: "Password reset incomplete" };
    } catch (err: any) {
      return { success: false, error: err.errors?.[0]?.message || err.message || "Failed to reset password" };
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
