import { isIP } from "net";
import { lookup } from "dns/promises";
import type { NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const TRUST_PROXY_HEADERS = process.env.VIDGRAB_TRUST_PROXY_HEADERS === "true";
const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup to prevent memory leak from expired buckets
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function cleanupExpiredBuckets(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// Concurrency: a global cap across all downloads plus a per-platform cap, so a
// burst of YouTube downloads can't starve TikTok/Facebook (and vice-versa) and
// no single platform gets hammered hard enough to trip its rate limiter.
const GLOBAL_MAX_DOWNLOADS = 4;
const PER_HOST_MAX_DOWNLOADS = 2;
let activeDownloads = 0;
const perHostDownloads = new Map<string, number>();

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some(Number.isNaN)) return true;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4);

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<string> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP(S) URLs are supported");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Private network URLs are not allowed");
  }

  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (
    addresses.length === 0 ||
    addresses.some(({ address, family }) =>
      family === 4 ? isPrivateIpv4(address) : isPrivateIpv6(address)
    )
  ) {
    throw new Error("Private network URLs are not allowed");
  }

  return parsed.toString();
}

export function getClientIp(req: NextRequest): string {
  if (!TRUST_PROXY_HEADERS) {
    return "direct";
  }

  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function consumeRateLimit(req: NextRequest, limit = MAX_REQUESTS_PER_WINDOW): boolean {
  cleanupExpiredBuckets();
  const now = Date.now();
  const key = getClientIp(req);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

/**
 * Coarse platform key for per-host concurrency (youtube / tiktok / facebook /
 * instagram / twitter, else the registrable-ish hostname). Keeps unrelated
 * platforms from sharing — and competing for — the same concurrency budget.
 */
export function platformKey(url: string): string {
  const u = url.toLowerCase();
  if (/youtube\.com|youtu\.be|googlevideo\.com/.test(u)) return "youtube";
  if (/tiktok\.com|tikwm\.com/.test(u)) return "tiktok";
  if (/facebook\.com|fb\.watch|fb\.com|fbcdn/.test(u)) return "facebook";
  if (/instagram\.com|instagr\.am|cdninstagram/.test(u)) return "instagram";
  if (/twitter\.com|x\.com|twimg\.com/.test(u)) return "twitter";
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "other";
  }
}

/**
 * Acquire a download slot under both a global cap and a per-platform cap.
 * Returns an idempotent release fn, or null if either cap is already reached
 * (caller should respond 503). Pass the source URL/host so the per-platform
 * budget is tracked independently.
 */
export function acquireDownloadSlot(
  host?: string,
  opts?: { globalMax?: number; perHostMax?: number }
): (() => void) | null {
  const globalMax = opts?.globalMax ?? GLOBAL_MAX_DOWNLOADS;
  const perHostMax = opts?.perHostMax ?? PER_HOST_MAX_DOWNLOADS;
  const key = host ? platformKey(host) : "_";

  if (activeDownloads >= globalMax) return null;
  const hostCount = perHostDownloads.get(key) ?? 0;
  if (hostCount >= perHostMax) return null;

  activeDownloads++;
  perHostDownloads.set(key, hostCount + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeDownloads = Math.max(0, activeDownloads - 1);
    const next = (perHostDownloads.get(key) ?? 1) - 1;
    if (next <= 0) perHostDownloads.delete(key);
    else perHostDownloads.set(key, next);
  };
}

export function guardStream(
  source: ReadableStream<Uint8Array>,
  release: () => void
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          release();
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        release();
        controller.error(error);
      }
    },
    async cancel() {
      release();
      await reader.cancel();
    },
  });
}
