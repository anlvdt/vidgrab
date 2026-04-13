import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { join } from "path";

const execFileAsync = promisify(execFile);

// Path for cookies file (server-side only)
const COOKIES_PATH = join(process.cwd(), "cookies.txt");

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

/** Build common yt-dlp args (cookies, proxy, user-agent, retries) */
function baseArgs(opts?: DownloadOptions): string[] {
  const args: string[] = ["--no-warnings"];

  // Cookies file support
  if (opts?.cookies !== false && existsSync(COOKIES_PATH)) {
    args.push("--cookies", COOKIES_PATH);
  }

  // Proxy support
  const proxy = opts?.proxy || process.env.YTDLP_PROXY;
  if (proxy) {
    args.push("--proxy", proxy);
  }

  // Retry & resilience
  args.push("--retries", "3");
  args.push("--socket-timeout", "15");

  // Impersonate a real browser to avoid bot detection
  args.push("--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

  // Add referer for platforms that check it
  args.push("--referer", "https://www.google.com/");

  return args;
}

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
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

export async function getVideoInfo(url: string, opts?: DownloadOptions): Promise<VideoInfo> {
  const args = [
    ...baseArgs(opts),
    "--dump-json",
    "--no-playlist",
    url,
  ];

  try {
    const { stdout } = await execFileAsync("yt-dlp", args, {
      timeout: 45000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const data = JSON.parse(stdout);

    const formats: VideoFormat[] = (data.formats || [])
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
      formats,
      isPlaylist: false,
    };
  } catch (err: any) {
    const error = new Error(err.message || "yt-dlp failed");
    (error as any).stderr = err.stderr || err.message || "";
    (error as any).code = err.code;
    throw error;
  }
}

export async function getPlaylistInfo(url: string, opts?: DownloadOptions): Promise<VideoInfo> {
  const args = [
    ...baseArgs(opts),
    "--dump-json",
    "--flat-playlist",
    url,
  ];

  try {
    const { stdout } = await execFileAsync("yt-dlp", args, {
      timeout: 60000,
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
        url: d.url || d.webpage_url || `https://www.youtube.com/watch?v=${d.id}`,
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
    const error = new Error(err.message || "yt-dlp failed");
    (error as any).stderr = err.stderr || err.message || "";
    (error as any).code = err.code;
    throw error;
  }
}

/** Build download args with all enhancements */
export function buildDownloadArgs(
  url: string,
  formatId?: string,
  audioOnly?: boolean,
  opts?: DownloadOptions
): string[] {
  const args = baseArgs(opts);

  if (audioOnly) {
    args.push("-f", "bestaudio");
    args.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", "0");
  } else if (formatId) {
    args.push("-f", `${formatId}+bestaudio/best`);
    args.push("--merge-output-format", "mp4");
  } else {
    args.push("-f", "bestvideo+bestaudio/best");
    args.push("--merge-output-format", "mp4");
  }

  args.push("-o", "-", url);
  return args;
}

export { formatFileSize, formatDuration };
