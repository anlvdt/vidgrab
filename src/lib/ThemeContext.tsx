"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

const THEME_EVENT = "vidgrab-theme-change";

function themeSnapshot(): Theme {
  const stored = localStorage.getItem("vidgrab-theme");
  if (stored === "dark" || stored === "light") return stored;
  return "light";
}

function serverThemeSnapshot(): Theme {
  return "light";
}

function subscribeTheme(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    themeSnapshot,
    serverThemeSnapshot
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vidgrab-theme", theme);

    // Keep browser chrome (PWA / mobile URL bar) in sync with app theme
    const color = theme === "dark" ? "#0f111a" : "#f8f7ff";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
  }, [theme]);

  const toggle = () => {
    localStorage.setItem("vidgrab-theme", theme === "dark" ? "light" : "dark");
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
