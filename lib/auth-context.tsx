"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { ApiResponse, UserProfile } from "@/types/auth.types";
import { LoginFields, SignupFields } from "@/schemas/auth.schema";

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (credentials: LoginFields) => Promise<ApiResponse>;
  signup: (data: Omit<SignupFields, "confirmPassword" | "terms">) => Promise<ApiResponse>;
  logout: () => Promise<ApiResponse>;
  socialLogin: (provider: "google" | "apple", token: string) => Promise<ApiResponse>;
  refreshSession: () => Promise<string | null>;
  updateProfile: (fullName: string, username: string) => Promise<ApiResponse>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<ApiResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load initial tokens from localStorage (Client only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("zconnect_access_token");
      const storedUser = localStorage.getItem("zconnect_user");
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing stored user data");
        }
      }
      setIsLoading(false);
    }
  }, []);

  // Listen to expired session events from axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("zconnect_access_token");
        localStorage.removeItem("zconnect_refresh_token");
        localStorage.removeItem("zconnect_user");
      }
      router.push("/login");
    };

    window.addEventListener("auth_session_expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth_session_expired", handleSessionExpired);
    };
  }, [router]);

  // Refresh Session Action
  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    
    const refreshToken = localStorage.getItem("zconnect_refresh_token");
    if (!refreshToken) return null;

    try {
      const res = await authService.refresh(refreshToken);
      if (res.success && res.data) {
        const { accessToken: newAccess, refreshToken: newRefresh, user: profile } = res.data;
        setAccessToken(newAccess);
        setUser(profile);
        localStorage.setItem("zconnect_access_token", newAccess);
        localStorage.setItem("zconnect_refresh_token", newRefresh);
        localStorage.setItem("zconnect_user", JSON.stringify(profile));
        return newAccess;
      }
    } catch (err) {
      console.error("Failed to refresh session", err);
    }

    // Clear on failure
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("zconnect_access_token");
    localStorage.removeItem("zconnect_refresh_token");
    localStorage.removeItem("zconnect_user");
    return null;
  }, []);

  // Login Action
  const login = async (credentials: LoginFields) => {
    try {
      const res = await authService.login(credentials);
      if (res.success && res.data) {
        const { accessToken: token, refreshToken: refresh, user: profile } = res.data;
        setAccessToken(token);
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("zconnect_access_token", token);
          localStorage.setItem("zconnect_refresh_token", refresh);
          localStorage.setItem("zconnect_user", JSON.stringify(profile));
        }
      }
      return res;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  // Signup Action
  const signup = async (data: Omit<SignupFields, "confirmPassword" | "terms">) => {
    try {
      const res = await authService.signup(data);
      if (res.success && res.data && !res.data.verificationRequired) {
        const { accessToken: token, refreshToken: refresh, user: profile } = res.data;
        setAccessToken(token);
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("zconnect_access_token", token);
          localStorage.setItem("zconnect_refresh_token", refresh);
          localStorage.setItem("zconnect_user", JSON.stringify(profile));
        }
      }
      return res;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || "Signup failed",
      };
    }
  };

  // Logout Action
  const logout = async () => {
    try {
      const res = await authService.logout();
      return res;
    } catch (error) {
      console.error("Logout API call error, forcing local logout", error);
    } finally {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("zconnect_access_token");
        localStorage.removeItem("zconnect_refresh_token");
        localStorage.removeItem("zconnect_user");
      }
      router.push("/login");
    }
    return { success: true };
  };

  // Social Login Action
  const socialLogin = async (provider: "google" | "apple", token: string) => {
    try {
      const serviceCall = provider === "google" ? authService.loginWithGoogle : authService.loginWithApple;
      const res = await serviceCall(token);
      if (res.success && res.data) {
        const { accessToken: access, refreshToken: refresh, user: profile } = res.data;
        setAccessToken(access);
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("zconnect_access_token", access);
          localStorage.setItem("zconnect_refresh_token", refresh);
          localStorage.setItem("zconnect_user", JSON.stringify(profile));
        }
      }
      return res;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Social login failed",
      };
    }
  };

  // Update Profile Action
  const updateProfile = async (fullName: string, username: string) => {
    try {
      const res = await authService.updateProfile(fullName, username);
      if (res.success && res.data) {
        setUser(res.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("zconnect_user", JSON.stringify(res.data));
        }
      }
      return res;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to update profile",
      };
    }
  };

  // Change Password Action
  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      const res = await authService.changePassword(oldPassword, newPassword);
      return res;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to change password",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        signup,
        logout,
        socialLogin,
        refreshSession,
        updateProfile,
        changePassword,
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
