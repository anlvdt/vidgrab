"use client";

import { useI18n, type Locale } from "@/lib/i18n";

const langs: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
];

export default function LangToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex h-9 items-center rounded-lg border border-[var(--border)] bg-[var(--bg-card-solid)] p-0.5">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          className={`compact-control min-h-0 min-w-0 rounded-md px-2.5 py-1 text-[11px] font-semibold leading-none transition-colors ${
            locale === l.code
              ? "bg-[var(--accent-soft)] text-[var(--accent-light)]"
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
