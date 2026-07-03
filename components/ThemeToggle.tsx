"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-elevated px-2.5 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-ink"
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? (
        <Sun size={16} aria-hidden />
      ) : (
        <Moon size={16} aria-hidden />
      )}
      {showLabel && (
        <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
      )}
    </button>
  );
}
