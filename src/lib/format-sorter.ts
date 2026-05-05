/**
 * Format quality sorter — Arroxy's qualitySorter adapted for VidGrab.
 *
 * Sorts video formats by resolution (descending), then FPS, then filesize.
 * Audio formats sorted by bitrate (descending).
 * This provides a better UX than the raw yt-dlp format order.
 */

import type { VideoFormat } from "./ytdlp";

/**
 * Extract numeric height from resolution string like "1920x1080" or "1080p"
 */
function resolutionHeight(resolution: string): number {
  // Try "WxH" format
  const wxh = resolution.match(/(\d+)x(\d+)/);
  if (wxh) return parseInt(wxh[2], 10);

  // Try "Np" format
  const np = resolution.match(/(\d{3,4})/);
  return np ? parseInt(np[1], 10) : 0;
}

/**
 * Quality presets inspired by Arroxy's "Best quality / Balanced / Small file" system.
 */
export interface QualityPreset {
  id: string;
  label: string;
  labelVi: string;
  description: string;
  descriptionVi: string;
  filter: (format: VideoFormat) => boolean;
}

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: "best",
    label: "Best Quality",
    labelVi: "Chất lượng tốt nhất",
    description: "4K/1080p60 — largest file",
    descriptionVi: "4K/1080p60 — file lớn nhất",
    filter: (f) => f.hasVideo && (f.quality === "4K" || f.quality === "1440p" || f.quality === "1080p"),
  },
  {
    id: "balanced",
    label: "Balanced",
    labelVi: "Cân bằng",
    description: "720p/1080p — good quality, smaller file",
    descriptionVi: "720p/1080p — chất lượng tốt, file nhỏ hơn",
    filter: (f) => f.hasVideo && (f.quality === "1080p" || f.quality === "720p"),
  },
  {
    id: "small",
    label: "Small File",
    labelVi: "File nhỏ",
    description: "480p/360p — fastest download",
    descriptionVi: "480p/360p — tải nhanh nhất",
    filter: (f) => f.hasVideo && (f.quality === "480p" || f.quality === "360p"),
  },
];

/**
 * Sort formats by quality (Arroxy's algorithm).
 * Video formats: resolution desc → fps desc → filesize desc
 * Audio formats: bitrate desc
 */
export function sortFormatsByQuality(formats: VideoFormat[]): VideoFormat[] {
  const video = formats.filter((f) => f.hasVideo);
  const audio = formats.filter((f) => !f.hasVideo && f.hasAudio);

  const sortedVideo = [...video].sort((a, b) => {
    const byRes = resolutionHeight(b.resolution) - resolutionHeight(a.resolution);
    if (byRes !== 0) return byRes;
    const byFps = (b.fps ?? 0) - (a.fps ?? 0);
    if (byFps !== 0) return byFps;
    return (b.filesize ?? b.filesizeApprox ?? 0) - (a.filesize ?? a.filesizeApprox ?? 0);
  });

  const sortedAudio = [...audio].sort(
    (a, b) => (b.tbr ?? 0) - (a.tbr ?? 0)
  );

  return [...sortedVideo, ...sortedAudio];
}

/**
 * Pick the best format for a given preset.
 * Returns the format ID that yt-dlp should use.
 */
export function pickFormatForPreset(
  formats: VideoFormat[],
  presetId: string
): VideoFormat | null {
  const preset = QUALITY_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;

  const candidates = formats.filter(preset.filter);
  if (candidates.length === 0) return null;

  // Sort and pick the best match
  const sorted = sortFormatsByQuality(candidates);
  return sorted[0] || null;
}

/**
 * Estimate download time based on file size and connection speed.
 * Inspired by Arroxy's download duration bucketing.
 */
export function estimateDownloadTime(bytes: number | null, speedMbps = 10): string {
  if (!bytes) return "";
  const seconds = (bytes * 8) / (speedMbps * 1_000_000);
  if (seconds < 10) return "< 10s";
  if (seconds < 30) return "~30s";
  if (seconds < 60) return "~1 min";
  if (seconds < 300) return `~${Math.round(seconds / 60)} min`;
  return `~${Math.round(seconds / 60)} min`;
}
