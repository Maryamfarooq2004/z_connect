import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6 paper-grain relative">
      {/* Visual background accents */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-accent-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent-secondary/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-2.5 w-6 bg-accent-primary" />
            <span className="font-mono text-xs uppercase tracking-widest font-bold text-text-primary">
              ZConnect
            </span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-secondary/70">
            System Registration // ZConnect.Directory
          </p>
        </div>

        <SignUp
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: "bg-bg-surface border border-border-subtle shadow-lg rounded-xl",
              headerTitle: "text-text-primary font-display font-light",
              headerSubtitle: "text-text-secondary font-mono text-[10px] uppercase tracking-wider",
              socialButtonsBlockButton: "border border-border-subtle hover:bg-bg-base text-text-primary",
              formButtonPrimary: "bg-accent-primary hover:bg-accent-primary/90 text-bg-surface font-mono text-xs uppercase tracking-wider py-2.5",
              footerActionLink: "text-accent-primary hover:underline",
              formFieldLabel: "text-text-secondary font-mono text-[10px] uppercase tracking-wider",
              formFieldInput: "bg-bg-base/40 border border-border-subtle text-text-primary focus:border-accent-primary focus:ring-1 focus:ring-accent-primary",
              dividerLine: "bg-border-subtle/50",
              dividerText: "text-text-secondary font-mono text-[10px] uppercase",
            }
          }}
        />
      </div>
    </div>
  );
}
