"use client";

import Link from "next/link";
import { ExternalLink, GitBranch, Layers3, Scale, ShieldCheck } from "lucide-react";
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
    <section className="relative z-10 px-4 py-12 sm:py-20" aria-labelledby="technology-title">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-light)]">
            {vi ? "Công khai cách vận hành" : "How it works, in the open"}
          </p>
          <h2 id="technology-title" className="text-3xl font-bold sm:text-4xl">
            <span className="gradient-text">{vi ? "Công nghệ & Minh bạch" : "Technology & Transparency"}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            {vi
              ? "VidGrab đứng trên nền tảng của nhiều dự án mã nguồn mở. Chúng tôi ghi nhận đúng công sức của tác giả và nói rõ giới hạn của dịch vụ."
              : "VidGrab is built on several open-source projects. We credit their authors and state the service's limits plainly."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((technology) => (
            <a
              key={technology.name}
              href={technology.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card group rounded-xl p-4"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-[var(--text-primary)]">{technology.name}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-light)]" />
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-[var(--text-secondary)]">
                {vi ? technology.roleVi : technology.roleEn}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="glass rounded-xl p-4">
            <ShieldCheck className="mb-3 h-5 w-5 text-[var(--success)]" />
            <h3 className="text-sm font-semibold">{vi ? "Không vượt bảo vệ" : "No protection bypass"}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {vi
                ? "Chỉ xử lý URL người dùng chủ động gửi; không vượt DRM, video riêng tư hoặc kiểm soát truy cập."
                : "Only user-submitted URLs are processed; DRM, private media and access controls are not bypassed."}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <Layers3 className="mb-3 h-5 w-5 text-[var(--accent-light)]" />
            <h3 className="text-sm font-semibold">{vi ? "Không phải kho nội dung" : "Not a media library"}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {vi
                ? "VidGrab xử lý theo yêu cầu và không duy trì thư viện media để tìm kiếm, phát lại hoặc phân phối."
                : "VidGrab processes requests on demand and does not maintain a searchable or playable media catalog."}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <Scale className="mb-3 h-5 w-5 text-[var(--warning)]" />
            <h3 className="text-sm font-semibold">{vi ? "Dùng đúng quyền" : "Use only with rights"}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {vi
                ? "Chỉ tải nội dung bạn sở hữu, được cấp phép hoặc pháp luật cho phép; đồng thời tuân thủ điều khoản nền tảng nguồn."
                : "Download only content you own, are licensed to use, or may lawfully copy, while following source-platform terms."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm sm:flex-row">
          <Link href="/transparency" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--glass-bg)] px-4 font-semibold text-[var(--accent-light)] ring-1 ring-[var(--glass-border)] hover:text-[var(--text-primary)]">
            <Scale className="h-4 w-4" />
            {vi ? "Đọc đầy đủ chính sách minh bạch" : "Read the full transparency statement"}
          </Link>
          <a href="https://github.com/anlvdt/vidgrab" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 px-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <GitBranch className="h-4 w-4" />
            {vi ? "Xem mã nguồn VidGrab" : "View VidGrab source"}
          </a>
        </div>
      </div>
    </section>
  );
}
