"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Download,
  Film,
  Music,
  Sparkles,
  Monitor,
  ChevronDown,
} from "lucide-react";
import WaveformVisualizer from "./WaveformVisualizer";
import { useI18n } from "@/lib/i18n";
import { applyLogoRemovalParams } from "@/lib/download-settings";

interface Format {
  formatId: string;
  ext: string;
  resolution: string;
  fps: number | null;
  vcodec: string;
  acodec: string;
  filesize: number | null;
  filesizeApprox: number | null;
  tbr: number | null;
  quality: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isHdr: boolean;
}

interface FormatPickerProps {
  formats: Format[];
  videoUrl: string;
  videoTitle: string;
  videoId?: string;
  uploader?: string;
  platform?: string;
  onDownloadStart?: () => void;
}

type FilterTab = "all" | "video" | "audio";

function formatSize(bytes: number | null, approximate = false): string {
  if (!bytes) return "—";
  const prefix = approximate ? "~" : "";
  if (bytes >= 1_073_741_824) return `${prefix}${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${prefix}${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${prefix}${(bytes / 1024).toFixed(1)} KB`;
  return `${prefix}${bytes} B`;
}

const qualityOrder: Record<string, number> = {
  "8K": 9, "4K": 8, "1440p": 7, "1080p": 6, "720p": 5,
  "480p": 4, "360p": 3, "240p": 2, "144p": 1, Audio: 0,
};

export default function FormatPicker({
  formats,
  videoUrl,
  videoTitle,
  videoId,
  uploader,
  platform,
  onDownloadStart,
}: FormatPickerProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [showAll, setShowAll] = useState(false);
  const [clipMode, setClipMode] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { t, locale } = useI18n();

  const filtered = useMemo(() => {
    // A video-only stream is merged with audio on the server, which pipes the
    // result as MPEG-TS — a container that only carries H.264/AAC cleanly.
    // VP9/AV01 video-only picks would download as an undecodable file, so drop
    // them. Progressive streams (video+audio already muxed) are sent as-is in
    // their original container, so any codec is fine there.
    const deliverable = formats.filter((f) => {
      if (!f.hasVideo || f.hasAudio) return true; // audio-only or progressive
      return /^(avc1|avc3|h264)/i.test(f.vcodec);
    });

    let list = deliverable;
    if (tab === "video") list = deliverable.filter((f) => f.hasVideo);
    if (tab === "audio") list = deliverable.filter((f) => !f.hasVideo && f.hasAudio);

    const seen = new Map<string, Format>();
    for (const f of list) {
      const key = `${f.quality}-${f.ext}-${f.isHdr ? "hdr" : "sdr"}`;
      const existing = seen.get(key);
      if (!existing || (f.tbr || 0) > (existing.tbr || 0)) {
        seen.set(key, f);
      }
    }

    return Array.from(seen.values()).sort(
      (a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0)
    );
  }, [formats, tab]);

  const displayed = showAll ? filtered : filtered.slice(0, 8);

  const triggerDownload = useCallback(
    (params: URLSearchParams) => {
      onDownloadStart?.();
      const sponsorBlock =
        typeof window !== "undefined"
          ? localStorage.getItem("vidgrab-sponsorblock") || "off"
          : "off";
      if (sponsorBlock !== "off") {
        params.set("sponsorblock", sponsorBlock);
      }
      applyLogoRemovalParams(params, params.get("audio") !== "true");
      if (clipMode && startTime) {
        params.set("start", startTime);
      }
      if (clipMode && endTime) {
        params.set("end", endTime);
      }
      window.open(`/api/download?${params.toString()}`, "_blank");
    },
    [clipMode, endTime, onDownloadStart, startTime]
  );

  const handleDownload = (format: Format) => {
    const params = new URLSearchParams({
      url: videoUrl,
      format: format.formatId,
      title: videoTitle,
    });
    if (videoId) params.set("videoId", videoId);
    if (uploader) params.set("uploader", uploader);
    if (platform) params.set("platform", platform);
    if (format.quality) params.set("quality", format.quality);
    if (!format.hasVideo) {
      params.set("audio", "true");
    } else if (format.hasAudio) {
      // Progressive stream (video + audio in one file) — download as-is so the
      // server doesn't waste time merging or risk swapping the quality.
      params.set("progressive", "true");
    }
    triggerDownload(params);
  };

  const handleBestDownload = () => {
    const params = new URLSearchParams({ url: videoUrl, title: videoTitle });
    if (videoId) params.set("videoId", videoId);
    if (uploader) params.set("uploader", uploader);
    if (platform) params.set("platform", platform);
    triggerDownload(params);
  };

  const handleAudioDownload = () => {
    const params = new URLSearchParams({
      url: videoUrl,
      title: videoTitle,
      audio: "true",
    });
    if (videoId) params.set("videoId", videoId);
    if (uploader) params.set("uploader", uploader);
    if (platform) params.set("platform", platform);
    params.set("quality", "Audio");
    triggerDownload(params);
  };

  const tabLabels: Record<FilterTab, string> = {
    all: t.tabAll,
    video: t.tabVideo,
    audio: t.tabAudio,
  };

  return (
    <div className="mx-auto mt-6 w-full max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        <button type="button" onClick={handleBestDownload} className="btn-hero px-5 text-sm">
          <Download className="h-4 w-4" aria-hidden />
          {t.bestQuality}
        </button>
        <button type="button" onClick={handleAudioDownload} className="btn-secondary text-sm">
          <Music className="h-4 w-4" aria-hidden />
          {t.audioOnly}
        </button>
        <button
          type="button"
          onClick={() => setClipMode(!clipMode)}
          aria-pressed={clipMode}
          className={`chip-toggle ${clipMode ? "is-active" : ""}`}
        >
          <Film className="h-4 w-4" aria-hidden />
          {t.clipLabel}
        </button>
      </div>

      {tab === "audio" && <WaveformVisualizer />}

      {clipMode && (
        <div className="mb-5 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card-solid)] p-3.5 shadow-[0_1px_2px_var(--glass-shadow)]">
          <div className="flex items-center gap-2">
            <label htmlFor="clip-start" className="text-xs font-medium text-[var(--text-muted)]">
              {t.clipStart}
            </label>
            <input
              id="clip-start"
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="0:00"
              className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="clip-end" className="text-xs font-medium text-[var(--text-muted)]">
              {t.clipEnd}
            </label>
            <input
              id="clip-end"
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder={t.clipEndPlaceholder}
              className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>
        </div>
      )}

      <div
        className="seg-control mx-auto mb-5 max-w-sm"
        role="tablist"
        aria-label={locale === "vi" ? "Lọc định dạng" : "Filter formats"}
      >
        {(["all", "video", "audio"] as FilterTab[]).map((tt) => (
          <button
            key={tt}
            type="button"
            role="tab"
            aria-selected={tab === tt}
            onClick={() => setTab(tt)}
            className={`seg-option ${tab === tt ? "is-active" : ""}`}
          >
            {tt === "all" && <Monitor className="h-3.5 w-3.5" aria-hidden />}
            {tt === "video" && <Film className="h-3.5 w-3.5" aria-hidden />}
            {tt === "audio" && <Music className="h-3.5 w-3.5" aria-hidden />}
            {tabLabels[tt]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {displayed.map((format) => (
          <div
            key={format.formatId}
            className="glass-card flex flex-col gap-3 rounded-xl px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold text-white ${
                  format.hasVideo ? "badge-video" : "badge-audio"
                }`}
              >
                {format.quality}
              </span>
              {format.isHdr && (
                <span className="badge-hdr inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  HDR
                </span>
              )}
              <span className="font-mono text-xs uppercase text-[var(--text-muted)]">
                {format.ext}
              </span>
              {format.fps && format.fps > 30 && (
                <span className="text-xs font-medium text-[var(--accent-light)]">
                  {format.fps}fps
                </span>
              )}
              <span className="text-xs text-[var(--text-secondary)]">
                {!format.hasVideo
                  ? t.formatAudio
                  : format.hasAudio
                    ? t.formatProgressive
                    : t.formatMerged}
              </span>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs tabular-nums text-[var(--text-secondary)]">
                {formatSize(
                  format.filesize || format.filesizeApprox,
                  !format.filesize && !!format.filesizeApprox
                )}
              </span>
              <button
                type="button"
                onClick={() => handleDownload(format)}
                className="btn-format"
                aria-label={`${t.downloadLabel} ${format.quality} ${format.ext}`}
              >
                <Download className="h-4 w-4" aria-hidden />
                {t.downloadLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 8 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mx-auto mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-[var(--accent-light)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
          {filtered.length - 8} {t.showMore}
        </button>
      )}
      {showAll && filtered.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mx-auto mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--accent-light)]"
        >
          <ChevronDown className="h-4 w-4 rotate-180" aria-hidden />
          {locale === "vi" ? "Thu gọn định dạng" : "Show fewer formats"}
        </button>
      )}
    </div>
  );
}
