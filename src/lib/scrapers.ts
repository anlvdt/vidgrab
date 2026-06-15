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

function absoluteUrl(value: string | undefined, baseUrl: string): string {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

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
        thumbnail: absoluteUrl(d.cover || d.origin_cover, "https://www.tikwm.com"),
        videoUrl: absoluteUrl(d.hdplay || d.play, "https://www.tikwm.com"),
        audioUrl: absoluteUrl(d.music, "https://www.tikwm.com"),
        author: d.author?.nickname || d.author?.unique_id || "",
      };
    }
    return { ok: false, error: json.msg || "TikWM error" };
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : "TikTok scraping failed" };
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
      headers: { "User-Agent": "VidGrab/1.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    // vxtwitter serves an HTML error page (not JSON) when it can't scan a tweet
    // — e.g. Twitter's guest API changes. Guard so we fall through to yt-dlp
    // cleanly instead of throwing a JSON parse error.
    if (!res.ok || !/json/i.test(res.headers.get("content-type") || "")) {
      return { ok: false, error: "Twitter scan failed (sign-in may be required)" };
    }
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
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : "Twitter scraping failed" };
  }
}

// ─── Instagram via multiple methods ──────────────────────────
async function scrapeInstagram(url: string): Promise<ScraperResult> {
  // Method 1: igram.world
  try {
    const res = await fetch("https://api.igram.world/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA, "Accept": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(15000),
    });
    // Endpoint occasionally 404s / returns HTML when the upstream API moves;
    // guard before parsing so we fall through to method 2 / yt-dlp.
    const json = res.ok && /json/i.test(res.headers.get("content-type") || "")
      ? await res.json()
      : null;
    if (json?.items?.length) {
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
  if (/reddit\.com|redd\.it/i.test(url)) return "reddit";
  return null;
}

export async function scrapeVideo(url: string): Promise<ScraperResult> {
  const platform = detectScrapablePlatform(url);
  switch (platform) {
    case "tiktok": return scrapeTikTok(url);
    case "twitter": return scrapeTwitter(url);
    case "instagram": return scrapeInstagram(url);
    case "facebook": return scrapeFacebook(url);
    case "reddit": return scrapeReddit(url);
    default: return { ok: false, error: "Not supported" };
  }
}

// ─── Reddit via Reddit API ───────────────────────────────────
async function scrapeReddit(url: string): Promise<ScraperResult> {
  try {
    const match = url.match(/reddit\.com\/r\/[\w]+\/comments\/([a-z0-9]+)/i)
      || url.match(/redd\.it\/([a-z0-9]+)/i);
    if (!match) return { ok: false, error: "Invalid Reddit URL" };
    const postId = match[1];
    const res = await fetch(`https://www.reddit.com/comments/${postId}.json`, {
      headers: { "User-Agent": UA, "Accept": "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, error: "Reddit API error" };
    const data = await res.json();
    const post = data[0]?.data?.children?.[0]?.data;
    if (!post) return { ok: false, error: "Post not found" };
    const videoUrl = post.media?.reddit_video?.fallback_url || post.url?.replace(/\.png|\.jpg|\.jpeg$/, ".mp4");
    const isVideo = post.is_video && post.media?.reddit_video;
    if (!isVideo && !post.url) return { ok: false, error: "No video in this post" };
    return {
      ok: true,
      title: post.title || "Reddit Video",
      thumbnail: post.thumbnail || post.url?.replace(/\.mp4$/, ".jpg"),
      videoUrl: isVideo ? videoUrl : post.url,
      author: post.author || "",
    };
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : "Reddit failed" };
  }
}
