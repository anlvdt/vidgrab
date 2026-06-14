#!/usr/bin/env python3
"""pytubefix fallback helper for VidGrab.

A secondary YouTube extraction engine, used only when yt-dlp fails. pytubefix
and yt-dlp break on different YouTube changes, so one often works when the
other doesn't.

Usage:
    pytubefix_helper.py info <url>

Output (stdout, JSON):
    {ok, client, title, thumbnail, duration, author, views, formats: [...]}

Each format:
    {itag, ext, resolution, fps, vcodec, acodec, abr, tbr,
     is_progressive, has_video, has_audio, filesize, url}

The `url` is a signed googlevideo URL — IP- and time-locked to the host that
extracted it, so it must be proxied through this server (not handed to the
browser). Exit code is non-zero on failure; stderr carries the reason.
"""
import sys
import json

# InnerTube clients to try in order. yt-dlp-style ladder: clients that tend to
# need PO tokens least come first. pytubefix falls through to the next on error.
CLIENTS = ("ANDROID_VR", "IOS", "MWEB", "WEB", "TV")


def _abr_to_int(abr):
    """'128kbps' -> 128 (kbps). Returns None when not parseable."""
    if not abr:
        return None
    digits = "".join(ch for ch in str(abr) if ch.isdigit())
    return int(digits) if digits else None


def build(url):
    from pytubefix import YouTube

    last_err = None
    for client in CLIENTS:
        try:
            yt = YouTube(url, client=client)
            streams = list(yt.streams)  # triggers extraction
            if not streams:
                last_err = RuntimeError("no streams")
                continue

            fmts = []
            for s in streams:
                mime = s.mime_type or ""
                ext = mime.split("/")[-1] if "/" in mime else (getattr(s, "subtype", "") or "")
                has_v = bool(s.includes_video_track)
                has_a = bool(s.includes_audio_track)
                abr_kbps = _abr_to_int(getattr(s, "abr", None))
                fmts.append({
                    "itag": s.itag,
                    "ext": ext,
                    "resolution": s.resolution or ("audio" if has_a and not has_v else ""),
                    "fps": getattr(s, "fps", None),
                    "vcodec": (s.video_codec or "none") if has_v else "none",
                    "acodec": (s.audio_codec or "none") if has_a else "none",
                    "abr": abr_kbps,
                    "tbr": getattr(s, "bitrate", None),
                    "is_progressive": bool(s.is_progressive),
                    "has_video": has_v,
                    "has_audio": has_a,
                    # filesize_approx is computed from bitrate*duration (no network);
                    # exact .filesize does a HEAD per stream and would be slow.
                    "filesize": getattr(s, "filesize_approx", None),
                    "url": s.url,
                })

            return {
                "ok": True,
                "client": client,
                "title": yt.title,
                "thumbnail": yt.thumbnail_url,
                "duration": yt.length or 0,
                "author": yt.author or "",
                "views": yt.views or 0,
                "formats": fmts,
            }
        except Exception as e:  # noqa: BLE001 — try the next client
            last_err = e
            continue

    raise RuntimeError(f"pytubefix: all clients failed: {last_err}")


def main():
    if len(sys.argv) < 3 or sys.argv[1] != "info":
        print("usage: pytubefix_helper.py info <url>", file=sys.stderr)
        sys.exit(2)
    try:
        data = build(sys.argv[2])
    except Exception as e:  # noqa: BLE001
        print(str(e), file=sys.stderr)
        sys.exit(1)
    json.dump(data, sys.stdout)


if __name__ == "__main__":
    main()
