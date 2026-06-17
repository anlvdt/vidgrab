#!/usr/bin/env bash
# ─── VidGrab MAC-side deploy orchestrator ───
# One command to ship the current commit to live vidgrab.io.vn.
#
#   ./scripts/deploy.sh
#
# What it does:
#   1. next build (standalone)            — on the Mac (the host can't build: LVE OOM)
#   2. package standalone runtime         — includes traced node_modules
#   3. push artifact to a temp GitHub branch (transport — file_upload & temp hosts are blocked)
#   4. print the ONE command to paste into the cPanel Terminal
#   5. poll /api/health until the new build is live, then delete the temp branch
#
# Requires a clean tracked working tree. Build outputs are gitignored, so a normal
# working branch counts as clean.
set -euo pipefail

# ── config ──────────────────────────────────────────────────
SITE_URL="https://vidgrab.io.vn"
GH_REMOTE="origin"
GH_OWNER_REPO="anlvdt/vidgrab"
RAW_BASE="https://raw.githubusercontent.com/${GH_OWNER_REPO}"

# ── locate repo root ────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
STANDALONE=".next/standalone"
RUNTIME_DIR=".runtime"
FFMPEG_TARBALL_URL="https://registry.npmjs.org/@ffmpeg-installer/linux-x64/-/linux-x64-4.1.0.tgz"
YTDLP_BIN_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
PYTUBEFIX_VERSION="10.9.0"
HOSTING_PYTHON_VERSION="3.12"
HOSTING_PYTHON_ABI="cp312"

# ── guard: clean tracked tree ───────────────────────────────
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "FATAL: uncommitted tracked changes — commit or stash first." >&2
  exit 1
fi

CUR_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
SHA="$(git rev-parse --short HEAD)"
ART="vidgrab-deploy-${SHA}.tar.gz"
DEPLOY_BRANCH="deploy-${SHA}"

cleanup_local() { git checkout -q "$CUR_BRANCH" 2>/dev/null || true
                  git branch -qD "$DEPLOY_BRANCH" 2>/dev/null || true
                  rm -f "$REPO_ROOT/$ART"; }
trap cleanup_local EXIT

echo "==> [1/5] Building (next build · standalone)…"
npm run build >/dev/null
[ -d "$STANDALONE" ] || { echo "FATAL: no $STANDALONE — is output:'standalone' set?" >&2; exit 1; }

echo "==> [2/5] Packaging $ART (fold static + public + traced node_modules)…"
echo "    preparing Linux runtime helpers..."
rm -rf "$RUNTIME_DIR"
mkdir -p "$RUNTIME_DIR/bin"
TMP_RUNTIME="$(mktemp -d)"
curl -fsSL "$FFMPEG_TARBALL_URL" -o "$TMP_RUNTIME/ffmpeg.tgz"
tar -xzf "$TMP_RUNTIME/ffmpeg.tgz" -C "$TMP_RUNTIME"
cp "$TMP_RUNTIME/package/ffmpeg" "$RUNTIME_DIR/bin/ffmpeg"
chmod 755 "$RUNTIME_DIR/bin/ffmpeg"
rm -rf "$TMP_RUNTIME"
curl -fsSL "$YTDLP_BIN_URL" -o "$RUNTIME_DIR/bin/yt-dlp.py"
cat > "$RUNTIME_DIR/bin/yt-dlp" <<'EOF'
#!/bin/sh
for py in "${PYTHON_BIN:-}" /opt/alt/python312/bin/python3 /opt/alt/python311/bin/python3 /opt/alt/python310/bin/python3 /opt/alt/python39/bin/python3 /usr/local/bin/python3 /usr/bin/python3 python3; do
  [ -n "$py" ] || continue
  if command -v "$py" >/dev/null 2>&1 || [ -x "$py" ]; then
    exec "$py" "$(dirname "$0")/yt-dlp.py" "$@"
  fi
done
echo "yt-dlp: python3 not found" >&2
exit 127
EOF
chmod 755 "$RUNTIME_DIR/bin/yt-dlp" "$RUNTIME_DIR/bin/yt-dlp.py"
python3 -m pip install --quiet --disable-pip-version-check \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version "$HOSTING_PYTHON_VERSION" \
  --abi "$HOSTING_PYTHON_ABI" \
  --only-binary=:all: \
  --no-deps \
  --target "$RUNTIME_DIR/python" \
  "pytubefix==$PYTUBEFIX_VERSION" \
  "aiohttp==3.14.1" \
  "aiohappyeyeballs==2.6.2" \
  "aiosignal==1.4.0" \
  "attrs==26.1.0" \
  "frozenlist==1.8.0" \
  "idna==3.18" \
  "multidict==6.7.1" \
  "propcache==0.5.2" \
  "typing-extensions==4.15.0" \
  "yarl==1.24.2"
mkdir -p "$RUNTIME_DIR/python/nodejs_wheel/bin"
cat > "$RUNTIME_DIR/python/nodejs_wheel/__init__.py" <<'EOF'
"""Minimal nodejs_wheel shim for pytubefix on cPanel hosting."""
EOF
cat > "$RUNTIME_DIR/python/nodejs_wheel/executable.py" <<'EOF'
import os

ROOT_DIR = os.path.dirname(__file__)
EOF
cat > "$RUNTIME_DIR/python/nodejs_wheel/bin/node" <<'EOF'
#!/bin/sh
for node in "${NODE_BIN:-}" node /opt/alt/alt-nodejs24/root/usr/bin/node /opt/alt/alt-nodejs22/root/usr/bin/node /opt/alt/alt-nodejs20/root/usr/bin/node /opt/alt/alt-nodejs18/root/usr/bin/node /usr/local/bin/node /usr/bin/node; do
  [ -n "$node" ] || continue
  if command -v "$node" >/dev/null 2>&1 || [ -x "$node" ]; then
    exec "$node" "$@"
  fi
done
echo "nodejs_wheel shim: node not found" >&2
exit 127
EOF
chmod 755 "$RUNTIME_DIR/python/nodejs_wheel/bin/node"
rm -rf "$STANDALONE/.next/static" && cp -R .next/static "$STANDALONE/.next/static"
[ -d public ] && { rm -rf "$STANDALONE/public"; cp -R public "$STANDALONE/public"; }
rm -rf "$STANDALONE/bin" && cp -R "$RUNTIME_DIR/bin" "$STANDALONE/bin"
rm -rf "$STANDALONE/.python" && cp -R "$RUNTIME_DIR/python" "$STANDALONE/.python"
rm -f "$REPO_ROOT/$ART"
( cd "$STANDALONE" && COPYFILE_DISABLE=1 tar --exclude='._*' -czf "$REPO_ROOT/$ART" . )
echo "    artifact: $(du -h "$REPO_ROOT/$ART" | cut -f1)"

echo "==> [3/5] Pushing artifact to temp branch ${DEPLOY_BRANCH}..."
git checkout -q -b "$DEPLOY_BRANCH"
git add -f "$ART"
git commit -q -m "chore: deploy artifact $SHA [temp]"
git push -qf "$GH_REMOTE" "$DEPLOY_BRANCH"
git checkout -q "$CUR_BRANCH"
git branch -qD "$DEPLOY_BRANCH"
rm -f "$REPO_ROOT/$ART"
trap - EXIT   # local state already clean; keep remote branch for the server pull

GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep password | cut -d= -f2 || true)

if [ -n "$GH_TOKEN" ]; then
  SRV_URL="https://api.github.com/repos/${GH_OWNER_REPO}/contents/scripts/server-deploy.sh?ref=${DEPLOY_BRANCH}"
  ART_URL="https://api.github.com/repos/${GH_OWNER_REPO}/contents/${ART}?ref=${DEPLOY_BRANCH}"
  cat <<EOF

──────────────────────────────────────────────────────────────
 [4/5] Paste this into the cPanel Terminal (Tools → Terminal):

   export GITHUB_TOKEN="$GH_TOKEN"
   curl -H "Authorization: token \$GITHUB_TOKEN" -H "Accept: application/vnd.github.v3.raw" -fsSL "$SRV_URL" | bash -s -- "$ART_URL"

──────────────────────────────────────────────────────────────
EOF
else
  ART_URL="${RAW_BASE}/${DEPLOY_BRANCH}/${ART}"
  SRV_URL="${RAW_BASE}/${DEPLOY_BRANCH}/scripts/server-deploy.sh"
  cat <<EOF

──────────────────────────────────────────────────────────────
 [4/5] Paste this into the cPanel Terminal (Tools → Terminal):

   curl -fsSL "$SRV_URL" | bash -s "$ART_URL"

──────────────────────────────────────────────────────────────
EOF
fi

echo "==> [5/5] Polling $SITE_URL/api/health (up to ~3 min)…"
NEW_BUILD="$(cat "$STANDALONE/.next/BUILD_ID")"
ok=""
for _ in $(seq 1 36); do
  body="$(curl -fsS -m 10 "$SITE_URL/api/health" 2>/dev/null || true)"
  if echo "$body" | grep -q '"buildId":"'"$NEW_BUILD"'"'; then ok=1; echo "    LIVE: $body"; break; fi
  sleep 5
done

if [ -n "$ok" ]; then
  echo "==> Deploy verified. Deleting temp branch ${DEPLOY_BRANCH}..."
  git push -q "$GH_REMOTE" --delete "$DEPLOY_BRANCH" || true
  echo "✅ DONE — vidgrab.io.vn is now serving build $NEW_BUILD"
else
  echo "⚠️  Health check didn't confirm yet (did you run the cPanel command?)."
  echo "    Re-check:  curl -fsS $SITE_URL/api/health"
  echo "    Rollback:  curl -fsSL \"${RAW_BASE}/${DEPLOY_BRANCH}/scripts/server-rollback.sh\" | bash"
  echo "    When done, delete temp branch:  git push $GH_REMOTE --delete $DEPLOY_BRANCH"
fi
