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
set -euo pipefail

if [ "$(uname -s)" = "Darwin" ]; then
  echo "FATAL: this script must run in the iNET cPanel Terminal, not on the local Mac."
  echo "Open iNET cPanel -> Tools -> Terminal, then paste the deploy command there."
  exit 1
fi

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
tar -xzf "$ART" -C "$S" --exclude='._*'
find "$S" -name '._*' -delete 2>/dev/null
if [ ! -f "$S/server.js" ] || [ ! -f "$S/.next/BUILD_ID" ]; then
  echo "FATAL: bad artifact (missing server.js or .next/BUILD_ID)"; rm -rf "$S" "$ART"; exit 1
fi
echo "    new_build=$(cat "$S/.next/BUILD_ID")   old_build=$(cat "$W/.next/BUILD_ID" 2>/dev/null || echo none)"

echo "==> [3/6] backing up current live files (instant rollback)"
mkdir -p "$W"
if [ -d "$W/.next" ]; then
  rm -rf "$W/.next.bak"
  cp -al "$W/.next" "$W/.next.bak" 2>/dev/null || cp -a "$W/.next" "$W/.next.bak"
else
  echo "    no existing .next build to back up"
fi
[ -f "$W/server.js" ] && cp -a "$W/server.js" "$W/server.js.bak"
[ -f "$W/package.json" ] && cp -a "$W/package.json" "$W/package.json.bak"

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
if [ -d "$S/bin" ]; then
  rm -rf "$W/bin.new"
  cp -a "$S/bin" "$W/bin.new"
  chmod 755 "$W/bin.new/"* 2>/dev/null || true
  rm -rf "$W/bin"
  mv "$W/bin.new" "$W/bin"
fi
if [ -d "$S/.python" ]; then
  rm -rf "$W/.python.new"
  cp -a "$S/.python" "$W/.python.new"
  rm -rf "$W/.python"
  mv "$W/.python.new" "$W/.python"
fi
mkdir -p "$W/scripts"
cp -a "$S/scripts/." "$W/scripts/" 2>/dev/null || true

echo "==> [4b/6] preparing optional Python fallback"
PY_BIN=""
for candidate in "${PYTHON_BIN:-}" python3 /usr/bin/python3 /usr/local/bin/python3 /opt/alt/python312/bin/python3 /opt/alt/python311/bin/python3 /opt/alt/python310/bin/python3 /opt/alt/python39/bin/python3 /opt/alt/python38/bin/python3; do
  [ -n "$candidate" ] || continue
  if command -v "$candidate" >/dev/null 2>&1 || [ -x "$candidate" ]; then
    PY_BIN="$candidate"
    break
  fi
done
if [ -d "$W/.python/pytubefix" ]; then
  echo "    pytubefix bundled in artifact"
elif [ -n "$PY_BIN" ] && "$PY_BIN" -m pip --version >/dev/null 2>&1; then
  mkdir -p "$W/.python"
  "$PY_BIN" -m pip install --no-cache-dir --upgrade --target "$W/.python" pytubefix==10.9.0 >/tmp/vidgrab-pytubefix-install.log 2>&1 \
    && echo "    pytubefix installed with $("$PY_BIN" --version 2>&1)" \
    || { echo "    pytubefix install skipped (pip failed; see /tmp/vidgrab-pytubefix-install.log)"; }
else
  echo "    pytubefix install skipped (python3/pip unavailable)"
fi

echo "==> [5/6] restarting Passenger"
mkdir -p "$W/tmp"
touch "$W/tmp/restart.txt"

echo "==> [6/6] cleaning temp files"
rm -rf "$S" "$ART"

echo "DEPLOY_COMPLETE  live_build=$(cat "$W/.next/BUILD_ID")"
echo "Verify:  curl -fsS https://vidgrab.io.vn/api/health"
echo "Rollback if needed:  curl -fsSL <raw-url>/scripts/server-rollback.sh | bash"
