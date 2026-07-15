"use client";

import { showcasePlatforms } from "@/lib/platforms";
import { platformIconMap } from "@/components/icons/PlatformIcons";
import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function PlatformGrid() {
  const { t, locale } = useI18n();
  const reliability = {
    strong: { label: t.platformStrong, color: "var(--success)" },
    conditional: { label: t.platformConditional, color: "var(--warning)" },
    "best-effort": { label: t.platformBestEffort, color: "var(--text-muted)" },
  } as const;

  return (
    <section className="relative z-10 border-y border-[var(--border)] bg-[var(--section-bg)] py-[var(--space-8)] sm:py-[var(--space-10)]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl text-center">
          <p className="section-kicker">
            {locale === "vi" ? "Nền tảng" : "Platforms"}
          </p>
          <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {t.platformTitle}
          </h2>
          <p className="mx-auto mb-7 max-w-[var(--measure-prose)] text-sm text-[var(--text-secondary)] sm:text-base">
            {t.platformSubtitle}
          </p>

          <div className="mx-auto mb-5 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-2.5">
            {showcasePlatforms.map((p) => {
              const Icon = platformIconMap[p.id] || Globe;
              const status = reliability[p.reliability];
              return (
                <div
                  key={p.id}
                  className="platform-card group flex cursor-default items-center gap-2.5 rounded-xl px-3 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--section-bg)] ring-1 ring-[var(--border)] transition-colors group-hover:ring-[color-mix(in_srgb,var(--accent)_30%,var(--border))]">
                    <Icon
                      size={16}
                      className="shrink-0"
                      style={{ color: p.color }}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left text-xs font-medium sm:text-sm">
                    {p.name}
                  </span>
                  <span
                    className="status-pill whitespace-nowrap"
                    style={{ color: status.color }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-current"
                      aria-hidden
                    />
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="inline-flex max-w-xl items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card-solid)]/70 px-4 py-2 text-xs text-[var(--text-secondary)] shadow-[0_1px_2px_var(--glass-shadow)]">
            <Globe
              className="h-3.5 w-3.5 shrink-0 text-[var(--accent-light)]"
              aria-hidden
            />
            {t.platformMore}
          </p>
        </div>
      </div>
    </section>
  );
}
