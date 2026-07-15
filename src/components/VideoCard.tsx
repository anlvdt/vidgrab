"use client";

import { Clock, Eye, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface VideoCardProps {
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  viewCount: number;
  /** Hide the thumbnail when a live preview is already shown above the card. */
  hideThumbnail?: boolean;
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
  hideThumbnail = false,
}: VideoCardProps) {
  const { t } = useI18n();

  return (
    <div className="glass-card mx-auto w-full max-w-3xl overflow-hidden rounded-2xl">
      {!hideThumbnail && (
        <div className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={title}
            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          {duration && (
            <span className="absolute bottom-3 right-3 rounded-lg border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-sm">
              {duration}
            </span>
          )}
        </div>
      )}
      <div className="p-4 sm:p-5">
        <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-snug tracking-tight sm:text-lg">
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-[var(--accent-light)]" aria-hidden />
            {uploader}
          </span>
          {viewCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-[var(--accent-light)]" aria-hidden />
              {formatViews(viewCount, t.views)}
            </span>
          )}
          {duration && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[var(--accent-light)]" aria-hidden />
              {duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
