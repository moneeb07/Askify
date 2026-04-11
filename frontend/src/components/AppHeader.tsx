"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useThemeContext } from "@/hooks/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useThemeContext();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/guid", label: "Guide" },
  ];

  return (
    <header
      className="sticky top-0 z-50 h-14 shrink-0 border-b"
      style={{
        background: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        {/* Left — Wordmark */}
        <Link
          href="/"
          className="font-mono text-sm uppercase tracking-[0.15em] font-medium text-foreground hover:opacity-80 transition-opacity"
        >
          Askify
        </Link>

        {/* Center — Nav Links */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right — Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "inline-flex items-center justify-center rounded-md h-8 w-8",
            "border border-border bg-background text-muted-foreground",
            "hover:text-foreground hover:bg-muted transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
