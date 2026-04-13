/**
 * Cobalt API client — fallback for platforms where yt-dlp struggles.
 *
 * Since public Cobalt instances now require JWT auth, this supports:
 * 1. Self-hosted Cobalt instance (set COBALT_API_URL env var)
 * 2. Cobalt instance with API key (set COBALT_API_KEY env var)
 *
 * Deploy your own: https://github.com/imputnet/cobalt
 * Or use: docker run -p 9000:9000 ghcr.io/imputnet/cobalt
 */

const COBALT_API_URL = process.env.COBALT_API_URL || "";
const COBALT_API_KEY = process.env.COBALT_API_KEY || "";

export interface CobaltResult {
  ok: boolean;
  url?: string;
  audioUrl?: string;
  picker?: { type: string; url: string; thumb?: string }[];
  error?: string;
}

export async function cobaltDownload(
  videoUrl: string,
  audioOnly = false
): Promise<CobaltResult> {
  if (!COBALT_API_URL) {
    return { ok: false, error: "Cobalt API not configured" };
  }

  const body: Record<string, any> = {
    url: videoUrl,
    videoQuality: "1080",
    filenameStyle: "basic",
  };

  if (audioOnly) {
    body.downloadMode = "audio";
    body.audioFormat = "mp3";
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "VidGrab/1.0",
  };

  if (COBALT_API_KEY) {
    headers["Authorization"] = `Api-Key ${COBALT_API_KEY}`;
  }

  try {
    const res = await fetch(COBALT_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return { ok: false, error: `Cobalt HTTP ${res.status}` };
    }

    const data = await res.json();

    if (data.status === "error") {
      return { ok: false, error: data.error?.code || data.text || "Cobalt error" };
    }

    if (data.status === "redirect" || data.status === "stream") {
      return { ok: true, url: data.url, audioUrl: data.audio };
    }

    if (data.status === "picker" && data.picker?.length) {
      return { ok: true, url: data.picker[0].url, picker: data.picker };
    }

    return { ok: false, error: "Unexpected Cobalt response" };
  } catch (err: any) {
    return { ok: false, error: err.message || "Cobalt request failed" };
  }
}

/** Check if Cobalt is configured and should be tried */
export function isCobaltAvailable(): boolean {
  return !!COBALT_API_URL;
}

/** Platforms where Cobalt excels (no cookies needed) */
export function shouldUseCobaltFirst(url: string): boolean {
  if (!isCobaltAvailable()) return false;
  return /tiktok\.com|instagram\.com|instagr\.am/i.test(url);
}
