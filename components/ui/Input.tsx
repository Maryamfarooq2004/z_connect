import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded bg-bg-surface border border-border-subtle px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/35 focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-accent-error focus:border-accent-error focus:ring-accent-error",
            className
          )}
          ref={ref}
          suppressHydrationWarning
          {...props}
          id={props.id || props.name}
        />
        {error && (
          <p className="text-[11px] text-accent-error font-mono uppercase tracking-wider pl-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
