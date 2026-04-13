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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-sm font-medium"
      style={{
        borderColor: `${platform.color}33`,
        boxShadow: `0 0 12px ${platform.color}20`,
      }}
    >
      <Icon size={16} style={{ color: platform.color }} />
      <span style={{ color: platform.color }}>{platform.name}</span>
      <span className="text-[var(--text-muted)] text-xs">{t.platformDetected}</span>
    </div>
  );
}
