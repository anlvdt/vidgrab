/**
 * Download Progress Tracker — Client-side progress monitoring.
 *
 * Inspired by Arroxy's DownloadEventBridge and progress parsing system.
 * Since VidGrab is a web app (not Electron), we track progress via:
 * 1. ReadableStream byte counting for direct downloads
 * 2. Status polling for yt-dlp downloads
 *
 * This provides the user with real-time feedback during downloads.
 */

export type DownloadStatus =
  | "idle"
  | "preparing"
  | "downloading"
  | "merging"
  | "complete"
  | "error"
  | "cancelled";

export interface DownloadProgress {
  id: string;
  url: string;
  title: string;
  status: DownloadStatus;
  percent: number;
  bytesDownloaded: number;
  totalBytes: number | null;
  speed: string;
  eta: string;
  startedAt: number;
  error?: string;
}

type ProgressListener = (progress: DownloadProgress) => void;

class DownloadProgressTracker {
  private downloads = new Map<string, DownloadProgress>();
  private listeners = new Set<ProgressListener>();

  /**
   * Start tracking a new download.
   */
  start(id: string, url: string, title: string, totalBytes?: number): void {
    const progress: DownloadProgress = {
      id,
      url,
      title,
      status: "preparing",
      percent: 0,
      bytesDownloaded: 0,
      totalBytes: totalBytes || null,
      speed: "",
      eta: "",
      startedAt: Date.now(),
    };
    this.downloads.set(id, progress);
    this.notify(progress);
  }

  /**
   * Update download progress.
   */
  update(id: string, patch: Partial<DownloadProgress>): void {
    const existing = this.downloads.get(id);
    if (!existing) return;

    const updated = { ...existing, ...patch };

    // Auto-calculate percent from bytes if not provided
    if (patch.bytesDownloaded && updated.totalBytes && !patch.percent) {
      updated.percent = Math.min(
        99,
        Math.round((updated.bytesDownloaded / updated.totalBytes) * 100)
      );
    }

    // Auto-calculate speed
    if (patch.bytesDownloaded) {
      const elapsed = (Date.now() - updated.startedAt) / 1000;
      if (elapsed > 0) {
        const bytesPerSec = updated.bytesDownloaded / elapsed;
        updated.speed = formatSpeed(bytesPerSec);

        // ETA
        if (updated.totalBytes) {
          const remaining = updated.totalBytes - updated.bytesDownloaded;
          const etaSec = remaining / bytesPerSec;
          updated.eta = formatEta(etaSec);
        }
      }
    }

    this.downloads.set(id, updated);
    this.notify(updated);
  }

  /**
   * Mark download as complete.
   */
  complete(id: string): void {
    this.update(id, { status: "complete", percent: 100 });
  }

  /**
   * Mark download as failed.
   */
  fail(id: string, error: string): void {
    this.update(id, { status: "error", error });
  }

  /**
   * Cancel a download.
   */
  cancel(id: string): void {
    this.update(id, { status: "cancelled" });
  }

  /**
   * Get current progress for a download.
   */
  get(id: string): DownloadProgress | undefined {
    return this.downloads.get(id);
  }

  /**
   * Get all active downloads.
   */
  getAll(): DownloadProgress[] {
    return Array.from(this.downloads.values()).filter(
      (d) => d.status !== "complete" && d.status !== "cancelled"
    );
  }

  /**
   * Subscribe to progress updates.
   */
  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clean up completed/cancelled downloads older than 5 minutes.
   */
  cleanup(): void {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [id, dl] of this.downloads) {
      if (
        (dl.status === "complete" || dl.status === "cancelled") &&
        dl.startedAt < cutoff
      ) {
        this.downloads.delete(id);
      }
    }
  }

  private notify(progress: DownloadProgress): void {
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch {
        // Don't let listener errors break the tracker
      }
    }
  }
}

// ─── Formatting Helpers ──────────────────────────────────────

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1_048_576) {
    return `${(bytesPerSec / 1_048_576).toFixed(1)} MB/s`;
  }
  if (bytesPerSec >= 1024) {
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  }
  return `${bytesPerSec.toFixed(0)} B/s`;
}

function formatEta(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return "";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

/**
 * Duration bucketing for analytics (from Arroxy).
 */
export function downloadDurationBucket(ms: number): string {
  if (ms < 30_000) return "<30s";
  if (ms < 120_000) return "30s-2m";
  if (ms < 600_000) return "2-10m";
  if (ms < 1_800_000) return "10-30m";
  return ">30m";
}

/**
 * Size bucketing for analytics (from Arroxy).
 */
export function sizeBucket(bytes: number): string {
  const MB = 1_048_576;
  if (bytes < 50 * MB) return "<50MB";
  if (bytes < 500 * MB) return "50-500MB";
  if (bytes < 2_048 * MB) return "500MB-2GB";
  return ">2GB";
}

// Singleton instance
export const downloadTracker = new DownloadProgressTracker();
