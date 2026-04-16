/**
 * Chunked/Parallel Direct Downloader — inspired by OmniGet's Rust implementation.
 *
 * For direct video URLs (from scrapers), this downloads files using:
 * 1. HEAD probe to check Content-Length and Accept-Ranges
 * 2. Parallel chunk download if server supports Range requests and file > 10MB
 * 3. Single-stream fallback otherwise
 * 4. Automatic retry with exponential backoff
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
const CHUNK_THRESHOLD = 10 * 1024 * 1024; // Use chunked for files > 10MB
const MAX_PARALLEL = 8;
const MAX_RETRIES = 3;
const CHUNK_TIMEOUT = 45000;

// ─── Types ───────────────────────────────────────────────────
interface ProbeResult {
  contentLength: number | null;
  acceptRanges: boolean;
  contentType: string | null;
}

export interface DownloadProgress {
  downloaded: number;
  total: number | null;
  percent: number;
}

// ─── URL Probe ───────────────────────────────────────────────
async function probeUrl(
  url: string,
  headers?: Record<string, string>
): Promise<ProbeResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA, ...headers },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!resp.ok) {
      return { contentLength: null, acceptRanges: false, contentType: null };
    }

    const contentLength = resp.headers.get("content-length");
    const acceptRanges = resp.headers.get("accept-ranges");
    const contentType = resp.headers.get("content-type");

    return {
      contentLength: contentLength ? parseInt(contentLength, 10) : null,
      acceptRanges: acceptRanges?.includes("bytes") || false,
      contentType,
    };
  } catch {
    return { contentLength: null, acceptRanges: false, contentType: null };
  }
}

// ─── Fetch with Retry ────────────────────────────────────────
async function fetchChunkWithRetry(
  url: string,
  start: number,
  end: number,
  headers?: Record<string, string>
): Promise<ArrayBuffer> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CHUNK_TIMEOUT);

      const resp = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Range: `bytes=${start}-${end}`,
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (resp.status !== 206) {
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
          throw new Error(`HTTP ${resp.status} (fatal)`);
        }
        throw new Error(`HTTP ${resp.status}`);
      }

      return await resp.arrayBuffer();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message?.includes("(fatal)")) throw lastError;

      if (attempt < MAX_RETRIES - 1) {
        const waitMs = 1000 * (attempt + 1);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }

  throw lastError || new Error("Chunk download failed");
}

// ─── Parallel Chunked Download ───────────────────────────────
async function downloadChunked(
  url: string,
  totalSize: number,
  headers?: Record<string, string>,
  onProgress?: (progress: DownloadProgress) => void,
  abortSignal?: AbortSignal
): Promise<Buffer> {
  const numChunks = Math.ceil(totalSize / CHUNK_SIZE);
  const results: (ArrayBuffer | null)[] = new Array(numChunks).fill(null);
  let downloaded = 0;

  // Semaphore for concurrency
  let running = 0;
  const queue: Array<() => void> = [];

  async function acquire(): Promise<void> {
    if (running >= MAX_PARALLEL) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    running++;
  }

  function release(): void {
    running--;
    const next = queue.shift();
    if (next) next();
  }

  const promises = Array.from({ length: numChunks }, async (_, i) => {
    if (abortSignal?.aborted) throw new Error("Download cancelled");

    await acquire();
    try {
      if (abortSignal?.aborted) throw new Error("Download cancelled");

      const start = i * CHUNK_SIZE;
      const end = Math.min((i + 1) * CHUNK_SIZE, totalSize) - 1;

      const data = await fetchChunkWithRetry(url, start, end, headers);
      results[i] = data;

      downloaded += data.byteLength;
      if (onProgress) {
        onProgress({
          downloaded,
          total: totalSize,
          percent: (downloaded / totalSize) * 100,
        });
      }
    } finally {
      release();
    }
  });

  await Promise.all(promises);

  // Concatenate in order
  const buffers = results
    .filter((b): b is ArrayBuffer => b !== null)
    .map((ab) => Buffer.from(ab));

  return Buffer.concat(buffers);
}

// ─── Single Stream Download ──────────────────────────────────
async function downloadSingleStream(
  url: string,
  headers?: Record<string, string>,
  onProgress?: (progress: DownloadProgress) => void,
  abortSignal?: AbortSignal
): Promise<Buffer> {
  const controller = new AbortController();
  const combinedSignal = abortSignal
    ? AbortSignal.any([controller.signal, abortSignal])
    : controller.signal;

  const resp = await fetch(url, {
    headers: { "User-Agent": UA, ...headers },
    signal: combinedSignal,
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} downloading file`);
  }

  // Check for HTML response (expired URL)
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error("Server returned HTML instead of media — URL may have expired");
  }

  const contentLength = resp.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : null;

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No response body");

  const chunks: Uint8Array[] = [];
  let downloaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    downloaded += value.length;

    if (onProgress) {
      onProgress({
        downloaded,
        total,
        percent: total ? (downloaded / total) * 100 : Math.min((downloaded / (downloaded + 500000)) * 100, 95),
      });
    }
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

// ─── Main Download Function ─────────────────────────────────
/**
 * Download a direct URL using the best strategy:
 * - Parallel chunks if server supports Range and file > 10MB
 * - Single stream otherwise
 */
export async function downloadDirect(
  url: string,
  headers?: Record<string, string>,
  onProgress?: (progress: DownloadProgress) => void,
  abortSignal?: AbortSignal
): Promise<Buffer> {
  const probe = await probeUrl(url, headers);

  const useChunked =
    probe.acceptRanges &&
    probe.contentLength !== null &&
    probe.contentLength > CHUNK_THRESHOLD;

  if (useChunked) {
    try {
      return await downloadChunked(
        url,
        probe.contentLength!,
        headers,
        onProgress,
        abortSignal
      );
    } catch (err: unknown) {
      // Fallback to single stream if chunked fails
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("(fatal)") || msg.includes("cancelled")) {
        throw err;
      }
      console.warn("[chunked] Failed, falling back to single stream:", msg);
    }
  }

  return await downloadSingleStream(url, headers, onProgress, abortSignal);
}

/**
 * Download a direct URL and return as a ReadableStream.
 * Uses chunked download internally but streams the result.
 */
export function downloadDirectStream(
  url: string,
  headers?: Record<string, string>
): { stream: ReadableStream<Uint8Array>; contentType: string | null; contentLength: number | null } {
  let contentType: string | null = null;
  let contentLength: number | null = null;
  let abortController: AbortController;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      abortController = new AbortController();

      try {
        // Probe first
        const probe = await probeUrl(url, headers);
        contentType = probe.contentType;
        contentLength = probe.contentLength;

        const useChunked =
          probe.acceptRanges &&
          probe.contentLength !== null &&
          probe.contentLength > CHUNK_THRESHOLD;

        if (useChunked) {
          // For chunked: download all then enqueue
          const data = await downloadChunked(
            url,
            probe.contentLength!,
            headers,
            undefined,
            abortController.signal
          );
          controller.enqueue(new Uint8Array(data));
        } else {
          // For single stream: pipe through
          const resp = await fetch(url, {
            headers: { "User-Agent": UA, ...headers },
            signal: abortController.signal,
          });

          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

          const reader = resp.body?.getReader();
          if (!reader) throw new Error("No body");

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }

        controller.close();
      } catch (err: unknown) {
        if (!abortController.signal.aborted) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[download] Failed:", msg);
          controller.error(err);
        }
      }
    },
    cancel() {
      abortController?.abort();
    },
  });

  return { stream, contentType, contentLength };
}
