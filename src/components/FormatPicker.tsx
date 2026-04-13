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
  onDownloadStart?: () => void;
}

type FilterTab = "all" | "video" | "audio";

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const qualityOrder: Record<string, number> = {
  "8K": 9, "4K": 8, "1440p": 7, "1080p": 6, "720p": 5,
  "480p": 4, "360p": 3, "240p": 2, "144p": 1, Audio: 0,
};

export default function FormatPicker({
  formats,
  videoUrl,
  videoTitle,
  onDownloadStart,
}: FormatPickerProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [showAll, setShowAll] = useState(false);
  const { t } = useI18n();

  const filtered = useMemo(() => {
    let list = formats;
    if (tab === "video") list = formats.filter((f) => f.hasVideo);
    if (tab === "audio") list = formats.filter((f) => !f.hasVideo && f.hasAudio);

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
      window.open(`/api/download?${params.toString()}`, "_blank");
    },
    [onDownloadStart]
  );

  const handleDownload = (format: Format) => {
    const params = new URLSearchParams({
      url: videoUrl,
      format: format.formatId,
      title: videoTitle,
    });
    if (!format.hasVideo) params.set("audio", "true");
    triggerDownload(params);
  };

  const handleBestDownload = () => {
    triggerDownload(new URLSearchParams({ url: videoUrl, title: videoTitle }));
  };

  const handleAudioDownload = () => {
    triggerDownload(new URLSearchParams({ url: videoUrl, title: videoTitle, audio: "true" }));
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
      </div>

      {tab === "audio" && <WaveformVisualizer />}

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
            className="flex items-center justify-between glass-card rounded-xl px-4 py-3 group"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-3 flex-wrap">
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
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[var(--text-secondary)]">
                {formatSize(format.filesize || format.filesizeApprox)}
              </span>
              <button
                onClick={() => handleDownload(format)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-white transition-all group-hover:text-[var(--accent-light)]"
                aria-label={`Download ${format.quality} ${format.ext}`}
              >
                <Download className="w-4 h-4" />
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
    </div>
  );
}
