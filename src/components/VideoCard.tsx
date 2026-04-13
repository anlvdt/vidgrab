"use client";

import { Clock, Eye, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface VideoCardProps {
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  viewCount: number;
}

function formatViews(count: number, label: string): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M ${label}`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K ${label}`;
  return `${count} ${label}`;
}

export default function VideoCard({
  title,
  thumbnail,
  duration,
  uploader,
  viewCount,
}: VideoCardProps) {
  const { t } = useI18n();

  return (
    <div className="glass-card rounded-2xl overflow-hidden max-w-2xl mx-auto">
      <div className="relative group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title}
          className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {duration && (
          <span className="absolute bottom-3 right-3 glass text-white text-xs font-mono px-2.5 py-1 rounded-lg">
            {duration}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-lg leading-snug mb-3 line-clamp-2">
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-[var(--text-secondary)] text-sm">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {uploader}
          </span>
          {viewCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {formatViews(viewCount, t.views)}
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
