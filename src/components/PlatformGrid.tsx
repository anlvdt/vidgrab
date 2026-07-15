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
    <section className="py-16 px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
          <span className="gradient-text">{t.platformTitle}</span>
        </h2>
        <p className="text-[var(--text-secondary)] mb-10 max-w-lg mx-auto text-sm sm:text-base">
          {t.platformSubtitle}
        </p>

        <div className="grid grid-cols-1 min-[460px]:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 mb-8 max-w-3xl mx-auto">
          {showcasePlatforms.map((p) => {
            const Icon = platformIconMap[p.id] || Globe;
            const status = reliability[p.reliability];
            return (
              <div
                key={p.id}
                className="glass-card flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-default group"
              >
                <Icon
                  size={18}
                  className="shrink-0 group-hover:scale-125 transition-transform"
                  style={{ color: p.color }}
                />
                <span className="text-xs sm:text-sm font-medium truncate flex-1 text-left">{p.name}</span>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] whitespace-nowrap"
                  style={{ color: status.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-2 glass px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm text-[var(--text-secondary)]">
          <Globe className="w-3.5 h-3.5 text-[var(--accent-light)]" />
          {t.platformMore}
        </div>
      </div>
    </section>
  );
}
