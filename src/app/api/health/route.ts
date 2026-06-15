import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);
const YTDLP_BIN = process.env.YTDLP_PATH || "yt-dlp";
const FFMPEG_BIN = process.env.FFMPEG_BIN || "ffmpeg";
const PYTHON_BIN = process.env.PYTHON_BIN || "python3";

// Cache the version probe so we don't spawn yt-dlp on every health hit.
let cached: { version: string; checkedAt: number } | null = null;
const TTL_MS = 60 * 60 * 1000; // 1h

async function ytdlpVersion(): Promise<string> {
  if (cached && Date.now() - cached.checkedAt < TTL_MS) return cached.version;
  try {
    const { stdout } = await execFileAsync(YTDLP_BIN, ["--version"], { timeout: 5000 });
    cached = { version: stdout.trim(), checkedAt: Date.now() };
  } catch {
    cached = { version: "unavailable", checkedAt: Date.now() };
  }
  return cached.version;
}

async function binaryVersion(bin: string, args: string[], timeout = 5000): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, { timeout });
    return (stdout || stderr).split("\n")[0]?.trim() || "available";
  } catch {
    return "unavailable";
  }
}

async function pytubefixStatus(): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      PYTHON_BIN,
      ["-c", "import pytubefix; print(getattr(pytubefix, '__version__', 'available'))"],
      { timeout: 5000 }
    );
    return stdout.trim() || "available";
  } catch {
    return "unavailable";
  }
}

function getBuildId(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), ".next/BUILD_ID"), "utf8").trim();
  } catch {
    try {
      return fs.readFileSync(path.join(process.cwd(), "BUILD_ID"), "utf8").trim();
    } catch {
      return "unknown";
    }
  }
}

/**
 * Liveness + extraction-stack visibility. Surfaces the installed yt-dlp version
 * (the #1 thing to watch for "downloads suddenly broke") and which fallback
 * engines are wired, without leaking secrets.
 */
export async function GET() {
  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    ok: true,
    buildId: getBuildId(),
    ytdlpVersion: await ytdlpVersion(),
    engines: {
      ytdlp: (await ytdlpVersion()) !== "unavailable",
      ffmpeg: await binaryVersion(FFMPEG_BIN, ["-version"]),
      python: await binaryVersion(PYTHON_BIN, ["--version"]),
      pytubefix: await pytubefixStatus(),
      cobalt: !!process.env.COBALT_API_URL,
    },
    poToken: !!process.env.BGUTIL_POT_BASE_URL,
    cookies: !!process.env.VIDGRAB_COOKIES_PATH,
    proxy: !!process.env.YTDLP_PROXY,
  });
}
