"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "mindmaster_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Clean Daylight Studio Mode is the default
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored === "dark" || stored === "light") {
        setThemeState(stored);
        applyThemeClass(stored);
      } else {
        setThemeState("light");
        applyThemeClass("light");
      }
    } catch {
      applyThemeClass("light");
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setThemeState(e.newValue);
        applyThemeClass(e.newValue);
      }
    };

    const handleCustomChange = () => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
        if (stored === "dark" || stored === "light") {
          setThemeState(stored);
          applyThemeClass(stored);
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("mindmaster_theme_changed", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("mindmaster_theme_changed", handleCustomChange);
    };
  }, []);

  const applyThemeClass = (mode: ThemeMode) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (mode === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      }
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      window.dispatchEvent(new Event("mindmaster_theme_changed"));
    } catch {}
    applyThemeClass(mode);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light" as ThemeMode,
      toggleTheme: () => {},
      setTheme: () => {},
      isDark: false,
    };
  }
  return context;
}
