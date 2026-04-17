#!/bin/sh
# ─── VidGrab Startup Script ───
# Updates yt-dlp in background on container start, then launches Next.js

echo "[startup] Checking yt-dlp version..."
yt-dlp --version 2>/dev/null || echo "[startup] yt-dlp not found!"

# Update yt-dlp in background (don't block server startup)
(
  echo "[startup] Updating yt-dlp to latest..."
  pip3 install --break-system-packages -U yt-dlp yt-dlp-ejs 2>&1 || \
    echo "[startup] yt-dlp update failed, using existing version"
  echo "[startup] yt-dlp updated: $(yt-dlp --version 2>/dev/null)"
) &

# Start Next.js server
exec node server.js
