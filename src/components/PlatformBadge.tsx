"use client";

import { detectPlatform } from "@/lib/platforms";
import { platformIconMap } from "@/components/icons/PlatformIcons";
import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

interface PlatformBadgeProps {
  url: string;
}

export default function PlatformBadge({ url }: PlatformBadgeProps) {
  const platform = detectPlatform(url);
  const { t } = useI18n();
  if (!platform) return null;

  const Icon = platformIconMap[platform.id] || Globe;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border bg-[var(--bg-card-solid)] px-3 py-1.5 text-sm font-medium shadow-[0_1px_2px_var(--glass-shadow)]"
      style={{
        borderColor: `${platform.color}40`,
        boxShadow: `0 0 0 3px ${platform.color}14, 0 1px 2px var(--glass-shadow)`,
      }}
    >
      <Icon size={15} style={{ color: platform.color }} aria-hidden />
      <span style={{ color: platform.color }}>{platform.name}</span>
      <span className="text-xs text-[var(--text-muted)]">{t.platformDetected}</span>
    </div>
  );
}
