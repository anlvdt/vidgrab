/**
 * Platform-specific scrapers — zero config, no cookies, no proxy.
 * Focused on platforms popular in Vietnam:
 *   YouTube (yt-dlp primary), TikTok, Facebook, Instagram, Twitter/X
 */

export interface ScraperResult {
  ok: boolean;
  title?: string;
  thumbnail?: string;
  videoUrl?: string;
  audioUrl?: string;
  author?: string;
  error?: string;
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ─── TikTok via TikWM (most reliable, HD, no watermark) ─────
async function scrapeTikTok(url: string): Promise<ScraperResult> {
  try {
    const res = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
      body: `url=${encodeURIComponent(url)}&count=12&cursor=0&web=1&hd=1`,
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();
    if (json.code === 0 && json.data) {
      const d = json.data;
      return {
        ok: true,
        title: d.title || "TikTok Video",
        thumbnail: d.cover || d.origin_cover || "",
        videoUrl: d.hdplay || d.play || "",
        audioUrl: d.music || "",
        author: d.author?.nickname || d.author?.unique_id || "",
      };
    }
    return { ok: false, error: json.msg || "TikWM error" };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── Twitter/X via vxtwitter API (reliable, free) ────────────
async function scrapeTwitter(url: string): Promise<ScraperResult> {
  try {
    // Extract status ID from URL
    const match = url.match(/status\/(\d+)/);
    if (!match) return { ok: false, error: "Invalid Twitter URL" };
    const statusId = match[1];

    const res = await fetch(`https://api.vxtwitter.com/Twitter/status/${statusId}`, {
      headers: { "User-Agent": "VidGrab/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();

    const mediaUrls: string[] = json.mediaURLs || [];
    const videoUrl = mediaUrls.find((u: string) => u.includes("video.twimg.com")) || mediaUrls[0] || "";

    if (!videoUrl) {
      return { ok: false, error: "No video found in this tweet" };
    }

    return {
      ok: true,
      title: (json.text || "X Video").slice(0, 100),
      thumbnail: json.media_extended?.[0]?.thumbnail_url || "",
      videoUrl,
      author: json.user_name || "",
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── Instagram via multiple methods ──────────────────────────
async function scrapeInstagram(url: string): Promise<ScraperResult> {
  // Method 1: igram.world
  try {
    const res = await fetch("https://api.igram.world/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();
    if (json.items?.length) {
      const item = json.items[0];
      return {
        ok: true,
        title: "Instagram Video",
        thumbnail: item.thumbnail || "",
        videoUrl: item.url || "",
        author: "",
      };
    }
  } catch { /* try next */ }

  // Method 2: saveig
  try {
    const res = await fetch("https://v3.saveig.app/api/ajaxSearch", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
      body: `q=${encodeURIComponent(url)}&t=media&lang=en`,
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();
    if (json.status === "ok" && json.data) {
      const videoMatch = json.data.match(/href="(https?:\/\/[^"]+)"/);
      if (videoMatch) {
        return {
          ok: true,
          title: "Instagram Video",
          thumbnail: "",
          videoUrl: videoMatch[1].replace(/&amp;/g, "&"),
          author: "",
        };
      }
    }
  } catch { /* failed */ }

  return { ok: false, error: "Instagram scraping failed" };
}

// ─── Facebook via multiple methods ───────────────────────────
async function scrapeFacebook(url: string): Promise<ScraperResult> {
  // Method 1: fdown.net style
  try {
    const res = await fetch("https://www.getfvid.com/downloader", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        "Referer": "https://www.getfvid.com/",
      },
      body: `url=${encodeURIComponent(url)}`,
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const hdMatch = html.match(/href="(https?:\/\/[^"]*fbcdn[^"]*\.mp4[^"]*)"/i);
    if (hdMatch) {
      return {
        ok: true,
        title: "Facebook Video",
        thumbnail: "",
        videoUrl: hdMatch[1].replace(/&amp;/g, "&"),
        author: "",
      };
    }
  } catch { /* failed */ }

  return { ok: false, error: "Facebook scraping failed" };
}

// ─── Router ─────────────────────────────────────────────────
export function detectScrapablePlatform(url: string): string | null {
  if (/tiktok\.com|vm\.tiktok/i.test(url)) return "tiktok";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  if (/instagram\.com|instagr\.am/i.test(url)) return "instagram";
  if (/facebook\.com|fb\.watch|fb\.com/i.test(url)) return "facebook";
  return null;
}

export async function scrapeVideo(url: string): Promise<ScraperResult> {
  const platform = detectScrapablePlatform(url);
  switch (platform) {
    case "tiktok": return scrapeTikTok(url);
    case "twitter": return scrapeTwitter(url);
    case "instagram": return scrapeInstagram(url);
    case "facebook": return scrapeFacebook(url);
    default: return { ok: false, error: "Not supported" };
  }
}
