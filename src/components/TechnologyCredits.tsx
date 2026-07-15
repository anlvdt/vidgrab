"use client";

import Link from "next/link";
import { ExternalLink, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const technologies = [
  { name: "yt-dlp", url: "https://github.com/yt-dlp/yt-dlp" },
  { name: "FFmpeg", url: "https://ffmpeg.org/" },
  { name: "pytubefix", url: "https://github.com/JuanBindez/pytubefix" },
  { name: "Cobalt", url: "https://github.com/imputnet/cobalt" },
] as const;

export default function TechnologyCredits() {
  const { locale } = useI18n();
  const vi = locale === "vi";

  return (
    <section
      className="relative z-10 border-y border-[var(--border)] bg-[var(--section-bg)] py-5 sm:py-6"
      aria-labelledby="technology-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="min-w-0">
            <h2
              id="technology-title"
              className="text-sm font-semibold tracking-tight sm:text-base"
            >
              {vi ? "Mã nguồn mở · minh bạch" : "Open source · transparent"}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {vi
                ? "yt-dlp, FFmpeg và fallback — chỉ xử lý URL bạn gửi."
                : "yt-dlp, FFmpeg and fallbacks — only URLs you submit."}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              {technologies.map((tech) => (
                <a
                  key={tech.name}
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-card-solid)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                >
                  {tech.name}
                  <ExternalLink className="h-2.5 w-2.5 opacity-50" aria-hidden />
                </a>
              ))}
            </div>
          </div>
          <Link
            href="/transparency"
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent-light)] transition-colors hover:bg-[var(--accent)] hover:text-white"
          >
            <Scale className="h-3.5 w-3.5" aria-hidden />
            {vi ? "Minh bạch" : "Transparency"}
          </Link>
        </div>
      </div>
    </section>
  );
}
