"use client";

import { useState } from "react";
import { Play, Film } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface VideoPreviewProps {
  /** Original page URL the user submitted (used to detect YouTube). */
  sourceUrl: string;
  /** Poster/thumbnail image. */
  thumbnail?: string;
  /** Direct playable media URL (scraper / Cobalt), if available. */
  directUrl?: string;
  title?: string;
}

/** Extract a YouTube video id from any common YouTube URL shape. */
export function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/i,
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/(?:embed|shorts|live|v)\/([\w-]{11})/i,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * Always-available preview:
 *   - YouTube → privacy-friendly iframe embed (click-to-load).
 *   - Direct media URL → native <video> player.
 *   - Otherwise → poster image.
 */
export default function VideoPreview({
  sourceUrl,
  thumbnail,
  directUrl,
  title,
}: VideoPreviewProps) {
  const { locale } = useI18n();
  const [playing, setPlaying] = useState(false);
  const ytId = getYouTubeId(sourceUrl);

  const playLabel = locale === "vi" ? "Xem trước" : "Preview";
  const previewHint =
    locale === "vi" ? "Nhấn để xem trước" : "Click to preview";

  // ── YouTube embed (click-to-load) ──
  if (ytId) {
    return (
      <div className="glass-card relative mx-auto mb-4 aspect-video w-full max-w-3xl overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
        {playing ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
            title={title || "Preview"}
            allow="accelerated-downloads; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group relative h-full w-full cursor-pointer"
            aria-label={playLabel}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`}
              alt={title || "Preview"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10 transition-colors group-hover:from-black/45" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_8px_28px_var(--accent-glow)] ring-4 ring-white/15 transition-transform duration-200 group-hover:scale-110">
                <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" aria-hidden />
              </span>
              <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
                {previewHint}
              </span>
            </span>
          </button>
        )}
      </div>
    );
  }

  // ── Native player for direct media (scraper / Cobalt) ──
  if (directUrl) {
    return (
      <div className="glass-card mx-auto mb-4 w-full max-w-3xl overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
        <video
          className="aspect-video w-full bg-black"
          controls
          playsInline
          preload="metadata"
          poster={thumbnail || undefined}
          crossOrigin="anonymous"
        >
          <source src={directUrl} />
        </video>
      </div>
    );
  }

  // ── Poster-only fallback ──
  if (thumbnail) {
    return (
      <div className="glass-card relative mx-auto mb-4 w-full max-w-3xl overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title || "Preview"}
          className="aspect-video w-full object-cover"
        />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Film className="h-3 w-3" aria-hidden />
          {locale === "vi" ? "Ảnh xem trước" : "Preview image"}
        </span>
      </div>
    );
  }

  return null;
}
