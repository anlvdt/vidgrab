export interface Platform {
  id: string;
  name: string;
  color: string;
  reliability: "strong" | "conditional" | "best-effort";
  patterns: RegExp[];
}

export const platforms: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    reliability: "strong",
    patterns: [/youtube\.com/i, /youtu\.be/i, /youtube-nocookie\.com/i],
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#00F2EA",
    reliability: "strong",
    patterns: [/tiktok\.com/i, /vm\.tiktok\.com/i],
  },
  {
    id: "instagram",
    name: "Instagram",
    color: "#E4405F",
    reliability: "conditional",
    patterns: [/instagram\.com/i, /instagr\.am/i],
  },
  {
    id: "twitter",
    name: "X / Twitter",
    color: "#1DA1F2",
    reliability: "conditional",
    patterns: [/twitter\.com/i, /x\.com/i, /t\.co/i],
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    reliability: "strong",
    patterns: [/facebook\.com/i, /fb\.watch/i, /fb\.com/i],
  },
  {
    id: "reddit",
    name: "Reddit",
    color: "#FF4500",
    reliability: "strong",
    patterns: [/reddit\.com/i, /redd\.it/i],
  },
  {
    id: "twitch",
    name: "Twitch",
    color: "#9146FF",
    reliability: "conditional",
    patterns: [/twitch\.tv/i, /clips\.twitch\.tv/i],
  },
  {
    id: "vimeo",
    name: "Vimeo",
    color: "#1AB7EA",
    reliability: "strong",
    patterns: [/vimeo\.com/i],
  },
  {
    id: "dailymotion",
    name: "Dailymotion",
    color: "#0066DC",
    reliability: "strong",
    patterns: [/dailymotion\.com/i, /dai\.ly/i],
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    color: "#FF5500",
    reliability: "strong",
    patterns: [/soundcloud\.com/i],
  },
  {
    id: "bilibili",
    name: "Bilibili",
    color: "#00A1D6",
    reliability: "conditional",
    patterns: [/bilibili\.com/i, /b23\.tv/i],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    color: "#E60023",
    reliability: "conditional",
    patterns: [/pinterest\.com/i, /pin\.it/i],
  },
  {
    id: "tumblr",
    name: "Tumblr",
    color: "#36465D",
    reliability: "best-effort",
    patterns: [/tumblr\.com/i],
  },
  {
    id: "snapchat",
    name: "Snapchat",
    color: "#FFFC00",
    reliability: "conditional",
    patterns: [/snapchat\.com/i, /story\.snapchat\.com/i],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    reliability: "best-effort",
    patterns: [/linkedin\.com/i],
  },
  {
    id: "threads",
    name: "Threads",
    color: "#000000",
    reliability: "best-effort",
    patterns: [/threads\.net/i],
  },
];

export const showcasePlatforms = platforms.slice(0, 12);

export function detectPlatform(url: string): Platform | null {
  for (const p of platforms) {
    if (p.patterns.some((re) => re.test(url))) return p;
  }
  return null;
}

export const YTDLP_FALLBACK_LABEL = "yt-dlp";
