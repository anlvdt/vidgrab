#!/bin/sh
# ─── VidGrab Startup Script ───
# Launches the immutable production artifact

echo "[startup] Checking yt-dlp version..."
YTDLP_BIN="${YTDLP_PATH:-yt-dlp}"
"$YTDLP_BIN" --version 2>/dev/null || echo "[startup] yt-dlp not found!"

echo "[startup] yt-dlp version: $("$YTDLP_BIN" --version 2>/dev/null)"

# Start Next.js server
exec node server.js
