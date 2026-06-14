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
/* eslint-disable @typescript-eslint/no-explicit-any -- yt-dlp JSON and child-process errors are validated at their use sites. */

import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { sanitizeUrl } from "./url-sanitizer";
import {
  getExtractorArgsForAttempt,
  classifyStderr,
  extractLastError,
  withPotProvider,
  defaultPlayerClient,
  type StderrSignal,
} from "./po-token";

const execFileAsync = promisify(execFile);

// ─── Constants ───────────────────────────────────────────────
const COOKIES_PATH = process.env.VIDGRAB_COOKIES_PATH;
const YTDLP_BIN = process.env.YTDLP_PATH || "yt-dlp";
const FFMPEG_PATH = process.env.FFMPEG_PATH;
// Standalone ffmpeg binary for the audio-only transcode pipe. FFMPEG_PATH is a
// *location* passed to yt-dlp's --ffmpeg-location (may be a dir or a binary);
// FFMPEG_BIN is what we exec directly. Default to PATH lookup.
const FFMPEG_BIN =
  process.env.FFMPEG_BIN ||
  (FFMPEG_PATH && /ffmpeg$/.test(FFMPEG_PATH) ? FFMPEG_PATH : "ffmpeg");
// bgutil PO-token provider sidecar base URL (e.g. http://bgutil-pot:4416).
// When set, merged into every youtube: extractor-arg so the yt-dlp plugin can
// mint Proof-of-Origin tokens. See withPotProvider() for why it must be merged
// rather than passed as a separate --extractor-args flag.
const POT_BASE_URL = process.env.BGUTIL_POT_BASE_URL;
// Whether a PO-token provider is configured — selects the format-rich client
// ladder (tv,web_safari) over the token-free one (android_vr).
const HAS_POT = !!POT_BASE_URL;
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

/**
 * Deterministic 3-attempt retry ladder for YouTube player clients. The exact
 * clients are PoT-aware and live in po-token.ts (getExtractorArgsForAttempt):
 * lead with android_vr when no PO-token provider is configured, or with
 * tv,web_safari when one is. Each attempt rotates to a different client family.
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

  if (opts?.cookies !== false && COOKIES_PATH) {
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
  args.push("--force-ipv4");
  args.push("--geo-bypass");

  if (FFMPEG_PATH) {
    args.push("--ffmpeg-location", FFMPEG_PATH);
  }

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
      const width = Number(f.width) || null;
      const height = Number(f.height) || null;
      const videoExt = f.video_ext || "";
      const audioExt = f.audio_ext || "";
      const hasVideo =
        (f.vcodec !== "none" && !!f.vcodec) ||
        !!width ||
        !!height ||
        (!!videoExt && videoExt !== "none");
      const hasAudio =
        (f.acodec !== "none" && !!f.acodec) ||
        (!!audioExt && audioExt !== "none") ||
        !!f.abr ||
        !!f.asr;
      const resolution = hasVideo
        ? `${width || "?"}x${height || "?"}`
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
        quality: hasVideo ? classifyQuality(height, width) : "Audio",
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

      // PoT-aware deterministic player-client ladder
      if (isYT) {
        const extractorArgs = getExtractorArgsForAttempt(attempt, HAS_POT);
        args.push("--extractor-args", withPotProvider(extractorArgs, POT_BASE_URL));
      }

      args.push(cleanUrl);

      const { stdout } = await execFileAsync(YTDLP_BIN, args, {
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

    // Lead client for playlists (PoT-aware)
    if (isYT) {
      args.push("--extractor-args", withPotProvider(defaultPlayerClient(HAS_POT), POT_BASE_URL));
    }

    args.push(cleanUrl);

    const { stdout } = await execFileAsync(YTDLP_BIN, args, {
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
    args.push("--extractor-args", withPotProvider(defaultPlayerClient(HAS_POT), POT_BASE_URL));
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

/** Error raised when a download fails before any bytes are produced. */
export interface DownloadFailure extends Error {
  stderr: string;
  signal: StderrSignal;
  code: number | null;
  /** True if bytes were already streamed when the failure occurred. */
  midStream: boolean;
}

export interface DownloadStream {
  stream: ReadableStream<Uint8Array>;
  /**
   * Resolves once the first byte of a successful download has been produced
   * (safe to commit an HTTP 200 + stream). Rejects with a {@link DownloadFailure}
   * if yt-dlp terminally fails *before* producing any bytes — letting the caller
   * return a proper error status or trigger a fallback instead of streaming an
   * empty/corrupt file.
   */
  firstByte: Promise<void>;
  abort: () => void;
}

/**
 * Spawn yt-dlp download with a PoT-aware 3-attempt retry ladder.
 *
 * Retry strategy (see po-token.ts for the exact client ladders):
 *   Without a PO-token provider: android_vr → tv → mweb
 *   With a PO-token provider:     tv,web_safari → mweb → android_vr
 *
 * Only retries on bot-block, 429, or nsig errors — and only *before* any bytes
 * have been streamed (retrying mid-stream would corrupt the output).
 *
 * Reliability guarantees (vs. the previous implementation):
 *   - Success is `exit code 0` ONLY. A non-zero exit after partial output is
 *     surfaced as a stream error so the browser marks the download as failed,
 *     instead of silently delivering a truncated file.
 *   - Pre-data terminal failures reject `firstByte` so the route can fall back
 *     (e.g. Cobalt) or return a real HTTP error.
 *   - `progressive` formats (already containing audio) are downloaded as-is,
 *     and an explicit `formatId` never silently downgrades to a different
 *     quality — it downloads exactly what the user picked or errors.
 */
export function spawnDownloadWithRetry(
  url: string,
  formatId?: string,
  audioOnly?: boolean,
  opts?: DownloadOptions & { progressive?: boolean }
): DownloadStream {
  const cleanUrl = sanitizeUrl(url);
  const isYT = isYouTubeUrl(cleanUrl);
  let currentAttempt = 0;
  let currentProc: ReturnType<typeof spawn> | null = null;
  let currentTranscoder: ReturnType<typeof spawn> | null = null;
  let aborted = false;
  let firstByteSeen = false;
  let controllerSettled = false;

  let resolveFirstByte!: () => void;
  let rejectFirstByte!: (err: DownloadFailure) => void;
  let firstByteSettled = false;
  const firstByte = new Promise<void>((resolve, reject) => {
    resolveFirstByte = () => {
      if (firstByteSettled) return;
      firstByteSettled = true;
      resolve();
    };
    rejectFirstByte = (err) => {
      if (firstByteSettled) return;
      firstByteSettled = true;
      reject(err);
    };
  });

  const makeFailure = (
    msg: string,
    stderr: string,
    signal: StderrSignal,
    code: number | null,
    midStream: boolean
  ): DownloadFailure => {
    const err = new Error(msg) as DownloadFailure;
    err.stderr = stderr;
    err.signal = signal;
    err.code = code;
    err.midStream = midStream;
    return err;
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // The download and (for audio) the ffmpeg transcoder are two processes;
      // either can try to terminate the stream. Guard so we close/error the
      // controller exactly once.
      const closeController = () => {
        if (controllerSettled) return;
        controllerSettled = true;
        controller.close();
      };
      const errorController = (failure: DownloadFailure) => {
        if (controllerSettled) return;
        controllerSettled = true;
        controller.error(failure);
      };
      const killTranscoder = () => {
        if (currentTranscoder) {
          try { currentTranscoder.kill("SIGKILL"); } catch { /* already gone */ }
          currentTranscoder = null;
        }
      };

      function tryDownload() {
        if (aborted) {
          closeController();
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
        // Recover from transient fragment/network drops mid-stream instead of
        // delivering a truncated file.
        args.push("--fragment-retries", "10");

        // PoT-aware deterministic player-client ladder
        if (isYT) {
          const extractorArgs = getExtractorArgsForAttempt(currentAttempt, HAS_POT);
          args.push("--extractor-args", withPotProvider(extractorArgs, POT_BASE_URL));
          args.push("--throttled-rate", "100K");
        }

        if (audioOnly) {
          // Just fetch the raw best audio; we transcode to MP3 through an
          // ffmpeg pipe below. yt-dlp's --extract-audio postprocessor is a
          // silent no-op when output goes to stdout (-o -), so it would
          // otherwise stream raw Opus/WebM mislabeled as MP3.
          args.push("-f", "bestaudio/best");
        } else if (formatId) {
          if (opts?.progressive) {
            // Format already carries audio — download exactly it, no merge.
            args.push("-f", formatId);
          } else {
            // Video-only stream → merge with best AAC audio. AAC (mp4a) is
            // mandatory: merging to a stdout pipe yields MPEG-TS (mp4 needs
            // seekable output), and TS only carries AAC cleanly. No `/best`
            // fallback: we deliver the requested quality or surface an error,
            // never a silently different resolution.
            args.push("-f", `${formatId}+bestaudio[acodec^=mp4a]/${formatId}+bestaudio[ext=m4a]`);
            args.push("--merge-output-format", "mp4");
          }
        } else {
          // Prefer H.264 (avc1) + AAC. yt-dlp ignores --merge-output-format on a
          // stdout pipe and always muxes to MPEG-TS, which can ONLY carry
          // H.264/AAC — VP9/AV01 get muxed as an undecodable "private data"
          // stream. `[ext=mp4]` alone is unsafe now that AV01 ships in mp4 and
          // outranks avc1 on resolution, so pin the codec explicitly.
          args.push(
            "-f",
            "bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[ext=mp4][vcodec^=avc1]/best[ext=mp4]/best"
          );
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

        const proc = spawn(YTDLP_BIN, args);
        currentProc = proc;
        let stderrBuf = "";

        // For audio downloads we transcode yt-dlp's raw best-audio stream to a
        // real MP3 through ffmpeg (yt-dlp's own --extract-audio is a no-op on a
        // stdout pipe). The deliverable bytes — and hence firstByte — come from
        // ffmpeg's stdout, not yt-dlp's. For video, yt-dlp's stdout is served
        // directly as before.
        if (audioOnly) {
          const transcoder = spawn(FFMPEG_BIN, [
            "-loglevel", "error",
            "-i", "pipe:0",
            "-vn",
            "-codec:a", "libmp3lame",
            "-q:a", "2", // VBR ~190 kbps, transparent quality
            "-f", "mp3",
            "pipe:1",
          ]);
          currentTranscoder = transcoder;

          proc.stdout.pipe(transcoder.stdin);
          // yt-dlp dying before ffmpeg drains its input yields EPIPE here; the
          // real failure is surfaced via yt-dlp's close handler, so swallow it.
          transcoder.stdin.on("error", () => {});

          transcoder.stdout.on("data", (chunk: Buffer) => {
            firstByteSeen = true;
            resolveFirstByte();
            controller.enqueue(new Uint8Array(chunk));
          });
          transcoder.on("error", (err) => {
            const failure = makeFailure(
              err.message || "ffmpeg transcode error",
              err.message || "",
              firstByteSeen ? null : "networkError",
              null,
              firstByteSeen
            );
            rejectFirstByte(failure);
            errorController(failure);
          });
          transcoder.on("close", (tcode) => {
            if (aborted) return;
            currentTranscoder = null;
            if (tcode === 0) {
              closeController();
            } else if (firstByteSeen) {
              // Transcode died after bytes shipped — can't recover a partial.
              errorController(
                makeFailure(`Transcode interrupted (code ${tcode})`, "", null, tcode, true)
              );
            }
            // Pre-byte ffmpeg failure: let yt-dlp's close handler drive retry.
          });
        } else {
          proc.stdout.on("data", (chunk: Buffer) => {
            firstByteSeen = true;
            resolveFirstByte();
            controller.enqueue(new Uint8Array(chunk));
          });
        }

        proc.stderr.on("data", (data: Buffer) => {
          stderrBuf += data.toString();
        });

        proc.on("close", (code) => {
          if (aborted) return;

          // Success is exit code 0 only. For audio, yt-dlp finishing just means
          // it's done feeding ffmpeg — the transcoder's close handler closes the
          // controller once the MP3 is fully flushed.
          if (code === 0) {
            if (!audioOnly) closeController();
            return;
          }

          // yt-dlp failed — tear down the transcoder so it doesn't emit a
          // truncated MP3 or linger.
          killTranscoder();

          const signal = classifyStderr(stderrBuf);
          if (signal === 'rateLimit') {
            trackRateLimit();
          }

          // Once bytes have streamed we cannot retry (output would corrupt) and
          // cannot change the HTTP status — surface the failure so the browser
          // aborts the partial download rather than keeping a truncated file.
          if (firstByteSeen) {
            console.error(`yt-dlp failed mid-stream (code ${code}, signal: ${signal}):`, stderrBuf.slice(-500));
            errorController(
              makeFailure(`Download interrupted (code ${code})`, stderrBuf, signal, code, true)
            );
            return;
          }

          // Retry on bot-block, rate-limit, nsig — and formatUnavailable, since
          // rotating the player client can expose a format the first client
          // didn't list. Only before any bytes were produced.
          const isRetryable =
            isYT &&
            currentAttempt < MAX_RETRY_ATTEMPTS - 1 &&
            (signal === 'botBlock' ||
              signal === 'rateLimit' ||
              signal === 'nsig' ||
              signal === 'formatUnavailable');

          if (isRetryable) {
            currentAttempt++;
            const delay = getRetryDelay(currentAttempt - 1, signal);
            console.warn(
              `[yt-dlp] download attempt ${currentAttempt}/${MAX_RETRY_ATTEMPTS} failed (${signal}), retrying in ${delay}ms`
            );
            setTimeout(tryDownload, delay);
          } else {
            console.error(`yt-dlp failed (code ${code}, signal: ${signal}):`, stderrBuf.slice(-500));
            const failure = makeFailure(
              extractLastError(stderrBuf) || `Download failed (code ${code})`,
              stderrBuf,
              signal,
              code,
              false
            );
            rejectFirstByte(failure);
            errorController(failure);
          }
        });

        proc.on("error", (err) => {
          console.error("yt-dlp process error:", err);
          killTranscoder();
          const failure = makeFailure(
            err.message || "yt-dlp process error",
            (err as { message?: string }).message || "",
            firstByteSeen ? null : 'networkError',
            null,
            firstByteSeen
          );
          rejectFirstByte(failure);
          errorController(failure);
        });
      }

      tryDownload();
    },
    cancel() {
      aborted = true;
      if (currentProc) currentProc.kill("SIGTERM");
      if (currentTranscoder) currentTranscoder.kill("SIGKILL");
    },
  });

  return {
    stream,
    firstByte,
    abort: () => {
      aborted = true;
      if (currentProc) currentProc.kill("SIGTERM");
      if (currentTranscoder) currentTranscoder.kill("SIGKILL");
    },
  };
}

// yt-dlp is pinned in the image. Updates happen through reviewed deploys.
export async function ensureYtdlpFresh(): Promise<void> {}

export { formatFileSize, formatDuration, isYouTubeUrl, getRateLimitCount };
