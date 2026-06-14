import { NextRequest } from "next/server";
import { spawnDownloadWithRetry, ensureYtdlpFresh } from "@/lib/ytdlp";
import type { DownloadFailure, DownloadStream } from "@/lib/ytdlp";
import { pytubefixDownload, isPytubefixFormat } from "@/lib/pytubefix";
import { sanitizeUrl } from "@/lib/url-sanitizer";
import { classifyStderr } from "@/lib/po-token";
import { cobaltDownload, isCobaltAvailable } from "@/lib/cobalt";
import {
  acquireDownloadSlot,
  assertPublicHttpUrl,
  consumeRateLimit,
  guardStream,
} from "@/lib/request-guard";

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
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
  const direct = searchParams.get("direct") === "true";

  if (!rawUrl) {
    return new Response(JSON.stringify({ error: "Missing URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!consumeRateLimit(req, 8)) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  if (direct) {
    return Response.json({ error: "Direct URL relay is disabled." }, { status: 403 });
  }

  let url: string;
  try {
    url = await assertPublicHttpUrl(sanitizeUrl(rawUrl));
  } catch {
    return Response.json({ error: "Please provide a valid public URL." }, { status: 400 });
  }

  const safeTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, "").slice(0, 100);
  const ext = audioOnly ? "mp3" : "mp4";

  // Trigger background yt-dlp update check
  ensureYtdlpFresh().catch(() => {});

  // ── yt-dlp download with retry & player client rotation ──
  // SponsorBlock support (from Arroxy) — skip/mark sponsors in YouTube videos
  const sponsorBlock = searchParams.get("sponsorblock");

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
    "Content-Disposition": `attachment; filename="${safeTitle}.${ext}"`,
    "Transfer-Encoding": "chunked",
  };

  // Commit a 200 + stream only after the first byte is produced; release the
  // concurrency slot when the stream ends (guardStream's release is idempotent).
  const respond = (ds: DownloadStream): Response =>
    new Response(guardStream(ds.stream, release), { headers: streamHeaders });

  // Fallback engine #1: pytubefix (secondary YouTube extractor + ffmpeg mux).
  const tryPytubefix = async (): Promise<Response | null> => {
    if (!isYouTubeUrl(url)) return null;
    try {
      const pf = await pytubefixDownload(url, formatId, audioOnly);
      await pf.firstByte;
      return respond(pf);
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
        release();
        return Response.redirect(target, 302);
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
  const { stream, firstByte, abort } = spawnDownloadWithRetry(
    url,
    formatId,
    audioOnly,
    {
      sponsorBlock: sponsorBlock || undefined,
      progressive,
    }
  );

  try {
    await firstByte;
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

  return respond({ stream, firstByte, abort });
}
