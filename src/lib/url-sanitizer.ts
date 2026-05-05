/**
 * URL Sanitizer — strips tracking parameters and unwraps redirect URLs.
 * Inspired by Arroxy's auto-clean URLs feature.
 *
 * Removes: si, pp, utm_*, fbclid, gclid, and unwraps youtube.com/redirect links.
 */

const TRACKING_PARAMS = new Set([
  'si',
  'pp',
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'twclid',
  'igshid',
  'feature',
  'app',
  'src',
  'kw',
  'srsltid',
  'mkt_tok',
]);

const UTM_PREFIX = 'utm_';

// Additional patterns from Arroxy's url.ts
const GLOBAL_TRACKING_PATTERNS = [
  /^utm_/i,
  /^fbclid$/i,
  /^_ga$/i,
  /^_gl$/i,
  /^srsltid$/i,
  /^msclkid$/i,
  /^mkt_tok$/i,
  /^mc_(eid|cid|tc)$/i,
];

/**
 * Strip tracking parameters from a URL while preserving functional params.
 */
export function sanitizeUrl(rawUrl: string): string {
  try {
    let url = rawUrl.trim();

    // Unwrap youtube.com/redirect?q=<actual_url>
    if (url.includes('youtube.com/redirect')) {
      const parsed = new URL(url);
      const target = parsed.searchParams.get('q');
      if (target && /^https?:\/\//i.test(target)) {
        url = target;
      }
    }

    const parsed = new URL(url);

    // Don't strip params from signin URLs (from Arroxy's url.ts)
    if (parsed.hostname.includes('youtube.com') && parsed.pathname === '/signin') {
      return url;
    }

    // Remove tracking params
    const keysToDelete: string[] = [];
    for (const key of parsed.searchParams.keys()) {
      const lower = key.toLowerCase();
      if (TRACKING_PARAMS.has(lower) || lower.startsWith(UTM_PREFIX)) {
        keysToDelete.push(key);
      } else if (GLOBAL_TRACKING_PATTERNS.some((re) => re.test(key))) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      parsed.searchParams.delete(key);
    }

    return parsed.toString();
  } catch {
    // If URL parsing fails, return as-is
    return rawUrl.trim();
  }
}

/**
 * Extract video ID from a YouTube URL.
 */
export function parseVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // youtube.com/watch?v=ID
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;

      // youtube.com/shorts/ID or youtube.com/embed/ID
      const pathMatch = parsed.pathname.match(/\/(shorts|embed|v)\/([^/?]+)/);
      if (pathMatch) return pathMatch[2];
    }

    // youtu.be/ID
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}
