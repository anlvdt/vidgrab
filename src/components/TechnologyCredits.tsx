"use client";

import Link from "next/link";
import { ExternalLink, GitBranch, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const technologies = [
  {
    name: "yt-dlp",
    roleEn: "Primary media metadata and stream extraction engine",
    roleVi: "Công cụ chính để đọc metadata và trích xuất luồng media",
    url: "https://github.com/yt-dlp/yt-dlp",
  },
  {
    name: "FFmpeg",
    roleEn: "Audio conversion, stream merging and MP4 normalization",
    roleVi: "Chuyển đổi âm thanh, ghép luồng và chuẩn hóa MP4",
    url: "https://ffmpeg.org/",
  },
  {
    name: "pytubefix",
    roleEn: "Secondary YouTube extraction path when the primary engine fails",
    roleVi: "Đường trích xuất YouTube dự phòng khi engine chính thất bại",
    url: "https://github.com/JuanBindez/pytubefix",
  },
  {
    name: "Cobalt",
    roleEn: "Optional self-hosted fallback for selected public links",
    roleVi: "Fallback self-host tùy chọn cho một số liên kết công khai",
    url: "https://github.com/imputnet/cobalt",
  },
  {
    name: "curl_cffi",
    roleEn: "Optional browser-like TLS requests for difficult public sources",
    roleVi: "Yêu cầu TLS mô phỏng trình duyệt cho nguồn công khai khó truy cập",
    url: "https://github.com/lexiforest/curl_cffi",
  },
  {
    name: "SponsorBlock",
    roleEn: "Optional community segment markers used through yt-dlp",
    roleVi: "Dữ liệu phân đoạn cộng đồng tùy chọn được dùng thông qua yt-dlp",
    url: "https://sponsor.ajay.app/",
  },
] as const;

export default function TechnologyCredits() {
  const { locale } = useI18n();
  const vi = locale === "vi";

  return (
    <section
      className="relative z-10 border-y border-[var(--border)] bg-[var(--section-bg)] py-[var(--space-8)] sm:py-[var(--space-10)]"
      aria-labelledby="technology-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="section-kicker">
              {vi ? "Công khai cách vận hành" : "How it works, in the open"}
            </p>
            <h2 id="technology-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
              {vi ? "Công nghệ mã nguồn mở" : "Open-source technology"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {vi
              ? "VidGrab dùng yt-dlp, FFmpeg và các fallback chuyên biệt. Chỉ xử lý URL bạn gửi, không vượt DRM hoặc quyền riêng tư."
              : "VidGrab uses yt-dlp, FFmpeg and focused fallbacks. It only processes URLs you submit and does not bypass DRM or privacy controls."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link href="/transparency" className="btn-hero px-4 text-sm">
              <Scale className="h-4 w-4" aria-hidden />
              {vi ? "Xem chính sách minh bạch" : "Read our transparency policy"}
            </Link>
            <a href="https://github.com/anlvdt/vidgrab" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
              <GitBranch className="h-4 w-4" aria-hidden />
              {vi ? "Mã nguồn VidGrab" : "VidGrab source"}
            </a>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border)] pt-5">
          {technologies.map((technology) => (
            <a
              key={technology.name}
              href={technology.url}
              target="_blank"
              rel="noopener noreferrer"
              title={vi ? technology.roleVi : technology.roleEn}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card-solid)] px-3 text-xs font-medium text-[var(--text-secondary)] shadow-[0_1px_2px_color-mix(in_srgb,var(--glass-shadow)_40%,transparent)] transition-all hover:border-[var(--accent)] hover:text-[var(--text-primary)] hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--glass-shadow)_55%,transparent)]"
            >
              {technology.name}
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
            </a>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
