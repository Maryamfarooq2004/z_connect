"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function SSOCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);

  const navigateToLogin = () => {
    router.push("/login");
  };

  const finalizeSignIn = async () => {
    await (signIn as any).finalize({
      navigate: async ({ session, decorateUrl }: any) => {
        if (session?.currentTask) {
          console.log(session?.currentTask);
          return;
        }
        const url = decorateUrl("/dashboard");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  };

  const finalizeSignUp = async () => {
    await (signUp as any).finalize({
      navigate: async ({ session, decorateUrl }: any) => {
        if (session?.currentTask) {
          console.log(session?.currentTask);
          return;
        }
        const url = decorateUrl("/dashboard");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  };

  useEffect(() => {
    (async () => {
      if (!clerk.loaded || hasRun.current) {
        return;
      }
      hasRun.current = true;

      try {
        // If this was a sign-in, and it's complete, finalize it
        if (signIn?.status === "complete") {
          await finalizeSignIn();
          return;
        }

        // If the sign-up used an existing account, transfer it to a sign-in
        if ((signUp as any)?.isTransferable) {
          await (signIn as any).create({ transfer: true });
          if ((signIn as any).status === "complete") {
            await finalizeSignIn();
            return;
          }
          return navigateToLogin();
        }

        // If the sign-in used an external account not associated with an existing user, create a sign-up
        if ((signIn as any)?.isTransferable) {
          await (signUp as any).create({ transfer: true });
          if ((signUp as any).status === "complete") {
            await finalizeSignUp();
            return;
          }
          return router.push("/login");
        }

        // If sign-up is complete, finalize it
        if (signUp?.status === "complete") {
          await finalizeSignUp();
          return;
        }

        // Handle existing sessions
        if ((signIn as any)?.existingSession || (signUp as any)?.existingSession) {
          const sessionId = (signIn as any)?.existingSession?.sessionId || (signUp as any)?.existingSession?.sessionId;
          if (sessionId) {
            await clerk.setActive({
              session: sessionId,
            });
            router.push("/dashboard");
            return;
          }
        }

        // If sign-in requires MFA or new password
        if (signIn?.status === "needs_second_factor" || signIn?.status === "needs_new_password") {
          return navigateToLogin();
        }

        // Fallback: navigate to dashboard or login
        router.push("/dashboard");
      } catch (err) {
        console.error("SSO Callback error:", err);
        router.push("/login");
      }
    })();
  }, [clerk, signIn, signUp]);

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
