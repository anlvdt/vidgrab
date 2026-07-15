# VidGrab

VidGrab is a Next.js video downloader for public video links from popular
platforms in Vietnam. It is configured to run from the iNET domain
`https://vidgrab.io.vn`.

Layout, spacing, and content widths follow **[design.md](./design.md)**
(international web measure, 8-pt grid, capped shell for 16:9).

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production on iNET

Important URL ownership:

- `https://vidgrab.io.vn` must serve the VidGrab social video downloader.
- The World Cup 2026 forecast dashboard must only be served from
  `https://vidgrab.io.vn/wc26/index.html#knockout`.
- Do not copy or extract a WC26 `index.html` into the domain root. A top-level
  `public_html/vidgrab.io.vn/index.html` can override the VidGrab app.

The production path is Docker Compose on the iNET host/domain:

```bash
docker compose up -d --build
```

The compose stack publishes the app on port `3000` and sets:

```bash
NEXT_PUBLIC_SITE_URL=https://vidgrab.io.vn
```

Point `vidgrab.io.vn` at the iNET server or hosting proxy that serves this
container. Keep TLS/proxy settings in iNET or the server reverse proxy.

## Runtime Services

The Docker image includes:

- `yt-dlp` for primary extraction
- `pytubefix` as a YouTube fallback
- `ffmpeg` for media handling

The Compose stack also starts:

- `bgutil-pot`, a YouTube PO-token sidecar
- `cobalt`, an optional fallback API for supported platforms

The extraction pipeline is intentionally layered: yt-dlp is the universal
extractor, yt-dlp-ejs plus the configured JavaScript runtime handle modern
YouTube challenges, ffmpeg muxes/transcodes streams, pytubefix is a YouTube
fallback, and self-hosted Cobalt is the last public-media fallback. Network
errors are retried for non-YouTube extractors as well; platform-specific
client rotation remains enabled for YouTube. No downloader can guarantee
private, region-locked, login-gated, or DRM-protected media.

Downloads use a deterministic filename convention:

```text
Title - by Uploader [platform] [quality] [video-id].ext
```

Unicode is preserved, unsafe filesystem characters are removed, Windows
reserved names are protected, and the HTTP response includes both an ASCII
fallback and an RFC 5987 UTF-8 filename.

For platforms that require login, age checks, region checks, or bot protection,
provide cookies/proxy configuration as needed. VidGrab should describe these
limitations honestly instead of claiming every service can always be downloaded.

## Checks

Before publishing changes:

```bash
npm run lint
npm run build
```

Health check:

```bash
curl https://vidgrab.io.vn/api/health
curl 'https://vidgrab.io.vn/wc26/index.html?check=YYYYMMDD#knockout'
```

## Environment

Copy `.env.example` when running outside Compose, then adjust optional values
such as `YTDLP_PROXY`, `BGUTIL_POT_BASE_URL`, `COBALT_API_URL`, and
`COBALT_API_KEY`.
