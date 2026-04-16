/**
 * HLS (M3U8) Downloader — inspired by OmniGet's Rust implementation.
 *
 * Downloads HLS streams by:
 * 1. Fetching & parsing the M3U8 playlist
 * 2. Selecting the best quality variant
 * 3. Downloading segments in parallel
 * 4. Concatenating into a single TS/MP4 file
 * 5. Supporting AES-128 decryption
 */

import { createDecipheriv } from "crypto";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const MAX_CONCURRENT = 8;
const MAX_RETRIES = 3;
const SEGMENT_TIMEOUT = 30000;

// ─── Types ───────────────────────────────────────────────────
interface HlsVariant {
  uri: string;
  bandwidth: number;
  resolution?: { width: number; height: number };
}

interface HlsSegment {
  uri: string;
  duration: number;
}

interface HlsEncryption {
  method: string;
  keyUri: string;
  iv?: string;
}

export interface HlsDownloadProgress {
  downloaded: number;
  total: number;
  percent: number;
}

// ─── M3U8 Parser ─────────────────────────────────────────────
function parseMasterPlaylist(text: string, baseUrl: string): HlsVariant[] {
  const variants: HlsVariant[] = [];
  const lines = text.split("\n").map((l) => l.trim());

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXT-X-STREAM-INF:")) {
      const attrs = lines[i].substring(18);
      const bandwidth = parseInt(
        attrs.match(/BANDWIDTH=(\d+)/)?.[1] || "0",
        10
      );
      const resMatch = attrs.match(/RESOLUTION=(\d+)x(\d+)/);
      const resolution = resMatch
        ? { width: parseInt(resMatch[1]), height: parseInt(resMatch[2]) }
        : undefined;

      const uri = lines[i + 1];
      if (uri && !uri.startsWith("#")) {
        variants.push({
          uri: resolveUrl(baseUrl, uri),
          bandwidth,
          resolution,
        });
      }
    }
  }

  return variants;
}

function parseMediaPlaylist(
  text: string,
  baseUrl: string
): { segments: HlsSegment[]; encryption?: HlsEncryption; mediaSequence: number } {
  const segments: HlsSegment[] = [];
  let encryption: HlsEncryption | undefined;
  let mediaSequence = 0;
  let currentDuration = 0;

  const lines = text.split("\n").map((l) => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#EXT-X-MEDIA-SEQUENCE:")) {
      mediaSequence = parseInt(line.substring(22), 10) || 0;
    }

    if (line.startsWith("#EXT-X-KEY:")) {
      const attrs = line.substring(11);
      const method = attrs.match(/METHOD=([^,]+)/)?.[1] || "NONE";
      const keyUri = attrs.match(/URI="([^"]+)"/)?.[1] || "";
      const iv = attrs.match(/IV=([^,]+)/)?.[1];

      if (method === "AES-128" && keyUri) {
        encryption = {
          method,
          keyUri: resolveUrl(baseUrl, keyUri),
          iv,
        };
      }
    }

    if (line.startsWith("#EXTINF:")) {
      currentDuration = parseFloat(line.substring(8).split(",")[0]) || 0;
    } else if (!line.startsWith("#") && line.length > 0) {
      segments.push({
        uri: resolveUrl(baseUrl, line),
        duration: currentDuration,
      });
      currentDuration = 0;
    }
  }

  return { segments, encryption, mediaSequence };
}

// ─── URL Resolution ──────────────────────────────────────────
function resolveUrl(base: string, relative: string): string {
  if (relative.startsWith("http://") || relative.startsWith("https://")) {
    return relative;
  }
  try {
    return new URL(relative, base).href;
  } catch {
    // Fallback: manual resolution
    const baseNoQuery = base.split("?")[0];
    const lastSlash = baseNoQuery.lastIndexOf("/");
    return lastSlash >= 0
      ? baseNoQuery.substring(0, lastSlash + 1) + relative
      : relative;
  }
}

// ─── Variant Selection ───────────────────────────────────────
function selectBestVariant(
  variants: HlsVariant[],
  maxHeight: number = 1080
): HlsVariant | null {
  if (variants.length === 0) return null;

  // Sort by height ascending
  const sorted = [...variants].sort(
    (a, b) =>
      (a.resolution?.height || 0) - (b.resolution?.height || 0)
  );

  // Pick the highest that doesn't exceed maxHeight
  let best: HlsVariant | null = null;
  for (const v of sorted) {
    if (!v.resolution || v.resolution.height <= maxHeight) {
      best = v;
    }
  }

  // Fallback to lowest if all exceed
  return best || sorted[0];
}

// ─── Fetch with Retry ────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  referer: string,
  maxRetries: number = MAX_RETRIES,
  timeout: number = SEGMENT_TIMEOUT
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const resp = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Referer: referer,
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!resp.ok) {
        const code = resp.status;
        // Fatal client errors (except 429, 408)
        if (code >= 400 && code < 500 && code !== 429 && code !== 408) {
          throw new Error(`HTTP ${code} (fatal)`);
        }
        throw new Error(`HTTP ${code}`);
      }

      return resp;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.message?.includes("(fatal)")) throw lastError;

      if (attempt < maxRetries - 1) {
        const base = 500 * (attempt + 1);
        const jitter = Math.random() * (base / 2);
        await new Promise((r) => setTimeout(r, base + jitter));
      }
    }
  }

  throw lastError || new Error(`Fetch failed after ${maxRetries} attempts`);
}

// ─── AES-128 Decryption ─────────────────────────────────────
function computeIv(
  encryption: HlsEncryption,
  segmentIndex: number,
  mediaSequence: number
): Uint8Array {
  if (encryption.iv) {
    const hex = encryption.iv.replace(/^0[xX]/, "").padStart(32, "0");
    return Buffer.from(hex, "hex");
  }
  // Default IV = media sequence number + segment index
  const seq = mediaSequence + segmentIndex;
  const iv = Buffer.alloc(16, 0);
  iv.writeBigUInt64BE(BigInt(seq), 8);
  return iv;
}

function decryptSegment(
  data: Uint8Array,
  keyBytes: Uint8Array,
  iv: Uint8Array
): Buffer {
  const decipher = createDecipheriv(
    "aes-128-cbc",
    keyBytes as unknown as Buffer,
    iv as unknown as Buffer
  );
  return Buffer.concat([
    decipher.update(Buffer.from(data)),
    decipher.final(),
  ]);
}

// ─── Main HLS Download Function ─────────────────────────────
export async function downloadHls(
  m3u8Url: string,
  referer: string = "",
  maxHeight: number = 1080,
  onProgress?: (progress: HlsDownloadProgress) => void,
  abortSignal?: AbortSignal
): Promise<Buffer> {
  // Step 1: Fetch the M3U8
  const resp = await fetchWithRetry(m3u8Url, referer);
  const text = await resp.text();

  // Step 2: Determine if master or media playlist
  let mediaUrl = m3u8Url;
  let mediaText = text;

  if (text.includes("#EXT-X-STREAM-INF:")) {
    // Master playlist — select best variant
    const variants = parseMasterPlaylist(text, m3u8Url);
    const best = selectBestVariant(variants, maxHeight);
    if (!best) throw new Error("No suitable HLS variant found");

    mediaUrl = best.uri;
    const mediaResp = await fetchWithRetry(mediaUrl, referer);
    mediaText = await mediaResp.text();
  }

  // Step 3: Parse media playlist
  const { segments, encryption, mediaSequence } = parseMediaPlaylist(
    mediaText,
    mediaUrl
  );

  if (segments.length === 0) {
    throw new Error("No segments found in HLS playlist");
  }

  // Step 4: Fetch encryption key if needed
  let keyBytes: Uint8Array | undefined;
  if (encryption) {
    if (encryption.method === "SAMPLE-AES") {
      throw new Error("SAMPLE-AES (DRM) streams are not supported");
    }
    const keyResp = await fetchWithRetry(encryption.keyUri, referer);
    keyBytes = new Uint8Array(await keyResp.arrayBuffer());
  }

  // Step 5: Download segments in parallel with ordered output
  const totalSegments = segments.length;
  const results: (Buffer | null)[] = new Array(totalSegments).fill(null);
  let downloaded = 0;

  // Semaphore for concurrency control
  let running = 0;
  const queue: Array<() => void> = [];

  async function acquireSemaphore(): Promise<void> {
    if (running >= MAX_CONCURRENT) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    running++;
  }

  function releaseSemaphore(): void {
    running--;
    const next = queue.shift();
    if (next) next();
  }

  const downloadPromises = segments.map(async (seg, index) => {
    if (abortSignal?.aborted) throw new Error("Download cancelled");

    await acquireSemaphore();
    try {
      if (abortSignal?.aborted) throw new Error("Download cancelled");

      const segResp = await fetchWithRetry(seg.uri, referer);
      let data: Buffer = Buffer.from(await segResp.arrayBuffer()) as Buffer;

      // Decrypt if needed
      if (encryption && keyBytes) {
        const iv = computeIv(encryption, index, mediaSequence);
        data = decryptSegment(data, keyBytes, iv) as Buffer;
      }

      results[index] = data;
      downloaded++;

      if (onProgress) {
        onProgress({
          downloaded,
          total: totalSegments,
          percent: (downloaded / totalSegments) * 100,
        });
      }
    } finally {
      releaseSemaphore();
    }
  });

  await Promise.all(downloadPromises);

  // Step 6: Concatenate in order
  const buffers = results.filter((b): b is Buffer => b !== null);
  if (buffers.length !== totalSegments) {
    throw new Error(
      `Only ${buffers.length}/${totalSegments} segments downloaded`
    );
  }

  return Buffer.concat(buffers);
}

/**
 * Download HLS stream and return as a ReadableStream for streaming response.
 * Segments are streamed in order as they complete.
 */
export function downloadHlsStream(
  m3u8Url: string,
  referer: string = "",
  maxHeight: number = 1080
): ReadableStream<Uint8Array> {
  let abortController: AbortController;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      abortController = new AbortController();

      try {
        const data = await downloadHls(
          m3u8Url,
          referer,
          maxHeight,
          undefined,
          abortController.signal
        );
        controller.enqueue(new Uint8Array(data));
        controller.close();
      } catch (err: unknown) {
        if (!abortController.signal.aborted) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[HLS] Download failed:", msg);
          controller.error(err);
        }
      }
    },
    cancel() {
      abortController?.abort();
    },
  });
}

/**
 * Check if a URL looks like an HLS stream.
 */
export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}
