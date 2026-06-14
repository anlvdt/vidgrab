import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const YTDLP_BIN = process.env.YTDLP_PATH || "yt-dlp";

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

/**
 * Liveness + extraction-stack visibility. Surfaces the installed yt-dlp version
 * (the #1 thing to watch for "downloads suddenly broke") and which fallback
 * engines are wired, without leaking secrets.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    ytdlpVersion: await ytdlpVersion(),
    engines: {
      ytdlp: true,
      pytubefix: true,
      cobalt: !!process.env.COBALT_API_URL,
    },
    poToken: !!process.env.BGUTIL_POT_BASE_URL,
    cookies: !!process.env.VIDGRAB_COOKIES_PATH,
    proxy: !!process.env.YTDLP_PROXY,
  });
}
