"use client";

import { useState } from "react";
import {
  Copy,
  Share2,
  ExternalLink,
  ChevronRight,
  Link2,
  MoreHorizontal,
} from "lucide-react";
import {
  YoutubeIcon,
  TiktokIcon,
  InstagramIcon,
  TwitterIcon,
  FacebookIcon,
} from "@/components/icons/PlatformIcons";
import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

type PlatformTab = "youtube" | "tiktok" | "instagram" | "twitter" | "facebook" | "other";

interface GuideStep {
  icon: React.ReactNode;
  text: string;
}

export default function LinkGuide() {
  const { t } = useI18n();
  const [active, setActive] = useState<PlatformTab>("youtube");

  const tabs: { id: PlatformTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "youtube", label: "YouTube", icon: <YoutubeIcon size={16} />, color: "#FF0000" },
    { id: "tiktok", label: "TikTok", icon: <TiktokIcon size={16} />, color: "#00F2EA" },
    { id: "instagram", label: "Instagram", icon: <InstagramIcon size={16} />, color: "#E4405F" },
    { id: "twitter", label: "X", icon: <TwitterIcon size={16} />, color: "#1DA1F2" },
    { id: "facebook", label: "Facebook", icon: <FacebookIcon size={16} />, color: "#1877F2" },
    { id: "other", label: "Other", icon: <Globe size={16} />, color: "var(--accent)" },
  ];

  const guides: Record<PlatformTab, GuideStep[]> = {
    youtube: [
      { icon: <ExternalLink className="w-4 h-4" />, text: t.guideYoutube1 },
      { icon: <Share2 className="w-4 h-4" />, text: t.guideYoutube2 },
      { icon: <Copy className="w-4 h-4" />, text: t.guideYoutube3 },
    ],
    tiktok: [
      { icon: <ExternalLink className="w-4 h-4" />, text: t.guideTiktok1 },
      { icon: <Share2 className="w-4 h-4" />, text: t.guideTiktok2 },
      { icon: <Link2 className="w-4 h-4" />, text: t.guideTiktok3 },
    ],
    instagram: [
      { icon: <ExternalLink className="w-4 h-4" />, text: t.guideInstagram1 },
      { icon: <MoreHorizontal className="w-4 h-4" />, text: t.guideInstagram2 },
      { icon: <Copy className="w-4 h-4" />, text: t.guideInstagram3 },
    ],
    twitter: [
      { icon: <ExternalLink className="w-4 h-4" />, text: t.guideTwitter1 },
      { icon: <Share2 className="w-4 h-4" />, text: t.guideTwitter2 },
      { icon: <Link2 className="w-4 h-4" />, text: t.guideTwitter3 },
    ],
    facebook: [
      { icon: <ExternalLink className="w-4 h-4" />, text: t.guideFacebook1 },
      { icon: <Share2 className="w-4 h-4" />, text: t.guideFacebook2 },
      { icon: <Copy className="w-4 h-4" />, text: t.guideFacebook3 },
    ],
    other: [
      { icon: <ExternalLink className="w-4 h-4" />, text: t.guideGeneric1 },
      { icon: <Copy className="w-4 h-4" />, text: t.guideGeneric2 },
      { icon: <ChevronRight className="w-4 h-4" />, text: t.guideGeneric3 },
    ],
  };

  const activeTab = tabs.find((tab) => tab.id === active)!;
  const steps = guides[active];

  return (
    <section className="py-12 sm:py-16 px-4 relative z-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          {t.guideTitle}
        </h2>
        <p className="text-[var(--text-secondary)] text-center mb-8 text-sm sm:text-base max-w-md mx-auto">
          {t.guideSubtitle}
        </p>

        {/* Platform tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                active === tab.id
                  ? "text-white shadow-lg scale-[1.02]"
                  : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              style={
                active === tab.id
                  ? { background: tab.color, boxShadow: `0 4px 16px ${tab.color}40` }
                  : undefined
              }
            >
              <span style={{ color: active === tab.id ? "#fff" : tab.color }}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="glass-card rounded-2xl p-5 sm:p-8">
          {/* Platform header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--glass-border)]">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${activeTab.color}20` }}
            >
              <span style={{ color: activeTab.color }}>{activeTab.icon}</span>
            </div>
            <div>
              <p className="font-semibold">{activeTab.label}</p>
              <p className="text-xs text-[var(--text-muted)]">3 {t.guideStep1 === "Open the video" ? "steps" : "bước"}</p>
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                {/* Step number */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                  style={{ background: activeTab.color }}
                >
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--text-muted)]">{step.icon}</span>
                    <p className="text-sm sm:text-base font-medium">{step.text}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="ml-0.5 mt-2 mb-1 w-px h-4 bg-[var(--glass-border)]" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Visual hint */}
          <div className="mt-6 pt-4 border-t border-[var(--glass-border)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Copy className="w-3.5 h-3.5" />
            <span>
              {t.guideStep2} → {t.guideStep3}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
