"use client";

import { showcasePlatforms } from "@/lib/platforms";
import { platformIconMap } from "@/components/icons/PlatformIcons";
import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function PlatformGrid() {
  const { t, locale } = useI18n();

  return (
    <section className="relative z-10 border-y border-[var(--border)] bg-[var(--section-bg)] py-6 sm:py-7">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="section-kicker mb-2">
            {locale === "vi" ? "Nền tảng" : "Platforms"}
          </p>
          <h2 className="mb-1 text-lg font-bold tracking-tight sm:text-xl">
            {t.platformTitle}
          </h2>
          <p className="mx-auto mb-4 max-w-lg text-xs text-[var(--text-secondary)] sm:text-sm">
            {t.platformSubtitle}
          </p>

          {/* Compact logo strip — denser than full cards */}
          <ul className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {showcasePlatforms.map((p) => {
              const Icon = platformIconMap[p.id] || Globe;
              return (
                <li key={p.id}>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card-solid)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] sm:text-xs"
                    title={
                      p.reliability === "strong"
                        ? t.platformStrong
                        : p.reliability === "conditional"
                          ? t.platformConditional
                          : t.platformBestEffort
                    }
                  >
                    <Icon size={14} style={{ color: p.color }} aria-hidden />
                    {p.name}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            <Globe className="mr-1 inline h-3 w-3 text-[var(--accent-light)]" aria-hidden />
            {t.platformMore}
          </p>
        </div>
      </div>
    </section>
  );
}
