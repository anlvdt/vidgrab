import { spawn } from "child_process";
import type { DownloadFailure, DownloadStream } from "./ytdlp";

export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface LogoRemovalOptions {
  enabled: boolean;
  position: LogoPosition;
}

const FFMPEG_BIN = process.env.FFMPEG_BIN || "ffmpeg";

export function parseLogoRemoval(searchParams: URLSearchParams): LogoRemovalOptions {
  const enabled = searchParams.get("logo") === "blur";
  const raw = searchParams.get("logoPosition");
  const position: LogoPosition =
    raw === "top-left" ||
    raw === "top-right" ||
    raw === "bottom-left" ||
    raw === "bottom-right"
      ? raw
      : "top-right";

  return { enabled, position };
}

function blurCornerFilter(position: LogoPosition): string {
  const width = 120;
  const height = 54;
  const margin = 12;
  const cropX = position.endsWith("right")
    ? `max(in_w-${width + margin}\\,0)`
    : String(margin);
  const cropY = position.startsWith("bottom")
    ? `max(in_h-${height + margin}\\,0)`
    : String(margin);
  const overlayX = position.endsWith("right") ? `W-w-${margin}` : String(margin);
  const overlayY = position.startsWith("bottom") ? `H-h-${margin}` : String(margin);

  return `[0:v]split=2[base][logo];[logo]crop=${width}:${height}:${cropX}:${cropY},boxblur=8:1[blur];[base][blur]overlay=${overlayX}:${overlayY}[v]`;
}

function makeFailure(msg: string, stderr: string, midStream: boolean): DownloadFailure {
  const err = new Error(msg) as DownloadFailure;
  err.stderr = stderr;
  err.signal = null;
  err.code = null;
  err.midStream = midStream;
  return err;
}

export function applyLogoRemoval(
  source: DownloadStream,
  opts: LogoRemovalOptions
): DownloadStream {
  if (!opts.enabled) return source;

  let proc: ReturnType<typeof spawn> | null = null;
  let firstByteSeen = false;
  let aborted = false;
  let controllerSettled = false;

  let resolveFirstByte!: () => void;
  let rejectFirstByte!: (err: DownloadFailure) => void;
  let firstByteSettled = false;
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

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const closeController = () => {
        if (controllerSettled) return;
        controllerSettled = true;
        controller.close();
      };
      const errorController = (failure: DownloadFailure) => {
        if (controllerSettled) return;
        controllerSettled = true;
        controller.error(failure);
      };

      proc = spawn(FFMPEG_BIN, [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-filter_complex",
        blurCornerFilter(opts.position),
        "-map",
        "[v]",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-f",
        "mpegts",
        "pipe:1",
      ]);

      let stderrBuf = "";
      proc.stderr?.on("data", (data: Buffer) => {
        stderrBuf += data.toString();
      });

      proc.stdout?.on("data", (chunk: Buffer) => {
        firstByteSeen = true;
        resolveFirstByte();
        controller.enqueue(new Uint8Array(chunk));
      });

      proc.on("close", (code) => {
        if (aborted) return;
        if (code === 0) {
          closeController();
          return;
        }
        const failure = makeFailure(
          `Logo removal failed (code ${code})`,
          stderrBuf,
          firstByteSeen
        );
        rejectFirstByte(failure);
        errorController(failure);
      });

      proc.on("error", (err) => {
        const failure = makeFailure(err.message || "Logo removal process error", err.message || "", firstByteSeen);
        rejectFirstByte(failure);
        errorController(failure);
      });

      void (async () => {
        const reader = source.stream.getReader();
        try {
          await source.firstByte;
          while (!aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value?.length && proc?.stdin?.writable) {
              const ok = proc.stdin.write(Buffer.from(value));
              if (!ok) {
                await new Promise<void>((resolve) => proc?.stdin?.once("drain", resolve));
              }
            }
          }
          proc?.stdin?.end();
        } catch (error) {
          const maybeFailure = error as Error & { stderr?: unknown };
          const failure =
            error instanceof Error
              ? makeFailure(error.message, maybeFailure.stderr ? String(maybeFailure.stderr) : error.message, firstByteSeen)
              : makeFailure("Logo removal input failed", String(error), firstByteSeen);
          rejectFirstByte(failure);
          errorController(failure);
          proc?.kill("SIGTERM");
        }
      })();
    },
    cancel() {
      aborted = true;
      source.abort();
      proc?.kill("SIGTERM");
    },
  });

  return {
    stream,
    firstByte,
    abort: () => {
      aborted = true;
      source.abort();
      proc?.kill("SIGTERM");
    },
  };
}
