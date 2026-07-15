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
    <section className="relative z-10 py-6 sm:py-7">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-4 text-center">
            <p className="section-kicker mb-2">
              {locale === "vi" ? "Tính năng" : "Features"}
            </p>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {t.featuresTitle}
            </h2>
          </div>

          {/* One compact row — title only, desc as title tooltip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            {features.map((f) => (
              <div
                key={f.title}
                title={f.desc}
                className="feature-card flex flex-col items-center gap-2 rounded-xl px-2.5 py-3 text-center sm:py-3.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-light)]">
                  <f.icon className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="text-sm font-semibold leading-snug tracking-tight sm:text-base">
                  {f.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
