"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full bg-bg-surface-alt/40 border border-border-subtle" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-primary shadow-soft hover:bg-bg-surface-alt active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: -10, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 10, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {isDark ? (
            <Moon className="h-5 w-5 text-accent-sky" />
          ) : (
            <Sun className="h-5 w-5 text-accent-secondary" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
