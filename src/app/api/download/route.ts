import { NextRequest } from "next/server";
import type { DownloadFailure, DownloadStream } from "@/lib/ytdlp";
import { isPytubefixFormat } from "@/lib/pytubefix-format";
import { parseVideoId, sanitizeUrl } from "@/lib/url-sanitizer";
import {
  buildDownloadFilename,
  contentDisposition,
} from "@/lib/filename-sanitizer";
import { detectPlatform } from "@/lib/platforms";
import { classifyStderr } from "@/lib/po-token";
import { cobaltDownload, isCobaltAvailable } from "@/lib/cobalt";
import { parseLogoRemoval } from "@/lib/logo-removal-options";
import {
  acquireDownloadSlot,
  assertPublicHttpUrl,
  consumeRateLimit,
  guardStream,
} from "@/lib/request-guard";

const MAX_DIRECT_REDIRECTS = 5;
const DIRECT_MEDIA_HOSTS = [
  "googlevideo.com",
  "tiktokcdn.com",
  "tikwm.com",
  "twimg.com",
  "fbcdn.net",
  "cdninstagram.com",
  "v.redd.it",
  "redditmedia.com",
  "redd.it",
];

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function isAllowedDirectMediaHost(url: string, allowUnlistedHost = false): boolean {
  if (allowUnlistedHost) return true;
  const hostname = new URL(url).hostname.toLowerCase();
  return DIRECT_MEDIA_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );
}

async function fetchPublicDirectStream(
  inputUrl: string,
  redirects = 0,
  options?: { allowUnlistedHost?: boolean }
): Promise<DownloadStream> {
  if (redirects > MAX_DIRECT_REDIRECTS) {
    throw new Error("Too many redirects");
  }

  const publicUrl = await assertPublicHttpUrl(inputUrl);
  if (!isAllowedDirectMediaHost(publicUrl, options?.allowUnlistedHost)) {
    throw new Error("Direct media host is not allowed");
  }
  const res = await fetch(publicUrl, {
    redirect: "manual",
    headers: { "User-Agent": "VidGrab/1.0" },
    signal: AbortSignal.timeout(30_000),
  });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (!location) throw new Error("Redirect without location");
    return fetchPublicDirectStream(new URL(location, publicUrl).toString(), redirects + 1, options);
  }

  if (!res.ok || !res.body) {
    throw new Error(`Direct media fetch failed (${res.status})`);
  }

  let controllerSettled = false;
  let firstByteSettled = false;
  let resolveFirstByte!: () => void;
  let rejectFirstByte!: (err: DownloadFailure) => void;
  const makeDirectFailure = (message: string, midStream: boolean): DownloadFailure => {
    const failure = new Error(message) as DownloadFailure;
    failure.stderr = message;
    failure.signal = null;
    failure.code = null;
    failure.midStream = midStream;
    return failure;
  };
  const firstByte = new Promise<void>((resolve, reject) => {
    resolveFirstByte = () => {
      if (firstByteSettled) return;
      firstByteSettled = true;
      resolve();
    };
    rejectFirstByte = (err) => {
      if (firstByteSettled) return;
      firstByteSettled = true;
      reject(err);
    };
  });

  const reader = res.body.getReader();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          if (!firstByteSettled) {
            rejectFirstByte(makeDirectFailure("Direct media response was empty", false));
          }
          if (!controllerSettled) {
            controllerSettled = true;
            controller.close();
          }
          return;
        }
        resolveFirstByte();
        controller.enqueue(value);
      } catch (error) {
        const failure = makeDirectFailure(
          error instanceof Error ? error.message : "Direct media stream failed",
          firstByteSettled
        );
        rejectFirstByte(failure);
        if (!controllerSettled) {
          controllerSettled = true;
          controller.error(failure);
        }
      }
    },
    async cancel() {
      await reader.cancel();
    },
  });

  return { stream, firstByte, abort: () => void reader.cancel() };
}

/** Map a download failure to a user-friendly message + HTTP status. */
function failureMessage(signal: ReturnType<typeof classifyStderr>): string {
  switch (signal) {
    case "rateLimit":
      return "Rate limited (429). Please wait a moment and try again.";
    case "botBlock":
      return "Bot detection triggered. Please try again shortly.";
    case "nsig":
      return "Video extraction failed (signature issue). Please try again.";
    case "networkError":
      return "Network error while fetching the video. Please try again.";
    case "geoRestricted":
      return "This video is not available in the server's region.";
    case "private":
      return "This video is private or restricted.";
    case "notFound":
      return "Video not found or deleted.";
    case "formatUnavailable":
      return "The requested quality is no longer available. Try another format.";
    default:
      return "Could not download this video. Please try a different quality or try again.";
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  const formatId = searchParams.get("format") || undefined;
  const audioOnly = searchParams.get("audio") === "true";
  const progressive = searchParams.get("progressive") === "true";
  const title = searchParams.get("title") || "video";
  const uploader = searchParams.get("uploader") || "";
  const sourceUrl = searchParams.get("source") || rawUrl || "";
  const platform = searchParams.get("platform") || detectPlatform(sourceUrl)?.id || "";
  const videoId = searchParams.get("videoId") || parseVideoId(sourceUrl) || "";
  const quality = searchParams.get("quality") || (audioOnly ? "Audio" : "");
  const direct = searchParams.get("direct") === "true";
  const logoRemoval = parseLogoRemoval(searchParams);

  if (!rawUrl) {
    return new Response(JSON.stringify({ error: "Missing URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!consumeRateLimit(req, 8)) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let url: string;
  try {
    url = await assertPublicHttpUrl(sanitizeUrl(rawUrl));
  } catch {
    return Response.json({ error: "Please provide a valid public URL." }, { status: 400 });
  }

  const ext = audioOnly ? "mp3" : "mp4";
  const filename = buildDownloadFilename({
    title,
    extension: ext,
    platform,
    uploader,
    videoId,
    quality,
  });
  const ytdlp = await import("@/lib/ytdlp");

  // Trigger background yt-dlp update check
  ytdlp.ensureYtdlpFresh().catch(() => {});

  // ── yt-dlp download with retry & player client rotation ──
  // SponsorBlock support (from Arroxy) — skip/mark sponsors in YouTube videos
  const sponsorBlock = searchParams.get("sponsorblock");
  const clipStart = searchParams.get("start") || null;
  const clipEnd = searchParams.get("end") || null;

  const release = acquireDownloadSlot(url);
  if (!release) {
    return Response.json({ error: "Server is busy. Please try again shortly." }, { status: 503 });
  }

  // When an engine merges video+audio to stdout it outputs mpegts (mp4 needs
  // seekable output; pipes aren't seekable). octet-stream forces a download
  // rather than inline playback.
  const contentType = audioOnly ? "audio/mpeg" : "application/octet-stream";
  const streamHeaders = {
    "Content-Type": contentType,
    "Content-Disposition": contentDisposition(filename),
    "Transfer-Encoding": "chunked",
  };

  // Commit a 200 + stream only after the first byte is produced; release the
  // concurrency slot when the stream ends (guardStream's release is idempotent).
  const prepare = async (ds: DownloadStream): Promise<DownloadStream> => {
    const output =
      audioOnly || !logoRemoval.enabled
        ? ds
        : (await import("@/lib/logo-removal")).applyLogoRemoval(ds, logoRemoval);
    await output.firstByte;
    return output;
  };

  const respond = (ds: DownloadStream): Response =>
    new Response(guardStream(ds.stream, release), { headers: streamHeaders });

  if (direct) {
    try {
      // Scraper/CDN hostnames are allowlisted. Cobalt rotates CDN hostnames,
      // so its already-validated public result may use an unlisted host.
      // Every hop still passes assertPublicHttpUrl, including redirects.
      const directStream = await fetchPublicDirectStream(url, 0, {
        allowUnlistedHost: true,
      });
      const output = await prepare(directStream);
      return respond(output);
    } catch {
      release();
      return Response.json(
        { error: "Direct media could not be relayed safely." },
        { status: 502 }
      );
    }
  }

  // Fallback engine #1: pytubefix (secondary YouTube extractor + ffmpeg mux).
  const tryPytubefix = async (): Promise<Response | null> => {
    if (!isYouTubeUrl(url)) return null;
    try {
      const { pytubefixDownload } = await import("@/lib/pytubefix");
      const pf = await pytubefixDownload(url, formatId, audioOnly);
      const output = await prepare(pf);
      return respond(output);
    } catch {
      return null; // fall through to the next fallback
    }
  };

  // Fallback engine #2: relay a direct URL minted by Cobalt (self-hosted).
  const tryCobalt = async (): Promise<Response | null> => {
    if (!isCobaltAvailable()) return null;
    try {
      const cobalt = await cobaltDownload(url, audioOnly);
      if (cobalt.ok && (cobalt.url || cobalt.audioUrl)) {
        const target = (audioOnly && cobalt.audioUrl) || cobalt.url || cobalt.audioUrl!;
        await assertPublicHttpUrl(target);
        const directStream = await fetchPublicDirectStream(target, 0, { allowUnlistedHost: true });
        const output = await prepare(directStream);
        return respond(output);
      }
    } catch {
      /* fall through */
    }
    return null;
  };

  // A pytubefix-issued format id (pf-<itag>) can only be served by pytubefix —
  // yt-dlp doesn't understand it — so make pytubefix the primary engine here.
  if (isPytubefixFormat(formatId)) {
    const pf = await tryPytubefix();
    if (pf) return pf;
    const cobalt = await tryCobalt();
    if (cobalt) return cobalt;
    release();
    return Response.json(
      { error: failureMessage("formatUnavailable") },
      { status: 502 }
    );
  }

  // Primary engine: yt-dlp with retry & player-client rotation.
  const { stream, firstByte, abort } = ytdlp.spawnDownloadWithRetry(
    url,
    formatId,
    audioOnly,
    {
      sponsorBlock: sponsorBlock || undefined,
      progressive,
      clipStart: clipStart || undefined,
      clipEnd: clipEnd || undefined,
    }
  );

  let output: DownloadStream;
  try {
    output = await prepare({ stream, firstByte, abort });
  } catch (err) {
    abort();
    const failure = err as DownloadFailure;

    // Fallback ladder: pytubefix → Cobalt → error.
    const pf = await tryPytubefix();
    if (pf) return pf;
    const cobalt = await tryCobalt();
    if (cobalt) return cobalt;

    release();
    return Response.json(
      { error: failureMessage(failure.signal ?? classifyStderr(failure.stderr || "")) },
      { status: failure.signal === "rateLimit" ? 429 : 502 }
    );
  }

  return respond(output);
}
