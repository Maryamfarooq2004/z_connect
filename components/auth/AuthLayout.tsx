"use client";

import * as React from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full bg-bg-base text-text-primary transition-colors duration-300 flex flex-col justify-between p-6 md:p-12 paper-grain font-sans">
      
      {/* Top Header Grid */}
      <header className="w-full flex justify-between items-start border-b border-border-subtle pb-6 relative z-10">
        <div className="space-y-1">
          <span className="font-display italic text-lg tracking-tight font-medium">ZConnect</span>
          <span className="block text-[8px] font-mono tracking-[0.25em] text-text-secondary uppercase">
            Platform for Gen Z // Connect. Share. Explore.
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Grid Content: Highly Asymmetric Grid */}
      <main className="my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-12 relative z-10">
        
        {/* Left Side: Generous Whitespace & Large Editorial Statement */}
        <div className="lg:col-span-6 space-y-6 pr-8">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[9px] font-mono tracking-[0.3em] text-accent-primary uppercase"
          >
            [ Introduction ]
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light font-display leading-[0.95] tracking-tight text-text-primary select-none"
          >
            Connect, <br />
            share, and <br />
            explore <span className="font-normal italic text-accent-primary">freely</span>.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-4 border-t border-border-subtle max-w-sm"
          >
            <p className="text-xs text-text-secondary leading-relaxed font-mono uppercase tracking-wider">
              ZConnect is an editorial catalog built for the next generation of creators to build directories, share files, and explore new team dynamics.
            </p>
          </motion.div>
        </div>

        {/* Right Side: Centered Auth Card */}
        <div className="lg:col-span-6 flex justify-end">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

      </main>

      {/* Bottom Technical Information */}
      <footer className="w-full flex justify-between items-center text-[9px] font-mono text-text-secondary/40 uppercase tracking-widest border-t border-border-subtle pt-6 relative z-10">
        <span>ZCN-09 // LOG.OP</span>
        <span>Directory System // secure</span>
      </footer>

    </div>
  );
}
