#!/bin/sh
# ─── VidGrab Startup Script ───
# Updates yt-dlp to nightly on container start, then launches Next.js

echo "[startup] Checking yt-dlp version..."
yt-dlp --version 2>/dev/null || echo "[startup] yt-dlp not found!"

# Update yt-dlp to NIGHTLY (has latest YouTube fixes)
echo "[startup] Updating yt-dlp to nightly..."
pip3 install --break-system-packages -U "yt-dlp[default] @ https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt_dlp_nightly-py3-none-any.whl" 2>&1 || \
  pip3 install --break-system-packages -U yt-dlp 2>&1 || \
  echo "[startup] yt-dlp update failed, using existing version"

pip3 install --break-system-packages -U yt-dlp-ejs 2>&1 || true

echo "[startup] yt-dlp version: $(yt-dlp --version 2>/dev/null)"

# Start Next.js server
exec node server.js
