"use client";

import { useTheme } from "@/lib/ThemeContext";
import { useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [animating, setAnimating] = useState(false);

  const handleToggle = () => {
    setAnimating(true);
    toggle();
    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative w-14 h-7 rounded-full transition-all duration-500 overflow-hidden min-h-0 min-w-0"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #1a1a3e, #2d1b69)"
            : "linear-gradient(135deg, #87ceeb, #ffd700)",
      }}
    >
      {theme === "dark" && (
        <>
          <span className="absolute w-0.5 h-0.5 bg-white rounded-full top-1.5 left-2.5 opacity-80 animate-pulse" />
          <span className="absolute w-[3px] h-[3px] bg-white rounded-full top-3 left-5 opacity-60 animate-pulse" style={{ animationDelay: "0.3s" }} />
          <span className="absolute w-0.5 h-0.5 bg-white rounded-full top-1 left-7 opacity-70 animate-pulse" style={{ animationDelay: "0.6s" }} />
        </>
      )}

      {theme === "light" && (
        <>
          <span className="absolute w-3 h-1.5 bg-white/50 rounded-full top-1 right-2.5 blur-[1px]" />
          <span className="absolute w-2 h-1 bg-white/30 rounded-full top-3.5 right-5 blur-[1px]" />
        </>
      )}

      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-500 flex items-center justify-center ${
          theme === "dark" ? "left-0.5" : "left-[30px]"
        } ${animating ? "scale-110" : "scale-100"}`}
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #c0c0e0, #e0e0ff)"
              : "linear-gradient(135deg, #ffd700, #ffaa00)",
          boxShadow:
            theme === "dark"
              ? "0 0 6px rgba(192, 192, 224, 0.4)"
              : "0 0 8px rgba(255, 200, 0, 0.5)",
        }}
      >
        {theme === "dark" ? (
          <Moon className="w-3 h-3 text-indigo-900" />
        ) : (
          <Sun className="w-3 h-3 text-amber-700" />
        )}
      </span>

      {animating && (
        <span className="absolute inset-0 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <span
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full"
              style={{
                background: theme === "dark" ? "#e0e0ff" : "#ffd700",
                animation: "confetti-fall 0.5s ease-out forwards",
                animationDelay: `${i * 0.05}s`,
                left: `${30 + Math.random() * 40}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
