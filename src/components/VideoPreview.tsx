"use client";

import { useState } from "react";
import { Play } from "lucide-react";
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
 *   - YouTube → privacy-friendly iframe embed (click-to-load to avoid the cost
 *     of an embed on every result).
 *   - Direct media URL (TikTok / Instagram / X / Facebook / Cobalt) → native
 *     <video> player.
 *   - Otherwise → poster image so the user can still confirm the right video.
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

  // ── YouTube embed (click-to-load) ──
  if (ytId) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden max-w-2xl mx-auto mb-4 aspect-video relative">
        {playing ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
            title={title || "Preview"}
            allow="accelerated-downloads; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group relative w-full h-full cursor-pointer"
            aria-label={playLabel}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`}
              alt={title || "Preview"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent)]/90 shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 text-white translate-x-0.5" fill="currentColor" />
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
      <div className="glass-card rounded-2xl overflow-hidden max-w-2xl mx-auto mb-4">
        <video
          className="w-full aspect-video bg-black"
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
      <div className="glass-card rounded-2xl overflow-hidden max-w-2xl mx-auto mb-4 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title || "Preview"}
          className="w-full aspect-video object-cover"
        />
      </div>
    );
  }

  return null;
}
