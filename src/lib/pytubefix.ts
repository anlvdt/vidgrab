/**
 * pytubefix — secondary YouTube extraction engine (fallback after yt-dlp).
 *
 * pytubefix and yt-dlp break on different YouTube changes, so pytubefix often
 * succeeds when yt-dlp is bot-blocked or its signature solver is stale, and
 * vice versa. This module shells out to `scripts/pytubefix_helper.py`, which
 * returns signed googlevideo stream URLs, then proxies/muxes those URLs with
 * ffmpeg to deliver a download.
 *
 * Format IDs from this engine are prefixed `pf-<itag>` so the download route
 * can tell which engine to use and strip the prefix back to a pytubefix itag.
 *
 * Quality note: pytubefix is a *fallback*. It picks the requested itag when
 * the info also came from pytubefix; otherwise (e.g. yt-dlp extracted the info
 * but its download failed) it delivers the best available video+audio. yt-dlp
 * remains the primary path for exact quality selection.
 */
import { spawn, execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import { sanitizeUrl } from "./url-sanitizer";
import { classifyStderr } from "./po-token";
import { pythonEnv, resolveFfmpegBin, resolvePythonBin } from "./runtime-paths";
import {
  isPytubefixFormat,
  pytubefixFormatId,
  PYTUBEFIX_FORMAT_PREFIX,
} from "./pytubefix-format";
import type { VideoFormat, VideoInfo, DownloadFailure, DownloadStream } from "./ytdlp";

const execFileAsync = promisify(execFile);

const PYTHON_BIN = resolvePythonBin();
const FFMPEG_BIN = resolveFfmpegBin();
const DEFAULT_HELPER_PATH = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "scripts",
  "pytubefix_helper.py"
);
const HELPER_PATH = process.env.PYTUBEFIX_HELPER_PATH || DEFAULT_HELPER_PATH;

// ─── Raw helper output shapes ────────────────────────────────
interface RawFormat {
  itag: number;
  ext: string;
  resolution: string;
  fps: number | null;
  vcodec: string;
  acodec: string;
  abr: number | null;
  tbr: number | null;
  is_progressive: boolean;
  has_video: boolean;
  has_audio: boolean;
  filesize: number | null;
  url: string;
}

interface RawInfo {
  ok: boolean;
  client: string;
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
  views: number;
  formats: RawFormat[];
}

// ─── Small local formatters (mirrors ytdlp.ts conventions) ───
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function classifyQuality(resolution: string): string {
  const h = parseInt(resolution, 10) || 0;
  if (h >= 4320) return "8K";
  if (h >= 2160) return "4K";
  if (h >= 1440) return "1440p";
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  if (h >= 360) return "360p";
  if (h >= 240) return "240p";
  if (resolution) return "144p";
  return "Audio";
}

// ─── Extraction ──────────────────────────────────────────────
async function extract(url: string): Promise<RawInfo> {
  const { stdout } = await execFileAsync(
    PYTHON_BIN,
    [HELPER_PATH, "info", sanitizeUrl(url)],
    { env: pythonEnv(), maxBuffer: 8 * 1024 * 1024, timeout: 45_000 }
  );
  const data = JSON.parse(stdout) as RawInfo;
  if (!data.ok || !data.formats?.length) {
    throw new Error("pytubefix returned no formats");
  }
  return data;
}

/**
 * Get video info via pytubefix, mapped to the same {@link VideoInfo} shape the
 * UI consumes from yt-dlp. Throws if extraction fails (caller falls through).
 */
export async function getPytubefixInfo(url: string): Promise<VideoInfo> {
  const data = await extract(url);

  const formats: VideoFormat[] = data.formats.map((f) => ({
    formatId: pytubefixFormatId(f.itag),
    ext: f.ext || (f.has_video ? "mp4" : "m4a"),
    resolution: f.resolution || (f.has_audio && !f.has_video ? "audio" : ""),
    fps: f.fps ?? null,
    vcodec: f.vcodec || "none",
    acodec: f.acodec || "none",
    filesize: f.filesize ?? null,
    filesizeApprox: f.filesize ?? null,
    tbr: f.abr ?? (f.tbr ? Math.round(f.tbr / 1000) : null),
    quality: f.has_video ? classifyQuality(f.resolution) : "Audio",
    hasVideo: f.has_video,
    hasAudio: f.has_audio,
    isHdr: false,
  }));

  // Surface the most useful formats first: progressive + high-res video, then audio.
  formats.sort((a, b) => {
    const ra = parseInt(a.resolution, 10) || 0;
    const rb = parseInt(b.resolution, 10) || 0;
    return rb - ra;
  });

  return {
    id: "pytubefix",
    title: data.title || "Video",
    thumbnail: data.thumbnail || "",
    duration: data.duration || 0,
    durationString: formatDuration(data.duration || 0),
    uploader: data.author || "",
    viewCount: data.views || 0,
    uploadDate: "",
    description: "",
    formats,
    isPlaylist: false,
  };
}

// ─── Stream selection ────────────────────────────────────────
/** AAC/m4a muxes cleanly into MPEG-TS; opus-in-mpegts is non-standard and some
 *  players reject it. Prefer AAC, then highest bitrate. */
function audioRank(f: RawFormat): number {
  const isAac = /mp4|m4a/i.test(f.ext) || /aac/i.test(f.acodec);
  return (isAac ? 1_000_000 : 0) + (f.abr ?? 0);
}

function bestAudio(formats: RawFormat[]): RawFormat | undefined {
  return formats
    .filter((f) => f.has_audio && !f.has_video)
    .sort((a, b) => audioRank(b) - audioRank(a))[0]
    // Fall back to any stream that carries audio (progressive) if no audio-only.
    ?? formats.filter((f) => f.has_audio).sort((a, b) => audioRank(b) - audioRank(a))[0];
}

function bestVideoOnly(formats: RawFormat[]): RawFormat | undefined {
  return formats
    .filter((f) => f.has_video && !f.has_audio)
    .sort((a, b) => (parseInt(b.resolution, 10) || 0) - (parseInt(a.resolution, 10) || 0))[0];
}

function bestProgressive(formats: RawFormat[]): RawFormat | undefined {
  return formats
    .filter((f) => f.is_progressive)
    .sort((a, b) => (parseInt(b.resolution, 10) || 0) - (parseInt(a.resolution, 10) || 0))[0];
}

/** Resilient HTTP options for ffmpeg reading googlevideo URLs. */
const FFMPEG_INPUT_OPTS = [
  "-reconnect", "1",
  "-reconnect_streamed", "1",
  "-reconnect_delay_max", "5",
];

interface PlannedFfmpeg {
  args: string[];
  label: string;
}

/**
 * Decide the ffmpeg invocation. Returns args that read the signed URL(s) and
 * write to stdout: mpegts for video (pipe-safe, like yt-dlp's merge output),
 * mp3 for audio-only.
 */
function planFfmpeg(
  data: RawInfo,
  formatId: string | undefined,
  audioOnly: boolean
): PlannedFfmpeg {
  const formats = data.formats;

  if (audioOnly) {
    const a = bestAudio(formats);
    if (!a) throw new Error("pytubefix: no audio stream");
    return {
      label: `audio itag ${a.itag}`,
      args: [
        "-hide_banner", "-loglevel", "error",
        ...FFMPEG_INPUT_OPTS, "-i", a.url,
        "-vn", "-c:a", "libmp3lame", "-q:a", "2",
        "-f", "mp3", "pipe:1",
      ],
    };
  }

  // Resolve a requested pytubefix itag, if any.
  let target: RawFormat | undefined;
  if (isPytubefixFormat(formatId)) {
    const itag = parseInt(formatId!.slice(PYTUBEFIX_FORMAT_PREFIX.length), 10);
    target = formats.find((f) => f.itag === itag);
  }

  // Progressive target (or no target → best progressive ≤720p): single input.
  if (target?.is_progressive) {
    return {
      label: `progressive itag ${target.itag}`,
      args: [
        "-hide_banner", "-loglevel", "error",
        ...FFMPEG_INPUT_OPTS, "-i", target.url,
        "-c", "copy", "-f", "mpegts", "pipe:1",
      ],
    };
  }

  // Video-only target → mux with best audio.
  const video = (target?.has_video && !target.has_audio ? target : undefined) ?? bestVideoOnly(formats);
  if (video) {
    const audio = bestAudio(formats);
    if (audio) {
      return {
        label: `mux video itag ${video.itag} + audio itag ${audio.itag}`,
        args: [
          "-hide_banner", "-loglevel", "error",
          ...FFMPEG_INPUT_OPTS, "-i", video.url,
          ...FFMPEG_INPUT_OPTS, "-i", audio.url,
          "-map", "0:v:0", "-map", "1:a:0",
          "-c", "copy", "-f", "mpegts", "pipe:1",
        ],
      };
    }
    // Video has no separate audio available — ship video-only.
    return {
      label: `video-only itag ${video.itag}`,
      args: [
        "-hide_banner", "-loglevel", "error",
        ...FFMPEG_INPUT_OPTS, "-i", video.url,
        "-c", "copy", "-f", "mpegts", "pipe:1",
      ],
    };
  }

  // Last resort: best progressive.
  const prog = bestProgressive(formats);
  if (prog) {
    return {
      label: `progressive fallback itag ${prog.itag}`,
      args: [
        "-hide_banner", "-loglevel", "error",
        ...FFMPEG_INPUT_OPTS, "-i", prog.url,
        "-c", "copy", "-f", "mpegts", "pipe:1",
      ],
    };
  }

  throw new Error("pytubefix: no usable video stream");
}

function makeFailure(msg: string, stderr: string, midStream: boolean): DownloadFailure {
  const err = new Error(msg) as DownloadFailure;
  err.stderr = stderr;
  err.signal = classifyStderr(stderr);
  err.code = null;
  err.midStream = midStream;
  return err;
}

/**
 * Download via pytubefix + ffmpeg. Mirrors {@link DownloadStream}: `firstByte`
 * resolves on the first output byte (safe to commit HTTP 200) or rejects with a
 * {@link DownloadFailure} on a pre-byte failure (caller can fall back further).
 *
 * Unlike yt-dlp's synchronous spawn, extraction is async, so this returns a
 * Promise that resolves once ffmpeg has been spawned.
 */
export async function pytubefixDownload(
  url: string,
  formatId?: string,
  audioOnly?: boolean
): Promise<DownloadStream> {
  const data = await extract(url);
  const plan = planFfmpeg(data, formatId, audioOnly ?? false);

  let proc: ReturnType<typeof spawn> | null = null;
  let aborted = false;
  let firstByteSeen = false;

  let resolveFirstByte!: () => void;
  let rejectFirstByte!: (err: DownloadFailure) => void;
  let settled = false;
  const firstByte = new Promise<void>((resolve, reject) => {
    resolveFirstByte = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    rejectFirstByte = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      console.log(`[pytubefix] ${plan.label} (client ${data.client})`);
      proc = spawn(FFMPEG_BIN, plan.args);
      let stderrBuf = "";

      proc.stdout!.on("data", (chunk: Buffer) => {
        firstByteSeen = true;
        resolveFirstByte();
        controller.enqueue(new Uint8Array(chunk));
      });

      proc.stderr!.on("data", (d: Buffer) => {
        stderrBuf += d.toString();
      });

      proc.on("close", (code) => {
        if (aborted) return;
        if (code === 0) {
          controller.close();
          return;
        }
        if (firstByteSeen) {
          console.error(`[pytubefix] ffmpeg failed mid-stream (code ${code}):`, stderrBuf.slice(-400));
          controller.error(makeFailure(`Download interrupted (code ${code})`, stderrBuf, true));
          return;
        }
        console.error(`[pytubefix] ffmpeg failed (code ${code}):`, stderrBuf.slice(-400));
        const failure = makeFailure(`pytubefix download failed (code ${code})`, stderrBuf, false);
        rejectFirstByte(failure);
        controller.error(failure);
      });

      proc.on("error", (err) => {
        const failure = makeFailure(err.message || "ffmpeg process error", err.message || "", firstByteSeen);
        rejectFirstByte(failure);
        controller.error(failure);
      });
    },
    cancel() {
      aborted = true;
      proc?.kill("SIGTERM");
    },
  });

  return {
    stream,
    firstByte,
    abort: () => {
      aborted = true;
      proc?.kill("SIGTERM");
    },
  };
}
