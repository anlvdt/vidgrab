#!/bin/bash
# ─── VidGrab SERVER-side deploy ───
# Runs on the iNET cPanel host (CloudLinux + Passenger). Downloads a prebuilt
# Next.js standalone artifact and overlays it onto the live web root, keeping
# bin / start.sh / tmp untouched, then restarts Passenger.
#
# Usage (paste into cPanel Terminal):
#   curl -fsSL "<raw-url>/scripts/server-deploy.sh" | bash -s "<raw-url>/<artifact>.tar.gz"
#
# NEVER build on this host: the CloudLinux LVE memory cap OOM-kills npm install
# and next build (exit 137). Always build on the Mac and ship the artifact.
set -u

W="$HOME/public_html/vidgrab.io.vn"   # live web root (Passenger app dir)
S="$HOME/deploy-stage"
ART_URL="${1:?usage: server-deploy.sh <artifact-raw-url>}"
ART="$HOME/$(basename "$ART_URL")"

echo "==> [1/6] downloading artifact"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  curl -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3.raw" -fsSL -o "$ART" "$ART_URL" || { echo "FATAL: download failed"; exit 1; }
else
  curl -fsSL -o "$ART" "$ART_URL" || { echo "FATAL: download failed"; exit 1; }
fi
echo "    $(ls -lh "$ART" | awk '{print $5}')  $ART"

echo "==> [2/6] extracting to staging (excluding macOS ._* cruft)"
rm -rf "$S" && mkdir -p "$S"
tar -xzf "$ART" -C "$S" --exclude='._*' 2>/dev/null
find "$S" -name '._*' -delete 2>/dev/null
if [ ! -f "$S/server.js" ] || [ ! -f "$S/.next/BUILD_ID" ]; then
  echo "FATAL: bad artifact (missing server.js or .next/BUILD_ID)"; rm -rf "$S" "$ART"; exit 1
fi
echo "    new_build=$(cat "$S/.next/BUILD_ID")   old_build=$(cat "$W/.next/BUILD_ID" 2>/dev/null || echo none)"

echo "==> [3/6] backing up current live files (instant rollback)"
rm -rf "$W/.next.bak"
cp -al "$W/.next" "$W/.next.bak" 2>/dev/null || cp -a "$W/.next" "$W/.next.bak"
cp -a "$W/server.js"   "$W/server.js.bak"
cp -a "$W/package.json" "$W/package.json.bak"

echo "==> [4/6] swapping in new build (stage new dir, then rm+mv — sub-second window)"
rm -rf "$W/.next.new"
cp -a "$S/.next" "$W/.next.new"
rm -rf "$W/.next"
mv "$W/.next.new" "$W/.next"
if [ -d "$S/node_modules" ]; then
  rm -rf "$W/node_modules.new"
  cp -a "$S/node_modules" "$W/node_modules.new"
  rm -rf "$W/node_modules"
  mv "$W/node_modules.new" "$W/node_modules"
fi
cp -a "$S/server.js"   "$W/server.js"
cp -a "$S/package.json" "$W/package.json"
if [ -d "$S/public" ]; then
  rm -rf "$W/public.new"
  cp -a "$S/public" "$W/public.new"
  rm -rf "$W/public"
  mv "$W/public.new" "$W/public"
fi
mkdir -p "$W/scripts"
cp -a "$S/scripts/." "$W/scripts/" 2>/dev/null || true

echo "==> [5/6] restarting Passenger"
mkdir -p "$W/tmp"
touch "$W/tmp/restart.txt"

echo "==> [6/6] cleaning temp files"
rm -rf "$S" "$ART"

echo "DEPLOY_COMPLETE  live_build=$(cat "$W/.next/BUILD_ID")"
echo "Verify:  curl -fsS https://vidgrab.io.vn/api/health"
echo "Rollback if needed:  curl -fsSL <raw-url>/scripts/server-rollback.sh | bash"
