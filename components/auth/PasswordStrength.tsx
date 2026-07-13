import * as React from "react";

interface PasswordStrengthProps {
  value: string;
}

export function PasswordStrength({ value }: PasswordStrengthProps) {
  const rules = [
    { label: "MINIMUM 8 CHARACTERS", regex: /.{8,}/ },
    { label: "ONE UPPERCASE CHARACTER", regex: /[A-Z]/ },
    { label: "ONE LOWERCASE CHARACTER", regex: /[a-z]/ },
    { label: "ONE NUMERIC CHARACTER", regex: /[0-9]/ },
    { label: "ONE SPECIAL SYMBOL", regex: /[^A-Za-z0-9]/ },
  ];

  const score = rules.reduce((acc, rule) => acc + (rule.regex.test(value) ? 1 : 0), 0);

  // Compute strength indicator styles (Deep Pine Green primary accent)
  let strengthLabel = "WEAK";
  if (score >= 5) strengthLabel = "STRONG";
  else if (score >= 3) strengthLabel = "MEDIUM";

  if (value.length === 0) {
    return null;
  }

  return (
    <div className="mt-3.5 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150 border-t border-border-subtle pt-3">
      {/* Visual meter */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
          <span className="text-text-secondary/70">Complexity Score</span>
          <span className="font-bold text-accent-primary">
            {strengthLabel} ({score}/5)
          </span>
        </div>
        <div className="flex h-1 gap-1 w-full bg-border-subtle/30 rounded overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 transition-all duration-300 ${
                i < score ? "bg-accent-primary" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Rules list */}
      <ul className="space-y-1 text-[9px] font-mono uppercase tracking-widest text-text-secondary/60">
        {rules.map((rule, idx) => {
          const isValid = rule.regex.test(value);
          return (
            <li key={idx} className="flex items-center gap-2">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                isValid ? "bg-accent-primary" : "bg-border-subtle"
              }`} />
              <span className={isValid ? "text-text-primary line-through opacity-40" : ""}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
