#!/bin/bash
# ─── VidGrab SERVER-side rollback ───
# Restores the previous build from the .bak files left by server-deploy.sh,
# then restarts Passenger. The WC26 dashboard is left untouched.
# Run on the iNET cPanel host if a deploy goes bad.
#
# Usage (paste into cPanel Terminal):
#   curl -fsSL "<raw-url>/scripts/server-rollback.sh" | bash
set -u

W="$HOME/public_html/vidgrab.io.vn"
STAMP="$(date +%Y%m%d%H%M%S)"

if [ ! -e "$W/.next.bak" ]; then
  echo "FATAL: no $W/.next.bak — nothing to roll back to."
  echo "Last-resort full restore: tar -xzf ~/vidgrab-applive-backup-*.tar.gz -C $W"
  exit 1
fi

echo "==> rolling back  (current build=$(cat "$W/.next/BUILD_ID" 2>/dev/null || echo none))"
rm -rf "$W/.next.failed"
mv "$W/.next" "$W/.next.failed"
mv "$W/.next.bak" "$W/.next"
[ -f "$W/server.js.bak" ]   && mv "$W/server.js.bak"   "$W/server.js"
[ -f "$W/package.json.bak" ] && mv "$W/package.json.bak" "$W/package.json"

echo "==> archiving stale top-level static indexes"
STALE_DIR="$W/_static-index-backups"
archived=0
for entrypoint in index.html index.htm default.html; do
  if [ -f "$W/$entrypoint" ]; then
    mkdir -p "$STALE_DIR"
    mv "$W/$entrypoint" "$STALE_DIR/$entrypoint.$STAMP.bak"
    echo "    archived $entrypoint -> _static-index-backups/$entrypoint.$STAMP.bak"
    archived=1
  fi
done
if [ "$archived" -eq 0 ]; then
  echo "    none found"
fi

mkdir -p "$W/tmp"
touch "$W/tmp/restart.txt"

echo "ROLLBACK_COMPLETE  restored_build=$(cat "$W/.next/BUILD_ID" 2>/dev/null || echo unknown)"
echo "(failed build kept at $W/.next.failed — delete once confident)"
echo "Verify:  curl -fsS https://vidgrab.io.vn/api/health"
