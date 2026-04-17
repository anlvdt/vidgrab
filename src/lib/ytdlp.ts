import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { existsSync, statSync } from "fs";
import { join } from "path";

const execFileAsync = promisify(execFile);

// ─── Constants ───────────────────────────────────────────────
const COOKIES_PATH = join(process.cwd(), "cookies.txt");
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** YouTube player clients to rotate through on failure */
const YT_PLAYER_CLIENTS = [
  undefined, // default (no --extractor-args)
  "youtube:player_client=default,mweb",
  "youtube:player_client=ios",
];

// ─── Rate Limiter (inspired by OmniGet) ─────────────────────
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

  args.push("--retries", "3");
  args.push("--extractor-retries", "2");
  args.push("--socket-timeout", "15");
  args.push("--user-agent", CHROME_UA);
  args.push("--referer", "https://www.google.com/");
  args.push("--no-check-certificates");

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

// ─── getVideoInfo with Player Client Rotation & Rate Limiting ─
export async function getVideoInfo(
  url: string,
  opts?: DownloadOptions
): Promise<VideoInfo> {
  const isYT = isYouTubeUrl(url);
  const clients = isYT ? YT_PLAYER_CLIENTS : [undefined];
  let lastError = "";

  for (let attempt = 0; attempt < clients.length; attempt++) {
    const client = clients[attempt];

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

      if (client) {
        args.push("--extractor-args", client);
      }

      args.push(url);

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
      const stderr = (err.stderr || err.message || "").toLowerCase();
      lastError = err.stderr || err.message || "";

      if (stderr.includes("http error 429")) {
        trackRateLimit();
      }

      // Determine if we should retry with next player client
      const isRetryable =
        isYT &&
        attempt < clients.length - 1 &&
        (stderr.includes("requested format") ||
          stderr.includes("not available") ||
          stderr.includes("http error 403") ||
          stderr.includes("http error 429") ||
          stderr.includes("nsig"));

      if (isRetryable) {
        console.warn(
          `[yt-dlp] info attempt ${attempt + 1}/${clients.length} failed, retrying with next player client`
        );
        // Wait before retry on 429
        if (stderr.includes("http error 429")) {
          await sleep(5000);
        }
        continue;
      }

      // Not retryable — throw immediately
      const error = new Error(err.message || "yt-dlp failed");
      (error as any).stderr = lastError;
      (error as any).code = err.code;
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
  throw error;
}

// ─── getPlaylistInfo with Rate Limiting ──────────────────────
export async function getPlaylistInfo(
  url: string,
  opts?: DownloadOptions
): Promise<VideoInfo> {
  const isYT = isYouTubeUrl(url);

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

    if (isYT) {
      args.push("--extractor-args", "youtube:player_client=default");
    }

    args.push(url);

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

// ─── Download with Retry & Player Client Rotation ────────────
export function buildDownloadArgs(
  url: string,
  formatId?: string,
  audioOnly?: boolean,
  opts?: DownloadOptions
): string[] {
  const args = baseArgs(opts);

  // Add concurrent fragment downloading
  const frags = getRateLimitCount() >= 2 ? 2 : getRateLimitCount() > 0 ? 4 : 8;
  args.push("-N", String(frags));

  if (isYouTubeUrl(url)) {
    args.push("--extractor-args", "youtube:player_client=default");
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
    // Prefer m4a audio for better mpegts compatibility when piping to stdout
    args.push("-f", `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best`);
    args.push("--merge-output-format", "mp4");
  } else {
    // Prefer h264+aac (mp4+m4a) for best mpegts pipe compatibility
    // vp9/opus in mpegts is poorly supported by browsers
    args.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best");
    args.push("--merge-output-format", "mp4");
  }

  args.push("-o", "-", url);
  return args;
}

/**
 * Spawn yt-dlp download with automatic retry on failure.
 * Rotates player clients for YouTube on 429/403/nsig errors.
 * Returns a ReadableStream for streaming to client.
 */
export function spawnDownloadWithRetry(
  url: string,
  formatId?: string,
  audioOnly?: boolean,
  opts?: DownloadOptions
): { stream: ReadableStream<Uint8Array>; abort: () => void } {
  const isYT = isYouTubeUrl(url);
  const maxAttempts = isYT ? 3 : 1;
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
        const frags =
          getRateLimitCount() >= 2
            ? 2
            : getRateLimitCount() > 0
              ? 4
              : 8;
        args.push("-N", String(frags));

        // Rotate player client on retry
        if (isYT) {
          const clientIdx = Math.min(
            currentAttempt,
            YT_PLAYER_CLIENTS.length - 1
          );
          const client = YT_PLAYER_CLIENTS[clientIdx];
          if (client) {
            args.push("--extractor-args", client);
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

        args.push("-o", "-", url);

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

          // Check if retryable
          const stderrLower = stderrBuf.toLowerCase();
          if (stderrLower.includes("http error 429")) {
            trackRateLimit();
          }

          const isRetryable =
            isYT &&
            currentAttempt < maxAttempts - 1 &&
            (stderrLower.includes("http error 429") ||
              stderrLower.includes("http error 403") ||
              stderrLower.includes("nsig") ||
              stderrLower.includes("requested format") ||
              stderrLower.includes("not available"));

          if (isRetryable) {
            currentAttempt++;
            console.warn(
              `[yt-dlp] download attempt ${currentAttempt}/${maxAttempts} failed, retrying...`
            );
            const waitMs = stderrLower.includes("429") ? 5000 : 1000;
            setTimeout(tryDownload, waitMs);
          } else {
            console.error(`yt-dlp failed (code ${code}):`, stderrBuf.slice(-500));
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
