"use client";

import {
  MonitorPlay,
  ListVideo,
  Globe,
  AudioLines,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Features() {
  const { t } = useI18n();

  const features: { icon: LucideIcon; title: string; desc: string; gradient: string }[] = [
    { icon: MonitorPlay, title: t.feat1Title, desc: t.feat1Desc, gradient: "from-violet-500 to-purple-600" },
    { icon: Globe, title: t.feat2Title, desc: t.feat2Desc, gradient: "from-blue-500 to-cyan-500" },
    { icon: ListVideo, title: t.feat3Title, desc: t.feat3Desc, gradient: "from-pink-500 to-rose-500" },
    { icon: AudioLines, title: t.feat4Title, desc: t.feat4Desc, gradient: "from-emerald-500 to-teal-500" },
    { icon: Shield, title: t.feat5Title, desc: t.feat5Desc, gradient: "from-amber-500 to-orange-500" },
    { icon: Zap, title: t.feat6Title, desc: t.feat6Desc, gradient: "from-red-500 to-pink-500" },
  ];

  return (
    <section className="py-12 sm:py-20 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          {t.featuresTitle} <span className="gradient-text">VidGrab</span>?
        </h2>
        <p className="text-[var(--text-secondary)] text-center mb-8 sm:mb-12 max-w-lg mx-auto text-sm sm:text-base">
          {t.featuresSubtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card rounded-2xl p-5 sm:p-6 group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <f.icon className="w-5 h-5 text-white" />
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
