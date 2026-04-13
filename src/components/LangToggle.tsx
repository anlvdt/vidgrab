"use client";

import { useI18n, type Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";

const langs: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
];

export default function LangToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center glass rounded-full p-0.5 h-8">
      <Languages className="w-3 h-3 text-[var(--text-muted)] mx-1.5" />
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          className={`px-2 py-1 rounded-full text-[11px] font-medium transition-all leading-none min-h-0 min-w-0 ${
            locale === l.code
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          aria-label={`Switch to ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
