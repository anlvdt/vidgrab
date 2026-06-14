import { NextRequest, NextResponse } from "next/server";
import { getVideoInfo, getPlaylistInfo, ensureYtdlpFresh } from "@/lib/ytdlp";
import { getPytubefixInfo } from "@/lib/pytubefix";
import { scrapeVideo, detectScrapablePlatform } from "@/lib/scrapers";
import { cobaltDownload, isCobaltAvailable } from "@/lib/cobalt";
import { sanitizeUrl } from "@/lib/url-sanitizer";
import { classifyStderr } from "@/lib/po-token";
import { assertPublicHttpUrl, consumeRateLimit } from "@/lib/request-guard";
import type { ScraperResult } from "@/lib/scrapers";

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

/**
 * Parse yt-dlp stderr into user-friendly error messages.
 * Uses Arroxy's signal classification for more accurate error handling.
 */
function parseError(stderr: string): string {
  const signal = classifyStderr(stderr);

  switch (signal) {
    case 'rateLimit':
      return "Rate limited (429). Please wait a moment and try again.";
    case 'botBlock':
      return "Bot detection triggered. Retrying with alternative method...";
    case 'nsig':
      return "Video extraction failed (signature issue). Please try again.";
    case 'networkError':
      return "Network error. Please check your connection and try again.";
    case 'geoRestricted':
      return "Not available in your region.";
    case 'private':
      return "This video is private or restricted.";
    case 'notFound':
      return "Video not found or deleted.";
    case 'formatUnavailable':
      return "Requested format not available. Try a different quality.";
    default:
      break;
  }

  // Fallback to pattern matching for cases not covered by signal classification
  if (/blocked|IP.*block/i.test(stderr))
    return "IP blocked. Trying alternative...";
  if (/login|cookie|authentication|sign in/i.test(stderr))
    return "Login required. Trying alternative...";
  if (/no video|no media|empty.*response/i.test(stderr))
    return "No downloadable video found.";
  if (/unsupported url|no.*extractor/i.test(stderr))
    return "This URL is not supported.";
  return "Failed to fetch video info.";
}

function scraperResponse(result: ScraperResult) {
  return NextResponse.json({
    id: "scraper",
    title: result.title || "Video",
    thumbnail: result.thumbnail || "",
    duration: 0,
    durationString: "",
    uploader: result.author || "",
    viewCount: 0,
    uploadDate: "",
    description: "",
    formats: [],
    isPlaylist: false,
    directUrl: result.videoUrl,
    directAudioUrl: result.audioUrl || "",
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!consumeRateLimit(req, 12)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { url, playlist } = await req.json();

    if (
      !url ||
      typeof url !== "string" ||
      !/^https?:\/\/.+/i.test(url.trim())
    ) {
      return NextResponse.json(
        { error: "Please provide a valid URL" },
        { status: 400 }
      );
    }

    // Trigger background yt-dlp freshness check
    ensureYtdlpFresh().catch(() => {});

    // Sanitize URL: strip tracking params, unwrap redirects (Arroxy feature)
    let trimmedUrl: string;
    try {
      trimmedUrl = await assertPublicHttpUrl(sanitizeUrl(url));
    } catch {
      return NextResponse.json(
        { error: "Please provide a valid public URL" },
        { status: 400 }
      );
    }
    const opts = {};
    const isScrapable = !!detectScrapablePlatform(trimmedUrl);

    // ── Strategy A: For TikTok/Instagram/Twitter/Facebook ──
    if (isScrapable && !playlist) {
      // Step 1: Try scraper (fast, no cookies needed)
      try {
        const result = await scrapeVideo(trimmedUrl);
        if (result.ok && result.videoUrl) {
          return scraperResponse(result);
        }
      } catch {
        /* scraper failed, try yt-dlp */
      }

      // Step 2: Try yt-dlp (with retry & player client rotation)
      let ytStderr = "";
      try {
        const info = await getVideoInfo(trimmedUrl, opts);
        return NextResponse.json(info);
      } catch (ytErr) {
        const e = ytErr as Error & { stderr?: string };
        ytStderr = e.stderr || e.message || "";
      }

      // Step 3: Both failed. Several platforms (Instagram, Twitter/X) now gate
      // public videos behind sign-in — the third-party scrapers are down and
      // yt-dlp can't read them without auth. Detect that and tell the user how
      // to fix it (add cookies) instead of a misleading "private/invalid link".
      const needsAuth =
        /login|sign[- ]?in|cookie|authenticat|empty media response|guest token|rate.?limit reached/i.test(
          ytStderr
        );
      return NextResponse.json(
        {
          error: needsAuth
            ? "This platform now requires sign-in to download. Add your account cookies in Settings, then try again."
            : "Could not download from this platform. The video may be private, region-locked, or the link is invalid.",
        },
        { status: needsAuth ? 401 : 500 }
      );
    }

    // ── Strategy B: For YouTube and all other 1800+ sites ──
    // yt-dlp with automatic retry & player client rotation
    try {
      if (playlist) {
        return NextResponse.json(await getPlaylistInfo(trimmedUrl, opts));
      }
      return NextResponse.json(await getVideoInfo(trimmedUrl, opts));
    } catch (ytErr: unknown) {
      const error = ytErr as Error & { stderr?: string; code?: string };
      const stderr = error.stderr || error.message || "";

      if (/ENOENT/i.test(error.code || "")) {
        return NextResponse.json(
          { error: "yt-dlp not found. Install: brew install yt-dlp" },
          { status: 500 }
        );
      }

      // Fallback #1 for YouTube: pytubefix (secondary extractor). It returns
      // real formats + metadata, so prefer it over Cobalt's blind direct URL.
      if (isYouTubeUrl(trimmedUrl) && !playlist) {
        try {
          return NextResponse.json(await getPytubefixInfo(trimmedUrl));
        } catch {
          /* pytubefix also failed — fall through to Cobalt */
        }
      }

      // Fallback #2: Cobalt for YouTube when yt-dlp fails with auth/rate-limit.
      // Use Arroxy's signal classification for more accurate detection.
      const ytSignal = classifyStderr(stderr);
      const isRetryableWithCobalt =
        ytSignal === 'botBlock' ||
        ytSignal === 'rateLimit' ||
        ytSignal === 'nsig' ||
        /login|cookie|authentication|sign in/i.test(stderr);

      if (isRetryableWithCobalt && isCobaltAvailable() && !playlist) {
        try {
          const cobaltResult = await cobaltDownload(trimmedUrl);
          if (cobaltResult.ok && cobaltResult.url) {
            return NextResponse.json({
              id: "cobalt",
              title: "Video",
              thumbnail: "",
              duration: 0,
              durationString: "",
              uploader: "",
              viewCount: 0,
              uploadDate: "",
              description: "",
              formats: [],
              isPlaylist: false,
              cobaltUrl: cobaltResult.url,
              cobaltAudioUrl: cobaltResult.audioUrl || "",
              cobaltPicker: cobaltResult.picker,
            });
          }
        } catch {
          /* Cobalt also failed */
        }
      }

      return NextResponse.json(
        { error: parseError(stderr) },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Info fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
