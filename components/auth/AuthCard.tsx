"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "w-full rounded-lg border border-border-subtle bg-bg-surface p-6 md:p-8 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
