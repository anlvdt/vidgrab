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
      // Add SponsorBlock setting from localStorage (Arroxy feature)
      const sponsorBlock = typeof window !== "undefined"
        ? localStorage.getItem("vidgrab-sponsorblock") || "off"
        : "off";
      if (sponsorBlock !== "off") {
        params.set("sponsorblock", sponsorBlock);
      }
      applyLogoRemovalParams(params, params.get("audio") !== "true");
      // Add clip range if specified
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
    const params = new URLSearchParams({ url: videoUrl, title: videoTitle, audio: "true" });
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
    <div className="max-w-2xl mx-auto mt-6">
      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        <button
          onClick={handleBestDownload}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          style={{ boxShadow: "0 4px 20px var(--accent-glow)" }}
        >
          <Download className="w-4 h-4" />
          {t.bestQuality}
        </button>
        <button
          onClick={handleAudioDownload}
          className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-[var(--text-primary)] font-semibold text-sm hover:scale-[1.02] transition-all"
        >
          <Music className="w-4 h-4" />
          {t.audioOnly}
        </button>

          <button
            onClick={() => setClipMode(!clipMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${clipMode ? "bg-[var(--accent)] text-white" : "glass text-[var(--text-secondary)]"}`}
        >
            <Film className="w-4 h-4" />
            {t.clipLabel}
          </button>
      </div>

      {tab === "audio" && <WaveformVisualizer />}

      {clipMode && (
        <div className="flex flex-wrap items-center gap-3 justify-center mb-5 glass rounded-xl p-3">
          <div className="flex items-center gap-2">
            <label htmlFor="clip-start" className="text-xs text-[var(--text-muted)]">{t.clipStart}</label>
            <input
              id="clip-start"
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="0:00"
              className="w-20 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-sm border border-[var(--border)] focus:border-[var(--accent)] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="clip-end" className="text-xs text-[var(--text-muted)]">{t.clipEnd}</label>
            <input
              id="clip-end"
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder={t.clipEndPlaceholder}
              className="w-20 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-sm border border-[var(--border)] focus:border-[var(--accent)] outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 glass rounded-xl p-1 mb-5 max-w-xs mx-auto">
        {(["all", "video", "audio"] as FilterTab[]).map((tt) => (
          <button
            key={tt}
            onClick={() => setTab(tt)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === tt
                ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tt === "all" && <Monitor className="w-3.5 h-3.5" />}
            {tt === "video" && <Film className="w-3.5 h-3.5" />}
            {tt === "audio" && <Music className="w-3.5 h-3.5" />}
            {tabLabels[tt]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {displayed.map((format, i) => (
          <div
            key={format.formatId}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 glass-card rounded-xl px-4 py-3 group"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  format.hasVideo ? "badge-video" : "badge-audio"
                } text-white`}
              >
                {format.quality}
              </span>
              {format.isHdr && (
                <span className="badge-hdr px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  HDR
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)] uppercase font-mono">
                {format.ext}
              </span>
              {format.fps && format.fps > 30 && (
                <span className="text-xs text-[var(--accent-light)] font-medium">
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
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="text-xs text-[var(--text-secondary)]">
                {formatSize(format.filesize || format.filesizeApprox, !format.filesize && !!format.filesizeApprox)}
              </span>
              <button
                onClick={() => handleDownload(format)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--accent-light)] bg-[var(--accent)]/10 hover:bg-[var(--accent)] hover:text-white transition-all"
                aria-label={`${t.downloadLabel} ${format.quality} ${format.ext}`}
              >
                <Download className="w-4 h-4" />
                {t.downloadLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 8 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-2 mx-auto mt-4 text-sm text-[var(--accent-light)] hover:text-[var(--accent)] transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
          {filtered.length - 8} {t.showMore}
        </button>
      )}
      {showAll && filtered.length > 8 && (
        <button
          onClick={() => setShowAll(false)}
          className="flex items-center gap-2 mx-auto mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-light)] transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-180" />
          {locale === "vi" ? "Thu gọn định dạng" : "Show fewer formats"}
        </button>
      )}
    </div>
  );
}
