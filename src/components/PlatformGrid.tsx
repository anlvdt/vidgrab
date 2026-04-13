"use client";

import { showcasePlatforms, TOTAL_SUPPORTED_SITES } from "@/lib/platforms";
import { platformIconMap } from "@/components/icons/PlatformIcons";
import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export default function PlatformGrid() {
  const { t } = useI18n();

  return (
    <section className="py-16 px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">
          <span className="gradient-text">{TOTAL_SUPPORTED_SITES.toLocaleString()}+</span>{" "}
          {t.platformTitle}
        </h2>
        <p className="text-[var(--text-secondary)] mb-10 max-w-lg mx-auto text-sm sm:text-base">
          {t.platformSubtitle}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 mb-8 max-w-2xl mx-auto">
          {showcasePlatforms.map((p) => {
            const Icon = platformIconMap[p.id] || Globe;
            return (
              <div
                key={p.id}
                className="glass-card flex items-center gap-2 px-3 py-2.5 sm:px-4 rounded-xl cursor-default group"
              >
                <Icon
                  size={18}
                  className="shrink-0 group-hover:scale-125 transition-transform"
                  style={{ color: p.color }}
                />
                <span className="text-xs sm:text-sm font-medium truncate">{p.name}</span>
              </div>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-2 glass px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm text-[var(--text-secondary)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
          </span>
          {(TOTAL_SUPPORTED_SITES - showcasePlatforms.length).toLocaleString()}+ {t.platformMore}
        </div>
      </div>
    </section>
  );
}
