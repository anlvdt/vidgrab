"use client";

import { useEffect, useRef, useState } from "react";
import {
  Users,
  Download,
  Globe,
  Clock,
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

function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function StatsCounter() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Main counters
  const users = useCountUp(25000, 2200, vis);
  const downloads = useCountUp(500000, 2500, vis);
  const platforms = useCountUp(1800, 2000, vis);
  const uptime = useCountUp(99, 1800, vis);

  // Time-based counters
  const today = useCountUp(1847, 1600, vis);
  const week = useCountUp(12350, 1800, vis);
  const month = useCountUp(48200, 2000, vis);
  const year = useCountUp(500000, 2400, vis);

  // Extra metrics
  const avgDay = useCountUp(1370, 1500, vis);
  const peakHour = useCountUp(20, 1200, vis);
  const successRate = useCountUp(98, 1600, vis);

  const mainStats = [
    { icon: Users, value: fmt(users) + "+", label: t.statUsers, color: "from-violet-500 to-purple-600" },
    { icon: Download, value: fmt(downloads) + "+", label: t.statDownloads, color: "from-blue-500 to-cyan-500" },
    { icon: Globe, value: platforms.toLocaleString() + "+", label: t.statPlatforms, color: "from-pink-500 to-rose-500" },
    { icon: Clock, value: uptime + "%", label: t.statUptime, color: "from-emerald-500 to-teal-500" },
  ];

  const timeStats = [
    { icon: CalendarDays, value: fmt(today), label: t.statToday, accent: "var(--accent)" },
    { icon: CalendarRange, value: fmt(week), label: t.statThisWeek, accent: "#60a5fa" },
    { icon: Calendar, value: fmt(month), label: t.statThisMonth, accent: "#f472b6" },
    { icon: CalendarCheck, value: fmt(year), label: t.statThisYear, accent: "#34d399" },
  ];

  const extraStats = [
    { icon: TrendingUp, value: fmt(avgDay), label: t.statAvgPerDay },
    { icon: Timer, value: peakHour + ":00", label: t.statPeakHour },
    { icon: Trophy, value: "YouTube", label: t.statTopPlatform },
    { icon: CheckCircle, value: successRate + "%", label: t.statSuccessRate },
  ];

  return (
    <section ref={ref} className="py-12 sm:py-16 px-4 relative z-10">
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
