# VidGrab

VidGrab is a Next.js video downloader for public video links from popular
platforms in Vietnam. It is configured to run from the iNET domain
`https://vidgrab.io.vn`.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production on iNET

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
```

## Environment

Copy `.env.example` when running outside Compose, then adjust optional values
such as `YTDLP_PROXY`, `BGUTIL_POT_BASE_URL`, `COBALT_API_URL`, and
`COBALT_API_KEY`.
