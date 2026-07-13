import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="w-full space-y-1">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={cn(
              "flex h-12 w-full rounded bg-bg-surface border border-border-subtle pl-4 pr-11 py-3 text-sm text-text-primary placeholder:text-text-secondary/35 focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-accent-error focus:border-accent-error focus:ring-accent-error",
              className
            )}
            ref={ref}
            suppressHydrationWarning
            {...props}
            id={props.id || props.name}
          />
          <button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary/40 hover:text-text-primary transition-colors focus:outline-none"
            onClick={() => setShowPassword((prev) => !prev)}
            suppressHydrationWarning
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-[11px] text-accent-error font-mono uppercase tracking-wider pl-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {error}
          </p>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
