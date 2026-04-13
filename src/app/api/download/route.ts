import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { buildDownloadArgs } from "@/lib/ytdlp";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const formatId = searchParams.get("format") || undefined;
  const audioOnly = searchParams.get("audio") === "true";
  const title = searchParams.get("title") || "video";
  const proxy = searchParams.get("proxy") || undefined;

  if (!url) {
    return new Response(JSON.stringify({ error: "Missing URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const safeTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, "").slice(0, 100);
  const ext = audioOnly ? "mp3" : "mp4";

  const args = buildDownloadArgs(url, formatId, audioOnly, { proxy });
  const proc = spawn("yt-dlp", args);

  const stream = new ReadableStream({
    start(controller) {
      proc.stdout.on("data", (chunk: Buffer) => {
        controller.enqueue(chunk);
      });

      proc.stderr.on("data", (data: Buffer) => {
        console.error("yt-dlp stderr:", data.toString());
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          console.error(`yt-dlp exited with code ${code}`);
        }
        controller.close();
      });

      proc.on("error", (err) => {
        console.error("yt-dlp process error:", err);
        controller.error(err);
      });
    },
    cancel() {
      proc.kill("SIGTERM");
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": audioOnly ? "audio/mpeg" : "video/mp4",
      "Content-Disposition": `attachment; filename="${safeTitle}.${ext}"`,
      "Transfer-Encoding": "chunked",
    },
  });
}
