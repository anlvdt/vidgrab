#!/bin/sh
# ─── VidGrab Startup Script ───
# Updates yt-dlp in background on container start, then launches Next.js

echo "[startup] Checking yt-dlp version..."
yt-dlp --version 2>/dev/null || echo "[startup] yt-dlp not found!"

# Update yt-dlp in background (don't block server startup)
(
  echo "[startup] Updating yt-dlp to latest nightly..."
  yt-dlp --update-to nightly 2>&1 || \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
      -o /usr/local/bin/yt-dlp 2>/dev/null && \
    chmod a+rx /usr/local/bin/yt-dlp
  echo "[startup] yt-dlp updated: $(yt-dlp --version 2>/dev/null)"
) &

# Start Next.js server
exec node server.js
