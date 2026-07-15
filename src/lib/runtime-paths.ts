import fs from "fs";
import path from "path";

function executable(file: string): string | null {
  try {
    fs.accessSync(file, fs.constants.X_OK);
    return file;
  } catch {
    return null;
  }
}

function firstExecutable(candidates: string[]): string | null {
  for (const candidate of candidates) {
    const found = executable(candidate);
    if (found) return found;
  }
  return null;
}

function appPath(...parts: string[]): string {
  return path.join(process.cwd(), ...parts);
}

export function resolveYtdlpBin(): string {
  return (
    process.env.YTDLP_PATH ||
    firstExecutable([
      // Prefer system/Homebrew first — bundled wrapper may pin an old Python.
      "/opt/homebrew/bin/yt-dlp",
      "/usr/local/bin/yt-dlp",
      appPath("bin", "yt-dlp"),
      appPath(".runtime", "bin", "yt-dlp"),
    ]) ||
    "yt-dlp"
  );
}

export function resolveFfmpegBin(): string {
  const ffmpegPath = process.env.FFMPEG_PATH;
  return (
    process.env.FFMPEG_BIN ||
    (ffmpegPath && /ffmpeg$/.test(ffmpegPath) ? ffmpegPath : null) ||
    firstExecutable([
      "/opt/homebrew/bin/ffmpeg",
      "/usr/local/bin/ffmpeg",
      appPath("bin", "ffmpeg"),
      appPath(".runtime", "bin", "ffmpeg"),
    ]) ||
    "ffmpeg"
  );
}

export function resolveFfmpegLocation(): string | undefined {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const found = firstExecutable([
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    appPath("bin", "ffmpeg"),
    appPath(".runtime", "bin", "ffmpeg"),
  ]);
  return found ? path.dirname(found) : undefined;
}

export function resolvePythonBin(): string {
  return (
    process.env.PYTHON_BIN ||
    firstExecutable([
      appPath("bin", "python3"),
      // Homebrew / modern Pythons before macOS CLT 3.9
      "/opt/homebrew/bin/python3",
      "/usr/local/bin/python3",
      "/opt/alt/python312/bin/python3",
      "/opt/alt/python311/bin/python3",
      "/opt/alt/python310/bin/python3",
      "/usr/bin/python3",
      "/opt/alt/python39/bin/python3",
      "/opt/alt/python38/bin/python3",
    ]) ||
    "python3"
  );
}

export function pythonEnv(): NodeJS.ProcessEnv {
  const vendor = appPath(".python");
  const existing = process.env.PYTHONPATH;
  return {
    ...process.env,
    PYTHONPATH: fs.existsSync(vendor) ? [vendor, existing].filter(Boolean).join(path.delimiter) : existing,
  };
}
