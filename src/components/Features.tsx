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
  const { t } = useI18n();

  const features: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: MonitorPlay, title: t.feat1Title, desc: t.feat1Desc },
    { icon: Globe, title: t.feat2Title, desc: t.feat2Desc },
    { icon: ListVideo, title: t.feat3Title, desc: t.feat3Desc },
    { icon: AudioLines, title: t.feat4Title, desc: t.feat4Desc },
  ];

  return (
    <section className="relative z-10 px-3 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">{t.featuresTitle}</h2>
        <p className="mx-auto mb-8 max-w-lg text-center text-sm text-[var(--text-secondary)] sm:text-base">
          {t.featuresSubtitle}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="feature-card group rounded-2xl p-5 sm:p-6"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-light)]"
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">{f.title}</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
