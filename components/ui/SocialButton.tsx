import * as React from "react";
import { cn } from "@/lib/utils";

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: "google" | "apple";
}

export function SocialButton({ provider, className, ...props }: SocialButtonProps) {
  const isGoogle = provider === "google";

  return (
    <button
      type="button"
      className={cn(
        "flex h-12 w-full items-center justify-center gap-3 rounded border border-border-subtle bg-bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-primary hover:bg-bg-surface-alt active:scale-[0.99] transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer select-none",
        className
      )}
      suppressHydrationWarning
      {...props}
    >
      {isGoogle ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
          />
          <path
            fill="#34A853"
            d="M16.04 15.34c-1.07.712-2.46 1.16-4.04 1.16-3.09 0-5.71-2.09-6.64-4.91L1.31 14.68C3.29 18.66 7.33 21.41 12 21.41c2.905 0 5.618-1 7.647-2.768l-3.608-3.302Z"
          />
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.43 3.56l3.61 3.3c2.12-1.96 3.34-4.83 3.34-8.1z"
          />
          <path
            fill="#FBBC05"
            d="M5.36 11.59a6.97 6.97 0 0 1 0-2.34L1.33 6.14a11.93 11.93 0 0 0 0 9.72l4.03-3.27Z"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.26-.57 2.95-1.39" />
        </svg>
      )}
      <span>{isGoogle ? "Google" : "Apple"}</span>
    </button>
  );
}
