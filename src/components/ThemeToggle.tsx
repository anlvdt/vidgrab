"use client";

import { useTheme } from "@/lib/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card-solid)] text-[var(--text-secondary)] shadow-[0_1px_2px_color-mix(in_srgb,var(--glass-shadow)_45%,transparent)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Moon className="theme-icon-enter h-4 w-4" key="moon" aria-hidden />
      ) : (
        <Sun className="theme-icon-enter h-4 w-4" key="sun" aria-hidden />
      )}
    </button>
  );
}
