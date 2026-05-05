import { NextRequest, NextResponse } from "next/server";
import { getVideoInfo, getPlaylistInfo, ensureYtdlpFresh } from "@/lib/ytdlp";
import { scrapeVideo, detectScrapablePlatform } from "@/lib/scrapers";
import { cobaltDownload, isCobaltAvailable } from "@/lib/cobalt";
import { sanitizeUrl } from "@/lib/url-sanitizer";
import { classifyStderr, type StderrSignal } from "@/lib/po-token";

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
  const lower = stderr.toLowerCase();
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

function scraperResponse(result: any) {
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
    const { url, playlist, proxy } = await req.json();

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
    const trimmedUrl = sanitizeUrl(url);
    const opts = { proxy: proxy || undefined };
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
      try {
        const info = await getVideoInfo(trimmedUrl, opts);
        return NextResponse.json(info);
      } catch {
        /* yt-dlp also failed */
      }

      // Step 3: Both failed
      return NextResponse.json(
        {
          error:
            "Could not download from this platform. The video may be private or the link is invalid.",
        },
        { status: 500 }
      );
    }

    // ── Strategy B: For YouTube and all other 1800+ sites ──
    // yt-dlp with automatic retry & player client rotation
    try {
      if (playlist) {
        return NextResponse.json(await getPlaylistInfo(trimmedUrl, opts));
      }
      return NextResponse.json(await getVideoInfo(trimmedUrl, opts));
    } catch (ytErr: any) {
      const stderr = ytErr.stderr || ytErr.message || "";

      if (/ENOENT/i.test(ytErr.code || "")) {
        return NextResponse.json(
          { error: "yt-dlp not found. Install: brew install yt-dlp" },
          { status: 500 }
        );
      }

      // Fallback to Cobalt for YouTube when yt-dlp fails with auth/rate-limit
      // Use Arroxy's signal classification for more accurate detection
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
  } catch (error: any) {
    console.error("Info fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
