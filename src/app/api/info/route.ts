import { NextRequest, NextResponse } from "next/server";
import { getVideoInfo, getPlaylistInfo } from "@/lib/ytdlp";
import { scrapeVideo, detectScrapablePlatform } from "@/lib/scrapers";

function parseError(stderr: string): string {
  if (/blocked|IP.*block/i.test(stderr))
    return "IP blocked. Trying alternative...";
  if (/login|cookie|authentication|sign in/i.test(stderr))
    return "Login required. Trying alternative...";
  if (/unavailable|not found|404|does not exist/i.test(stderr))
    return "Video not found or deleted.";
  if (/geo.?restrict|not available in your country/i.test(stderr))
    return "Not available in your region.";
  if (/private|restricted/i.test(stderr))
    return "This video is private or restricted.";
  if (/no video|no media|empty.*response/i.test(stderr))
    return "No downloadable video found.";
  if (/unsupported url|no.*extractor/i.test(stderr))
    return "This URL is not supported.";
  if (/timed? ?out|timeout/i.test(stderr))
    return "Request timed out. Try again.";
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

    if (!url || typeof url !== "string" || !/^https?:\/\/.+/i.test(url.trim())) {
      return NextResponse.json({ error: "Please provide a valid URL" }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    const opts = { proxy: proxy || undefined };
    const isScrapable = !!detectScrapablePlatform(trimmedUrl);

    // ── Strategy A: For TikTok/Instagram/Twitter/Facebook ──
    // Try scraper FIRST (fast, no cookies, no proxy needed)
    // Then fall back to yt-dlp if scraper fails
    if (isScrapable && !playlist) {
      // Step 1: Try scraper
      try {
        const result = await scrapeVideo(trimmedUrl);
        if (result.ok && result.videoUrl) {
          return scraperResponse(result);
        }
      } catch { /* scraper failed, try yt-dlp */ }

      // Step 2: Try yt-dlp
      try {
        const info = await getVideoInfo(trimmedUrl, opts);
        return NextResponse.json(info);
      } catch { /* yt-dlp also failed */ }

      // Step 3: Both failed
      return NextResponse.json(
        { error: "Could not download from this platform. The video may be private or the link is invalid." },
        { status: 500 }
      );
    }

    // ── Strategy B: For YouTube and all other 1800+ sites ──
    // yt-dlp is primary (best quality, format selection)
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

      return NextResponse.json({ error: parseError(stderr) }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Info fetch error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
