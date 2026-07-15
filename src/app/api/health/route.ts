import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import {
  pythonEnv,
  resolveFfmpegBin,
  resolvePythonBin,
  resolveYtdlpBin,
} from "@/lib/runtime-paths";

const execFileAsync = promisify(execFile);

// Cache the version probe so we don't spawn yt-dlp on every health hit.
let cached: { bin: string; version: string; checkedAt: number } | null = null;
const TTL_MS = 60 * 60 * 1000; // 1h

async function ytdlpVersion(bin: string): Promise<string> {
  if (cached && cached.bin === bin && Date.now() - cached.checkedAt < TTL_MS) return cached.version;
  try {
    const { stdout } = await execFileAsync(bin, ["--version"], { timeout: 5000 });
    cached = { bin, version: stdout.trim(), checkedAt: Date.now() };
  } catch {
    cached = { bin, version: "unavailable", checkedAt: Date.now() };
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
      resolvePythonBin(),
      ["-c", "import pytubefix; print(getattr(pytubefix, '__version__', 'available'))"],
      { env: pythonEnv(), timeout: 5000 }
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
  const ytdlpBin = resolveYtdlpBin();
  const ffmpegBin = resolveFfmpegBin();
  const pythonBin = resolvePythonBin();
  const ytdlpVersionValue = await ytdlpVersion(ytdlpBin);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    ok: true,
    buildId: getBuildId(),
    ytdlpVersion: ytdlpVersionValue,
    engines: {
      ytdlp: ytdlpVersionValue !== "unavailable",
      ytdlpEjs: process.env.YTDLP_JS_RUNTIME !== "off",
      ffmpeg: await binaryVersion(ffmpegBin, ["-version"]),
      python: await binaryVersion(pythonBin, ["--version"]),
      pytubefix: await pytubefixStatus(),
      cobalt: !!process.env.COBALT_API_URL,
    },
    poToken: !!process.env.BGUTIL_POT_BASE_URL,
    jsRuntime: process.env.YTDLP_JS_RUNTIME || "node",
    cookies: !!process.env.VIDGRAB_COOKIES_PATH,
    proxy: !!process.env.YTDLP_PROXY,
  });
}
