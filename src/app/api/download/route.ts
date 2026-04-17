import { NextRequest } from "next/server";
import { spawnDownloadWithRetry, ensureYtdlpFresh } from "@/lib/ytdlp";
import { downloadDirectStream } from "@/lib/chunked-download";
import { downloadHlsStream, isHlsUrl } from "@/lib/hls";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const formatId = searchParams.get("format") || undefined;
  const audioOnly = searchParams.get("audio") === "true";
  const title = searchParams.get("title") || "video";
  const proxy = searchParams.get("proxy") || undefined;
  const direct = searchParams.get("direct") === "true";

  if (!url) {
    return new Response(JSON.stringify({ error: "Missing URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const safeTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, "").slice(0, 100);
  const ext = audioOnly ? "mp3" : "mp4";

  // Trigger background yt-dlp update check
  ensureYtdlpFresh().catch(() => {});

  // ── Direct URL download (from scrapers) ──
  if (direct) {
    // HLS stream
    if (isHlsUrl(url)) {
      const referer = searchParams.get("referer") || "";
      const stream = downloadHlsStream(url, referer);

      return new Response(stream, {
        headers: {
          "Content-Type": "video/mp2t",
          "Content-Disposition": `attachment; filename="${safeTitle}.ts"`,
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // Direct file download with chunked/parallel support
    const { stream } = downloadDirectStream(url);

    return new Response(stream, {
      headers: {
        "Content-Type": audioOnly ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="${safeTitle}.${ext}"`,
        "Transfer-Encoding": "chunked",
      },
    });
  }

  // ── yt-dlp download with retry & player client rotation ──
  const { stream } = spawnDownloadWithRetry(url, formatId, audioOnly, {
    proxy,
  });

  // When yt-dlp merges video+audio via ffmpeg to stdout, it outputs mpegts
  // (mp4 container requires seekable output, pipes are not seekable).
  // Use application/octet-stream to force browser download instead of inline play.
  const contentType = audioOnly ? "audio/mpeg" : "application/octet-stream";

  return new Response(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeTitle}.${ext}"`,
      "Transfer-Encoding": "chunked",
    },
  });
}
