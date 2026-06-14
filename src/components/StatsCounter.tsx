"use client";

import {
  ClipboardCheck,
  Download,
  Globe,
  LockKeyhole,
  CalendarDays,
  CalendarRange,
  Calendar,
  CalendarCheck,
  TrendingUp,
  Timer,
  Trophy,
  CheckCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function StatsCounter() {
  const { locale, t } = useI18n();
  const isVi = locale === "vi";

  const mainStats = [
    { icon: ClipboardCheck, value: "4", label: t.statUsers, color: "from-violet-500 to-purple-600" },
    { icon: Download, value: "4", label: t.statDownloads, color: "from-blue-500 to-cyan-500" },
    { icon: Globe, value: "16", label: t.statPlatforms, color: "from-pink-500 to-rose-500" },
    { icon: LockKeyhole, value: "2+", label: t.statUptime, color: "from-emerald-500 to-teal-500" },
  ];

  const timeStats = [
    { icon: CalendarDays, value: isVi ? "Bắt buộc" : "Required", label: t.statToday, accent: "var(--accent)" },
    { icon: CalendarRange, value: "Instagram / X", label: t.statThisWeek, accent: "#60a5fa" },
    { icon: Calendar, value: "YouTube", label: t.statThisMonth, accent: "#f472b6" },
    { icon: CalendarCheck, value: isVi ? "Trình duyệt" : "Browser", label: t.statThisYear, accent: "#34d399" },
  ];

  const extraStats = [
    { icon: TrendingUp, value: isVi ? "Video public" : "Public video", label: t.statAvgPerDay },
    { icon: Timer, value: "yt-dlp + Cobalt", label: t.statPeakHour },
    { icon: Trophy, value: "YouTube", label: t.statTopPlatform },
    { icon: CheckCircle, value: isVi ? "Cố gắng tối đa" : "Best effort", label: t.statSuccessRate },
  ];

  return (
    <section className="py-12 sm:py-16 px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          {t.statsTitle}
        </h2>
        <p className="text-[var(--text-secondary)] text-center mb-10 text-sm sm:text-base max-w-md mx-auto">
          {t.statsSubtitle}
        </p>

        {/* Main stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {mainStats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 sm:p-5 text-center group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-2.5 shadow-lg group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold gradient-text mb-0.5">{s.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Time-based download stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {timeStats.map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.accent }} />
                <span className="text-xs font-medium text-[var(--text-secondary)]">{s.label}</span>
              </div>
              <p className="text-lg sm:text-xl font-bold" style={{ color: s.accent }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Extra metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {extraStats.map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-3">
              <s.icon className="w-4 h-4 text-[var(--accent-light)] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-bold truncate">{s.value}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
