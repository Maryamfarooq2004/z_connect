"use client";

import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  const clerk = useClerk();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    
    if (clerk && typeof clerk.handleRedirectCallback === "function") {
      handled.current = true;
      clerk.handleRedirectCallback({
        signInFallbackRedirectUrl: "/dashboard",
        signUpFallbackRedirectUrl: "/dashboard",
      } as any).catch((err) => {
        console.error("SSO Callback failed:", err);
      });
    }
  }, [clerk]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base">
      <div className="text-center space-y-4">
        <div className="h-6 w-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">
          Completing authentication...
        </p>
      </div>
    </div>
  );
}
