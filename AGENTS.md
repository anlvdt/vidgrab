# VidGrab — agent instructions

## Deploy (mandatory when the user says “deploy”)

When the user asks to **deploy**, **ship**, **đẩy lên host**, or similar — **do not invent a path**. Follow this exact workflow.

### Hard rules

1. **No SSH / SCP / SFTP** — iNET shared host does not expose SSH for this account. Do **not** recreate `deploy-ssh.sh`, SSH keys, or `~/.ssh/config` Host blocks for VidGrab.
2. **Never build on the host** — CloudLinux LVE OOMs `npm install` / `next build`. Always build on the Mac.
3. **Never overwrite WC26** — live root is `~/public_html/vidgrab.io.vn`. World Cup dashboard must stay only at `/wc26/…`. `scripts/server-deploy.sh` preserves `wc26`; do not delete or re-root it.
4. **Never put WC26 `index.html` at domain root** — that steals the VidGrab app.

### Canonical pipeline

| Step | Where | What |
|------|--------|------|
| 1 | Mac (repo `vidgrab/`) | Commit if needed (clean tracked tree required by `deploy.sh`). |
| 2 | Mac | Run `./scripts/deploy.sh` from repo root. Builds standalone, packages runtime (yt-dlp, ffmpeg, pytubefix, etc.), pushes a **temp** GitHub branch `deploy-<sha>` with the tarball. |
| 3 | Output of `deploy.sh` | Capture the **one** curl command it prints, shape: `curl -fsSL "<raw>/scripts/server-deploy.sh" \| bash -s "<raw>/<artifact>.tar.gz"`. |
| 4 | **Browser / computer-use** | Open the user’s **already-logged-in system Chrome** → iNET **cPanel → Tools → Terminal**. Paste and run that curl command. Do **not** use a headless browser without the cPanel session. |
| 5 | Mac | Confirm `curl -fsS https://vidgrab.io.vn/api/health` shows `"ok":true` and the new `buildId`. `deploy.sh` also polls; if the cPanel step ran, it may delete the temp branch automatically. |
| 6 | Cleanup | If health never flipped, leave the temp branch until fixed, then `git push origin --delete deploy-<sha>`. |

### Scripts (do not replace with SSH)

| Script | Runs on | Role |
|--------|---------|------|
| `scripts/deploy.sh` | Mac only | Build + package + push artifact + print cPanel paste command + poll health |
| `scripts/server-deploy.sh` | cPanel Terminal only | Download artifact, overlay live root, preserve `wc26`, restart Passenger |
| `scripts/server-rollback.sh` | cPanel Terminal only | Emergency rollback |

### Agent behavior checklist

- [ ] Prefer **computer-use** on system Chrome (session already logged into cPanel).
- [ ] Focus **Terminal** tab/page, not File Manager or SSH Access.
- [ ] Paste the **exact** command from the latest `deploy.sh` output (correct SHA / branch).
- [ ] After deploy: report health JSON (`buildId`, engines) and that `wc26` was preserved.
- [ ] If Terminal paste fails (xterm canvas): tell the user the one-liner to paste manually; do not fall back to SSH.
- [ ] Do **not** document or re-enable SSH as a deploy option unless the user explicitly asks and the host has opened port 22.

### Host facts (iNET)

- Live site: `https://vidgrab.io.vn`
- cPanel host: `turboweb-022607.inet.vn:2083` (user session in system Chrome)
- App root: `~/public_html/vidgrab.io.vn` (Passenger)
- WC26: `~/public_html/vidgrab.io.vn/wc26/` → `https://vidgrab.io.vn/wc26/index.html#knockout`
- GitHub: `anlvdt/vidgrab`

### Rollback (if needed)

In cPanel Terminal (only if temp branch still exists or you have the rollback URL from deploy output):

```bash
curl -fsSL "https://raw.githubusercontent.com/anlvdt/vidgrab/deploy-<sha>/scripts/server-rollback.sh" | bash
```

---

## Local dev

```bash
npm install
npm run dev
```

Default local checks before shipping:

```bash
npm run lint
npm run build
```

## Product constraints

- Honest download limitations (no private/DRM/login-gated guarantees).
- UI layout follows `design.md`.
- Prefer minimal diffs; do not rewrite unrelated code during deploy work.
