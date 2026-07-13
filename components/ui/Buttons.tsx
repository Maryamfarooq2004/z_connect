import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export function PrimaryButton({ className, children, isLoading, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "btn-editorial flex h-12 w-full items-center justify-center rounded text-sm font-medium tracking-wide shadow-sm disabled:cursor-not-allowed disabled:opacity-50 select-none cursor-pointer",
        className
      )}
      disabled={isLoading || props.disabled}
      suppressHydrationWarning
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-wider">Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function LoadingButton({ className, children, ...props }: ButtonProps) {
  return (
    <PrimaryButton className={className} isLoading={true} {...props}>
      {children}
    </PrimaryButton>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border-subtle" />
      </div>
      {label && (
        <span className="relative bg-bg-surface px-4 text-[10px] font-mono uppercase tracking-widest text-text-secondary/50">
          {label}
        </span>
      )}
    </div>
  );
}
