/** Filename utilities shared by every download engine and HTTP route. */

const CONTROL_OR_RESERVED = /[\u0000-\u001f\u007f<>:"/\\|?*]/gu;
const BIDI_MARKS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu;
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu;

function limitUnicode(value: string, maxLength: number): string {
  return Array.from(value).slice(0, maxLength).join("");
}

/**
 * Make a safe, readable filename segment without destroying Vietnamese or
 * other legitimate Unicode text. The result is safe on Windows, macOS and
 * Linux and cannot contain path separators or control characters.
 */
export function sanitizeFilename(input: string, maxLength = 120): string {
  if (!input || typeof input !== "string") return "video";

  let sanitized = input
    .normalize("NFKC")
    .replace(BIDI_MARKS, "")
    .replace(CONTROL_OR_RESERVED, " ")
    .replace(/\.\.+/gu, ".")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/^[. ]+|[. ]+$/gu, "");

  if (!sanitized) sanitized = "video";
  sanitized = limitUnicode(sanitized, maxLength).replace(/[. ]+$/gu, "");
  if (!sanitized) sanitized = "video";
  if (WINDOWS_RESERVED_NAME.test(sanitized)) sanitized = `_${sanitized}`;

  return sanitized;
}

function normalizeExtension(extension: string): string {
  const normalized = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return normalized || "mp4";
}

export interface DownloadFilenameOptions {
  title: string;
  extension: string;
  platform?: string;
  uploader?: string;
  videoId?: string;
  quality?: string;
  maxLength?: number;
}

/**
 * Deterministic professional convention:
 *   Title - by Uploader [Platform] [Quality] [ID].ext
 */
export function buildDownloadFilename(options: DownloadFilenameOptions): string {
  const maxLength = options.maxLength ?? 180;
  const title = sanitizeFilename(options.title, 110);
  const uploader = options.uploader
    ? `by ${sanitizeFilename(options.uploader, 42)}`
    : "";
  const platform = options.platform
    ? `[${sanitizeFilename(options.platform, 24)}]`
    : "";
  const quality = options.quality
    ? `[${sanitizeFilename(options.quality, 18)}]`
    : "";
  const videoId = options.videoId
    ? `[${sanitizeFilename(options.videoId, 32)}]`
    : "";

  const suffix = [uploader, platform, quality, videoId].filter(Boolean).join(" ");
  const base = suffix ? `${title} - ${suffix}` : title;
  const limitedBase = limitUnicode(base, Math.max(1, maxLength - 5)).replace(/[. ]+$/gu, "");
  return `${limitedBase || "video"}.${normalizeExtension(options.extension)}`;
}

/** RFC 5987 Content-Disposition with an ASCII fallback for older browsers. */
export function contentDisposition(filename: string): string {
  const asciiFallback = filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^\x20-\x7e]/gu, "_")
    .replace(/["\\]/gu, "_")
    .replace(/\s+/gu, " ")
    .trim() || "video.mp4";

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/** Backwards-compatible helper for callers that only have title + extension. */
export function getDownloadFilename(
  title: string,
  extension: string,
  maxTitleLength = 100
): string {
  return buildDownloadFilename({ title, extension, maxLength: maxTitleLength + extension.length + 1 });
}
