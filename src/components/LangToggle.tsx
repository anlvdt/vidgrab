"use client";

import { useI18n, type Locale } from "@/lib/i18n";

const langs: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
];

export default function LangToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--bg-card-solid)] p-0.5 shadow-[0_1px_2px_color-mix(in_srgb,var(--glass-shadow)_45%,transparent)]">
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-2.5 text-[11px] font-semibold leading-none transition-colors ${
            locale === l.code
              ? "bg-[var(--accent-soft)] text-[var(--accent-light)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          aria-label={`Switch to ${l.label}`}
          aria-pressed={locale === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
