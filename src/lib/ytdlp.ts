/**
 * yt-dlp integration with Arroxy-inspired retry strategy.
 *
 * Key improvements from Arroxy (https://github.com/antonio-orionus/Arroxy):
 * 1. 3-attempt retry ladder: primary → alternative → fallback player clients
 * 2. Smart player client selection (skip PoT-demanding clients)
 * 3. URL sanitization (strip tracking params)
 * 4. Better error classification and retry logic
 * 5. Deterministic retry instead of random rotation
 */

import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { existsSync, statSync } from "fs";
import { join } from "path";
import { sanitizeUrl } from "./url-sanitizer";
import {
  getExtractorArgsForAttempt,
  classifyStderr,
  isBotBlockError,
  isRateLimitError,
  isNsigError,
  PLAYER_CLIENT_FALLBACK,
  type StderrSignal,
} from "./po-token";

const execFileAsync = promisify(execFile);

// ─── Constants ───────────────────────────────────────────────
const COOKIES_PATH = join(process.cwd(), "cookies.txt");
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

/**
 * Arroxy-inspired retry ladder for YouTube player clients.
 *
 * Unlike the original random rotation, this uses a deterministic strategy:
 * - Attempt 0: default,-web,-web_safari (Arroxy's PLAYER_CLIENT_FALLBACK)
 *   Skips the clients that most often trigger bot detection.
 * - Attempt 1: ios,web_creator (alternative clients with less bot detection)
 * - Attempt 2: mweb,android (mobile clients, usually least restricted)
 */
const MAX_RETRY_ATTEMPTS = 3;

// ─── Rate Limiter ────────────────────────────────────────────
class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private lastRequestMs = 0;

  constructor(
    private maxConcurrent: number = 3,
    private minIntervalMs: number = 500
  ) {}

  async acquire(): Promise<void> {
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.running++;

    const now = Date.now();
    const elapsed = now - this.lastRequestMs;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastRequestMs = Date.now();
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

const ytRateLimiter = new RateLimiter(3, 500);

// ─── 429 Tracking ────────────────────────────────────────────
let rateLimitCount = 0;
let rateLimitLastTs = 0;

function trackRateLimit(): void {
  rateLimitCount++;
  rateLimitLastTs = Date.now();
}

function getRateLimitCount(): number {
  if (rateLimitLastTs === 0) return 0;
  // Reset after 30 minutes
  if (Date.now() - rateLimitLastTs > 30 * 60 * 1000) {
    rateLimitCount = 0;
    rateLimitLastTs = 0;
    return 0;
  }
  return rateLimitCount;
}

// ─── Helpers ─────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isYouTubeUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("youtube.com") || lower.includes("youtu.be");
}

// ─── Types ───────────────────────────────────────────────────
export interface VideoFormat {
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

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  uploader: string;
  viewCount: number;
  uploadDate: string;
  description: string;
  formats: VideoFormat[];
  isPlaylist: boolean;
  playlistCount?: number;
  playlistEntries?: PlaylistEntry[];
}

export interface PlaylistEntry {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  url: string;
}

export interface DownloadOptions {
  proxy?: string;
  cookies?: boolean;
  /** SponsorBlock mode: "mark" (chapter markers) or "remove" (cut segments) */
  sponsorBlock?: string;
}

// ─── Base Args Builder ───────────────────────────────────────
function baseArgs(opts?: DownloadOptions): string[] {
  const args: string[] = ["--no-warnings"];

  if (opts?.cookies !== false && existsSync(COOKIES_PATH)) {
    args.push("--cookies", COOKIES_PATH);
  }

  const proxy = opts?.proxy || process.env.YTDLP_PROXY;
  if (proxy) {
    args.push("--proxy", proxy);
  }

  args.push("--retries", "5");
  args.push("--extractor-retries", "3");
  args.push("--socket-timeout", "30");
  args.push("--user-agent", CHROME_UA);
  args.push("--referer", "https://www.youtube.com/");
  args.push("--no-check-certificates");
  args.push("--force-ipv4");
  args.push("--geo-bypass");

  return args;
}

// ─── Format Helpers ──────────────────────────────────────────
function classifyQuality(height: number | null, width: number | null): string {
  if (!height && !width) return "Unknown";
  const h = height || 0;
  if (h >= 4320) return "8K";
  if (h >= 2160) return "4K";
  if (h >= 1440) return "1440p";
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  if (h >= 360) return "360p";
  if (h >= 240) return "240p";
  return "144p";
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function parseFormats(data: any): VideoFormat[] {
  return (data.formats || [])
    .filter((f: any) => f.url || f.manifest_url)
    .map((f: any) => {
      const hasVideo = f.vcodec !== "none" && !!f.vcodec;
      const hasAudio = f.acodec !== "none" && !!f.acodec;
      const resolution = hasVideo
        ? `${f.width || "?"}x${f.height || "?"}`
        : "audio only";
      const isHdr = /hdr|vp9\.2|av01.*\.10\./i.test(f.vcodec || "");

      return {
        formatId: f.format_id,
        ext: f.ext,
        resolution,
        fps: f.fps || null,
        vcodec: f.vcodec || "none",
        acodec: f.acodec || "none",
        filesize: f.filesize || null,
        filesizeApprox: f.filesize_approx || null,
        tbr: f.tbr || null,
        quality: hasVideo ? classifyQuality(f.height, f.width) : "Audio",
        hasVideo,
        hasAudio,
        isHdr,
      };
    });
}

// ─── Retry Delay Calculator (from Arroxy) ────────────────────
function getRetryDelay(attempt: number, signal: StderrSignal): number {
  if (signal === 'rateLimit') return 5000 + attempt * 2000; // 5s, 7s, 9s
  if (signal === 'botBlock') return 1000 + attempt * 1000;  // 1s, 2s, 3s
  return 1000; // Default 1s
}

// ─── getVideoInfo with Arroxy-style Retry Ladder ─────────────
export async function getVideoInfo(
  url: string,
  opts?: DownloadOptions
): Promise<VideoInfo> {
  // Sanitize URL (strip tracking params, unwrap redirects)
  const cleanUrl = sanitizeUrl(url);
  const isYT = isYouTubeUrl(cleanUrl);
  let lastError = "";
  let lastSignal: StderrSignal = null;

  for (let attempt = 0; attempt < (isYT ? MAX_RETRY_ATTEMPTS : 1); attempt++) {
    // Rate limit YouTube requests
    if (isYT) {
      await ytRateLimiter.acquire();
    }

    try {
      const args = [
        ...baseArgs(opts),
        "--dump-json",
        "--no-playlist",
        "--skip-download",
      ];

      // Arroxy-style: use deterministic player client ladder
      if (isYT) {
        const extractorArgs = getExtractorArgsForAttempt(attempt);
        if (extractorArgs) {
          args.push("--extractor-args", extractorArgs);
        }
      }

      args.push(cleanUrl);

      const { stdout } = await execFileAsync("yt-dlp", args, {
        timeout: 45000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const data = JSON.parse(stdout);

      return {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        duration: data.duration || 0,
        durationString: formatDuration(data.duration || 0),
        uploader: data.uploader || data.channel || "Unknown",
        viewCount: data.view_count || 0,
        uploadDate: data.upload_date || "",
        description: (data.description || "").slice(0, 300),
        formats: parseFormats(data),
        isPlaylist: false,
      };
    } catch (err: any) {
      const stderr = err.stderr || err.message || "";
      lastError = stderr;

      // Classify the error using Arroxy's signal system
      lastSignal = classifyStderr(stderr);

      if (lastSignal === 'rateLimit') {
        trackRateLimit();
      }

      // Determine if we should retry (Arroxy's logic)
      const isRetryable =
        isYT &&
        attempt < MAX_RETRY_ATTEMPTS - 1 &&
        (lastSignal === 'botBlock' ||
          lastSignal === 'rateLimit' ||
          lastSignal === 'nsig' ||
          lastSignal === 'formatUnavailable');

      if (isRetryable) {
        const delay = getRetryDelay(attempt, lastSignal);
        console.warn(
          `[yt-dlp] info attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} failed (${lastSignal}), retrying in ${delay}ms with next player client`
        );
        await sleep(delay);
        continue;
      }

      // Not retryable — throw immediately
      const error = new Error(err.message || "yt-dlp failed");
      (error as any).stderr = lastError;
      (error as any).code = err.code;
      (error as any).signal = lastSignal;
      throw error;
    } finally {
      if (isYT) {
        ytRateLimiter.release();
      }
    }
  }

  // All attempts exhausted
  const error = new Error("yt-dlp failed after all retry attempts");
  (error as any).stderr = lastError;
  (error as any).signal = lastSignal;
  throw error;
}

// ─── getPlaylistInfo with Rate Limiting ──────────────────────
export async function getPlaylistInfo(
  url: string,
  opts?: DownloadOptions
): Promise<VideoInfo> {
  const cleanUrl = sanitizeUrl(url);
  const isYT = isYouTubeUrl(cleanUrl);

  if (isYT) {
    await ytRateLimiter.acquire();
  }

  try {
    const args = [
      ...baseArgs(opts),
      "--dump-json",
      "--flat-playlist",
      "--retries",
      "3",
      "--extractor-retries",
      "3",
    ];

    // Use Arroxy's fallback client for playlists (most reliable)
    if (isYT) {
      args.push("--extractor-args", PLAYER_CLIENT_FALLBACK);
    }

    args.push(cleanUrl);

    const { stdout } = await execFileAsync("yt-dlp", args, {
      timeout: 120000,
      maxBuffer: 50 * 1024 * 1024,
    });

    const lines = stdout.trim().split("\n");
    const entries: PlaylistEntry[] = lines.map((line) => {
      const d = JSON.parse(line);
      return {
        id: d.id,
        title: d.title || "Untitled",
        thumbnail: d.thumbnails?.[0]?.url || "",
        duration: d.duration || 0,
        durationString: formatDuration(d.duration || 0),
        url:
          d.url ||
          d.webpage_url ||
          `https://www.youtube.com/watch?v=${d.id}`,
      };
    });

    return {
      id: "playlist",
      title: `Playlist (${entries.length} videos)`,
      thumbnail: entries[0]?.thumbnail || "",
      duration: 0,
      durationString: "",
      uploader: "",
      viewCount: 0,
      uploadDate: "",
      description: "",
      formats: [],
      isPlaylist: true,
      playlistCount: entries.length,
      playlistEntries: entries,
    };
  } catch (err: any) {
    const stderr = (err.stderr || "").toLowerCase();
    if (stderr.includes("http error 429")) {
      trackRateLimit();
    }
    const error = new Error(err.message || "yt-dlp failed");
    (error as any).stderr = err.stderr || err.message || "";
    (error as any).code = err.code;
    throw error;
  } finally {
    if (isYT) {
      ytRateLimiter.release();
    }
  }
}

// ─── Download with Arroxy-style 3-Attempt Retry Ladder ───────
export function buildDownloadArgs(
  url: string,
  formatId?: string,
  audioOnly?: boolean,
  opts?: DownloadOptions
): string[] {
  const cleanUrl = sanitizeUrl(url);
  const args = baseArgs(opts);

  // Adaptive fragment count based on rate limit history
  const frags = getRateLimitCount() >= 2 ? 2 : getRateLimitCount() > 0 ? 4 : 8;
  args.push("-N", String(frags));

  if (isYouTubeUrl(cleanUrl)) {
    // Use Arroxy's primary strategy: skip PoT-demanding clients
    args.push("--extractor-args", PLAYER_CLIENT_FALLBACK);
    args.push("--throttled-rate", "100K");
  }

  if (audioOnly) {
    args.push("-f", "bestaudio");
    args.push(
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0"
    );
  } else if (formatId) {
    args.push("-f", `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best`);
    args.push("--merge-output-format", "mp4");
  } else {
    args.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best");
    args.push("--merge-output-format", "mp4");
  }

  // SponsorBlock support (from Arroxy)
  if (opts?.sponsorBlock && isYouTubeUrl(cleanUrl)) {
    const categories = "sponsor,selfpromo,interaction,intro,outro";
    if (opts.sponsorBlock === "remove") {
      args.push("--sponsorblock-remove", categories);
    } else {
      args.push("--sponsorblock-mark", categories);
    }
  }

  args.push("-o", "-", cleanUrl);
  return args;
}

/**
 * Spawn yt-dlp download with Arroxy-inspired 3-attempt retry ladder.
 *
 * Retry strategy (from Arroxy):
 *   Attempt 0: player_client=default,-web,-web_safari (skip PoT clients)
 *   Attempt 1: player_client=ios,web_creator (alternative)
 *   Attempt 2: player_client=mweb,android (mobile fallback)
 *
 * Only retries on bot-block, 429, or nsig errors.
 */
export function spawnDownloadWithRetry(
  url: string,
  formatId?: string,
  audioOnly?: boolean,
  opts?: DownloadOptions
): { stream: ReadableStream<Uint8Array>; abort: () => void } {
  const cleanUrl = sanitizeUrl(url);
  const isYT = isYouTubeUrl(cleanUrl);
  let currentAttempt = 0;
  let currentProc: ReturnType<typeof spawn> | null = null;
  let aborted = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      function tryDownload() {
        if (aborted) {
          controller.close();
          return;
        }

        const args = baseArgs(opts);

        // Adaptive fragment count
        const frags =
          getRateLimitCount() >= 2
            ? 2
            : getRateLimitCount() > 0
              ? 4
              : 8;
        args.push("-N", String(frags));

        // Arroxy-style deterministic player client ladder
        if (isYT) {
          const extractorArgs = getExtractorArgsForAttempt(currentAttempt);
          if (extractorArgs) {
            args.push("--extractor-args", extractorArgs);
          }
          args.push("--throttled-rate", "100K");
        }

        if (audioOnly) {
          args.push("-f", "bestaudio");
          args.push(
            "--extract-audio",
            "--audio-format",
            "mp3",
            "--audio-quality",
            "0"
          );
        } else if (formatId) {
          args.push("-f", `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best`);
          args.push("--merge-output-format", "mp4");
        } else {
          args.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best");
          args.push("--merge-output-format", "mp4");
        }

        // SponsorBlock support (from Arroxy)
        if (opts?.sponsorBlock && isYT) {
          const categories = "sponsor,selfpromo,interaction,intro,outro";
          if (opts.sponsorBlock === "remove") {
            args.push("--sponsorblock-remove", categories);
          } else {
            args.push("--sponsorblock-mark", categories);
          }
        }

        args.push("-o", "-", cleanUrl);

        const proc = spawn("yt-dlp", args);
        currentProc = proc;
        let hasData = false;
        let stderrBuf = "";

        proc.stdout.on("data", (chunk: Buffer) => {
          hasData = true;
          controller.enqueue(new Uint8Array(chunk));
        });

        proc.stderr.on("data", (data: Buffer) => {
          stderrBuf += data.toString();
        });

        proc.on("close", (code) => {
          if (aborted) return;

          if (code === 0 || hasData) {
            controller.close();
            return;
          }

          // Classify error using Arroxy's signal system
          const signal = classifyStderr(stderrBuf);

          if (signal === 'rateLimit') {
            trackRateLimit();
          }

          // Arroxy-style retry: only on bot-block, rate-limit, or nsig
          const isRetryable =
            isYT &&
            currentAttempt < MAX_RETRY_ATTEMPTS - 1 &&
            (signal === 'botBlock' ||
              signal === 'rateLimit' ||
              signal === 'nsig');

          if (isRetryable) {
            currentAttempt++;
            const delay = getRetryDelay(currentAttempt - 1, signal);
            console.warn(
              `[yt-dlp] download attempt ${currentAttempt}/${MAX_RETRY_ATTEMPTS} failed (${signal}), retrying in ${delay}ms`
            );
            setTimeout(tryDownload, delay);
          } else {
            console.error(`yt-dlp failed (code ${code}, signal: ${signal}):`, stderrBuf.slice(-500));
            controller.close();
          }
        });

        proc.on("error", (err) => {
          console.error("yt-dlp process error:", err);
          controller.error(err);
        });
      }

      tryDownload();
    },
    cancel() {
      aborted = true;
      if (currentProc) {
        currentProc.kill("SIGTERM");
      }
    },
  });

  return {
    stream,
    abort: () => {
      aborted = true;
      if (currentProc) {
        currentProc.kill("SIGTERM");
      }
    },
  };
}

// ─── yt-dlp Auto-Update ──────────────────────────────────────
let lastUpdateCheck = 0;
const UPDATE_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours

export async function ensureYtdlpFresh(): Promise<void> {
  const now = Date.now();
  if (now - lastUpdateCheck < UPDATE_INTERVAL) return;
  lastUpdateCheck = now;

  try {
    // Check binary age
    const ytdlpPath = "/usr/local/bin/yt-dlp";
    if (!existsSync(ytdlpPath)) return;

    const stat = statSync(ytdlpPath);
    const ageMs = now - stat.mtimeMs;
    const twoDays = 2 * 24 * 60 * 60 * 1000;

    if (ageMs < twoDays) return;

    console.log("[yt-dlp] Binary older than 2 days, updating in background...");

    // Update in background — don't block requests
    execFileAsync("yt-dlp", ["--update-to", "nightly"], { timeout: 60000 })
      .then(({ stdout }) => {
        if (stdout.includes("Updated") || stdout.includes("Updating")) {
          console.log("[yt-dlp] Updated successfully");
        }
      })
      .catch((err) => {
        console.warn("[yt-dlp] Update failed:", err.message);
      });
  } catch {
    // Ignore update check errors
  }
}

export { formatFileSize, formatDuration, isYouTubeUrl, getRateLimitCount };
