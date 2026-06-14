import { isIP } from "net";
import { lookup } from "dns/promises";
import type { NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();
let activeDownloads = 0;

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
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
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
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function consumeRateLimit(req: NextRequest, limit = MAX_REQUESTS_PER_WINDOW): boolean {
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

export function acquireDownloadSlot(maxConcurrent = 2): (() => void) | null {
  if (activeDownloads >= maxConcurrent) return null;
  activeDownloads++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeDownloads = Math.max(0, activeDownloads - 1);
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
