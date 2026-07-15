"use client";

import { showcasePlatforms } from "@/lib/platforms";
import { platformIconMap } from "@/components/icons/PlatformIcons";
import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function PlatformGrid() {
  const { t } = useI18n();
  const reliability = {
    strong: { label: t.platformStrong, color: "var(--success)" },
    conditional: { label: t.platformConditional, color: "var(--warning)" },
    "best-effort": { label: t.platformBestEffort, color: "var(--text-muted)" },
  } as const;

  return (
    <section className="relative z-10 border-y border-[var(--border)] bg-[var(--section-bg)] px-3 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">{t.platformTitle}</h2>
        <p className="mx-auto mb-8 max-w-lg text-sm text-[var(--text-secondary)] sm:text-base">
          {t.platformSubtitle}
        </p>

        <div className="mx-auto mb-6 grid max-w-5xl grid-cols-2 gap-2 md:grid-cols-3">
          {showcasePlatforms.map((p) => {
            const Icon = platformIconMap[p.id] || Globe;
            const status = reliability[p.reliability];
            return (
              <div
                key={p.id}
                className="platform-card group flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2.5"
              >
                <Icon
                  size={18}
                  className="shrink-0 group-hover:scale-125 transition-transform"
                  style={{ color: p.color }}
                />
                <span className="min-w-0 flex-1 truncate text-left text-xs font-medium sm:text-sm">{p.name}</span>
                <span
                  className="inline-flex items-center gap-1 text-[9px] whitespace-nowrap sm:text-[10px]"
                  style={{ color: status.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="inline-flex max-w-xl items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-secondary)]">
          <Globe className="w-3.5 h-3.5 text-[var(--accent-light)]" />
          {t.platformMore}
        </div>
      </div>
    </section>
  );
}
