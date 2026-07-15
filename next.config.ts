import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * CSP for the app shell.
 * Dev allows 'unsafe-eval' so React / Next / Turbopack debug helpers work
 * (otherwise: "eval() is not supported in this environment").
 * Production stays strict — React does not need eval there.
 */
function contentSecurityPolicy(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] as const : []),
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
  ].join(" ");

  const connectSrc = [
    "'self'",
    "https:",
    // Turbopack / Next HMR websocket in local dev
    ...(isDev ? ["ws:", "wss:"] as const : []),
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src ${connectSrc}`,
    "frame-src https://www.youtube-nocookie.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "/api/**/*": ["./next.config.ts"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
      { protocol: "https", hostname: "**.twimg.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy(),
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
