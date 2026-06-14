/**
 * PO Token (Proof of Origin) Service — Server-side implementation.
 *
 * Inspired by Arroxy's HiddenWindowTokenProvider, adapted for a Node.js
 * server environment using yt-dlp's built-in PO token support.
 *
 * Strategy:
 * Arroxy uses Electron's hidden BrowserWindow to load YouTube and scrape
 * the WebPoClient (bevasrs.wpc) to mint tokens. In a server environment,
 * we can't easily run a full browser, so we use a different approach:
 *
 * 1. Use yt-dlp's native --extractor-args with po_token when available
 * 2. Fall back to player client rotation that avoids PoT-requiring clients
 * 3. Use the "default,-web,-web_safari" fallback (Arroxy's PLAYER_CLIENT_FALLBACK)
 *
 * The key insight from Arroxy: skip the player clients that demand a PoT,
 * so the non-PoT download path works without needing to mint anything.
 */

// ─── Token Cache ─────────────────────────────────────────────
const TTL_MS = 5 * 60 * 60 * 1_000; // 5 hours (within ~6h token lifetime)

interface TokenCache {
  visitorData: string;
  mintedAt: number;
}

let tokenCache: TokenCache | null = null;

/**
 * Get cached visitor data if still valid.
 */
export function getCachedVisitorData(): string | null {
  if (!tokenCache) return null;
  if (Date.now() - tokenCache.mintedAt > TTL_MS) {
    tokenCache = null;
    return null;
  }
  return tokenCache.visitorData;
}

/**
 * Invalidate the token cache (e.g., after a bot-block error).
 */
export function invalidateTokenCache(): void {
  tokenCache = null;
}

// ─── Player-client ladders (PoT-aware) ───────────────────────

/**
 * YouTube now gates its good formats behind a Proof-of-Origin (PO) token, so
 * which player clients actually extract depends entirely on whether a PO-token
 * provider (the bgutil sidecar) is reachable. Two ladders, picked at runtime:
 *
 *  WITHOUT a token — empirically (yt-dlp 2026.03.17, datacenter/residential IP)
 *  only `android_vr` extracts reliably: `tv`/`web_safari` report "DRM
 *  protected", `mweb` reports "no formats", `ios`/`web_creator` demand sign-in.
 *  So lead with `android_vr` (gives up to 1080p avc1/vp9/av01) and only then
 *  give the alternates a shot — YouTube's behaviour varies by video/IP.
 *
 *  WITH a token (BGUTIL_POT_BASE_URL set) — `tv,web_safari` expose the richest
 *  formats (1080p+/HDR/AV1) and the plugin mints the token via fetch_pot=auto,
 *  so lead with them and keep `android_vr` as the guaranteed last rung.
 *
 * `use_ad_playback_context=true` (mweb / web_music only) skips the mandatory
 * preroll-ad wait before a download starts.
 */
export type RetryStrategy =
  | { kind: 'primary'; attempt: 0 }
  | { kind: 'alternative'; attempt: 1 }
  | { kind: 'fallback'; attempt: 2 };

const NO_POT_LADDER: Record<number, string> = {
  0: 'youtube:player_client=android_vr',
  1: 'youtube:player_client=tv',
  2: 'youtube:player_client=mweb;use_ad_playback_context=true',
};

const POT_LADDER: Record<number, string> = {
  0: 'youtube:player_client=tv,web_safari',
  1: 'youtube:player_client=mweb;use_ad_playback_context=true',
  2: 'youtube:player_client=android_vr',
};

/**
 * Get the extractor args for a given retry attempt. `hasPot` should be true
 * when a PO-token provider (BGUTIL_POT_BASE_URL) is configured, which selects
 * the format-rich ladder instead of the token-free one.
 */
export function getExtractorArgsForAttempt(attempt: number, hasPot = false): string {
  const ladder = hasPot ? POT_LADDER : NO_POT_LADDER;
  return ladder[Math.min(attempt, 2)];
}

/** The lead (attempt-0) client string — used for playlists & single-shot downloads. */
export function defaultPlayerClient(hasPot = false): string {
  return getExtractorArgsForAttempt(0, hasPot);
}

/**
 * @deprecated Kept for backward compatibility; prefer defaultPlayerClient(hasPot).
 * Defaults to the token-free lead client.
 */
export const PLAYER_CLIENT_FALLBACK = NO_POT_LADDER[0];

/**
 * Merge the bgutil PO-token provider base URL into a `youtube:` extractor-arg
 * string.
 *
 * CRITICAL: yt-dlp does NOT merge repeated `--extractor-args youtube:...`
 * flags — the last one silently overrides the earlier one (verified: passing
 * player_client in one flag and getpot in another makes yt-dlp fall back to
 * the default clients). The getpot key therefore MUST live in the SAME string
 * as player_client, joined with ';'.
 *
 * When the provider HTTP server (bgutil-ytdlp-pot-provider sidecar) is
 * configured, this lets the yt-dlp plugin mint Proof-of-Origin tokens so
 * YouTube web/tv clients work from datacenter IPs without bot-blocks.
 *
 * Returns the input unchanged when no provider URL is configured.
 */
export function withPotProvider(
  youtubeExtractorArgs: string,
  baseUrl: string | undefined,
): string {
  if (!baseUrl) return youtubeExtractorArgs;
  return `${youtubeExtractorArgs};getpot_bgutil_baseurl=${baseUrl}`;
}

/**
 * Determine if an error is a bot-block that warrants retry.
 */
export function isBotBlockError(stderr: string): boolean {
  const lower = stderr.toLowerCase();
  return (
    /sign in to confirm|confirm you'?re not a bot/i.test(lower) ||
    /http error 403/i.test(lower) ||
    /\bbot\b.*detect/i.test(lower) ||
    /player_client.*unavailable/i.test(lower)
  );
}

/**
 * Determine if an error is a rate limit (429).
 */
export function isRateLimitError(stderr: string): boolean {
  return /http error 429|too many requests/i.test(stderr.toLowerCase());
}

/**
 * Determine if an error is related to nsig/signature decoding.
 */
export function isNsigError(stderr: string): boolean {
  return /nsig|n_sig|signature/i.test(stderr.toLowerCase());
}

/**
 * Classify stderr output into actionable signal categories.
 * Inspired by Arroxy's classifyStderr utility.
 */
export type StderrSignal =
  | 'botBlock'
  | 'rateLimit'
  | 'nsig'
  | 'formatUnavailable'
  | 'networkError'
  | 'geoRestricted'
  | 'private'
  | 'notFound'
  | null;

export function classifyStderr(stderr: string): StderrSignal {
  if (isBotBlockError(stderr)) return 'botBlock';
  if (isRateLimitError(stderr)) return 'rateLimit';
  if (isNsigError(stderr)) return 'nsig';
  if (/requested format.*not available|no video formats/i.test(stderr)) return 'formatUnavailable';
  if (/\b(?:timed? out|timeout|econn(?:reset|refused|aborted)|enotfound|getaddrinfo)\b/i.test(stderr)) return 'networkError';
  if (/geo.?restrict|not available in your country/i.test(stderr)) return 'geoRestricted';
  if (/private|restricted|members.only/i.test(stderr)) return 'private';
  if (/unavailable|not found|404|does not exist|deleted/i.test(stderr)) return 'notFound';
  return null;
}

/**
 * Extract the last ERROR: line from yt-dlp stderr.
 * From Arroxy's ytdlpErrors.ts — useful for showing the most relevant error.
 */
export function extractLastError(stderr: string): string | null {
  const matches = stderr.match(/ERROR:.*$/gm);
  return matches ? matches[matches.length - 1].replace(/^ERROR:\s*/, '').trim() : null;
}

/**
 * Determine if an error is age-restricted content.
 * From Arroxy's error classification.
 */
export function isAgeRestrictedError(stderr: string): boolean {
  return /age.?restricted|sign in to confirm your age/i.test(stderr);
}

/**
 * Determine if an error is a disk space issue.
 * From Arroxy's PreflightPhase.
 */
export function isDiskSpaceError(stderr: string): boolean {
  return /no space left on device|disk quota exceeded|not enough storage|enospc/i.test(stderr.toLowerCase());
}
