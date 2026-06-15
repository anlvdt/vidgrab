#!/bin/bash
# ─── VidGrab SERVER-side rollback ───
# Restores the previous build from the .bak files left by server-deploy.sh,
# then restarts Passenger. Run on the iNET cPanel host if a deploy goes bad.
#
# Usage (paste into cPanel Terminal):
#   curl -fsSL "<raw-url>/scripts/server-rollback.sh" | bash
set -u

W="$HOME/public_html/vidgrab.io.vn"

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

mkdir -p "$W/tmp"
touch "$W/tmp/restart.txt"

echo "ROLLBACK_COMPLETE  restored_build=$(cat "$W/.next/BUILD_ID" 2>/dev/null || echo unknown)"
echo "(failed build kept at $W/.next.failed — delete once confident)"
echo "Verify:  curl -fsS https://vidgrab.io.vn/api/health"
