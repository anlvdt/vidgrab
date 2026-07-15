"use client";

import {
  MonitorPlay,
  ListVideo,
  Globe,
  AudioLines,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Features() {
  const { t, locale } = useI18n();

  const features: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: MonitorPlay, title: t.feat1Title, desc: t.feat1Desc },
    { icon: Globe, title: t.feat2Title, desc: t.feat2Desc },
    { icon: ListVideo, title: t.feat3Title, desc: t.feat3Desc },
    { icon: AudioLines, title: t.feat4Title, desc: t.feat4Desc },
  ];

  return (
    <section className="relative z-10 py-[var(--space-8)] sm:py-[var(--space-10)]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 text-center">
            <p className="section-kicker">
              {locale === "vi" ? "Tính năng" : "Features"}
            </p>
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {t.featuresTitle}
            </h2>
            <p className="mx-auto max-w-[var(--measure-prose)] text-sm text-[var(--text-secondary)] sm:text-base">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="feature-card group flex h-full min-h-[11.5rem] flex-col rounded-2xl p-5 sm:min-h-[12.5rem] sm:p-6"
              >
                <div className="mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-light)] ring-1 ring-[color-mix(in_srgb,var(--accent)_22%,transparent)] transition-all duration-200 group-hover:bg-[var(--accent)] group-hover:text-white group-hover:ring-[var(--accent)] group-hover:shadow-[0_8px_20px_var(--accent-glow)]">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mb-2 text-sm font-semibold tracking-tight sm:text-base">
                  {f.title}
                </h3>
                <p className="mt-auto text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
