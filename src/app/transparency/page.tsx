"use client";

import { ExternalLink, Scale } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/use-document-title";
import LegalPageShell from "@/components/LegalPageShell";

const projects = [
  ["yt-dlp", "https://github.com/yt-dlp/yt-dlp"],
  ["FFmpeg", "https://ffmpeg.org/"],
  ["pytubefix", "https://github.com/JuanBindez/pytubefix"],
  ["Cobalt", "https://github.com/imputnet/cobalt"],
  ["curl_cffi", "https://github.com/lexiforest/curl_cffi"],
  ["SponsorBlock", "https://sponsor.ajay.app/"],
  ["Next.js", "https://nextjs.org/"],
  ["React", "https://react.dev/"],
  ["Lucide", "https://lucide.dev/"],
] as const;

export default function TransparencyPage() {
  const { locale, t } = useI18n();
  const vi = locale === "vi";
  useDocumentTitle(t.titleTransparency);

  return (
    <LegalPageShell
      icon={Scale}
      kicker={vi ? "Minh bạch" : "Transparency"}
      title={vi ? "Công nghệ & Minh bạch" : "Technology & Transparency"}
    >
      <section>
        <h2>{vi ? "Dịch vụ này là gì" : "What this service is"}</h2>
        <p>
          {vi
            ? "VidGrab là giao diện độc lập giúp người dùng phân tích liên kết media công khai và yêu cầu một file ở định dạng có sẵn. VidGrab không thuộc, không được tài trợ và không được chứng thực bởi YouTube, TikTok, Meta, X hoặc bất kỳ nền tảng nguồn nào. Tên và nhãn hiệu của họ chỉ dùng để mô tả khả năng tương thích."
            : "VidGrab is an independent interface for analyzing public media links and requesting a file in an available format. It is not owned, sponsored, or endorsed by YouTube, TikTok, Meta, X, or any source platform. Their names and marks are used only to describe compatibility."}
        </p>
      </section>

      <section>
        <h2>{vi ? "Nguyên tắc vận hành" : "Operating principles"}</h2>
        <ul>
          <li>
            {vi
              ? "Chỉ xử lý URL do người dùng chủ động gửi; không cung cấp danh mục nội dung để khám phá."
              : "Only URLs actively submitted by a user are processed; no content-discovery catalog is provided."}
          </li>
          <li>
            {vi
              ? "Không vượt DRM, paywall, quyền riêng tư hoặc cơ chế kiểm soát truy cập."
              : "DRM, paywalls, privacy settings, and access controls are not bypassed."}
          </li>
          <li>
            {vi
              ? "Không cam kết mọi link hoặc mọi nền tảng hoạt động; khả năng truy cập thay đổi theo nguồn, khu vực và yêu cầu đăng nhập."
              : "Not every link or platform is guaranteed to work; access varies by source, region, and sign-in requirements."}
          </li>
          <li>
            {vi
              ? "Không duy trì kho media lâu dài. Lịch sử tải nằm trong localStorage của trình duyệt và có thể xóa bất cứ lúc nào."
              : "No permanent media library is maintained. Download history stays in browser localStorage and can be cleared at any time."}
          </li>
          <li>
            {vi
              ? "Người dùng phải có quyền hợp pháp và tuân thủ điều khoản của nền tảng nguồn trước khi tải."
              : "Users must have lawful rights and follow source-platform terms before downloading."}
          </li>
        </ul>
      </section>

      <section>
        <h2>{vi ? "Credit mã nguồn mở" : "Open-source credits"}</h2>
        <p className="mb-3">
          {vi
            ? "Các dự án dưới đây thuộc về những tác giả và cộng đồng tương ứng. VidGrab sử dụng chúng theo giấy phép riêng của từng dự án; việc được liệt kê không hàm ý họ chứng thực VidGrab."
            : "These projects belong to their respective authors and communities. VidGrab uses them under each project's own license; inclusion does not imply their endorsement of VidGrab."}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(([name, url]) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card-solid)] px-3 font-medium text-[var(--text-primary)] shadow-[0_1px_2px_color-mix(in_srgb,var(--glass-shadow)_40%,transparent)] transition-all hover:border-[var(--accent)] hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--glass-shadow)_55%,transparent)]"
            >
              {name}
              <ExternalLink
                className="h-3.5 w-3.5 text-[var(--text-muted)]"
                aria-hidden
              />
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2>{vi ? "Báo cáo vấn đề" : "Report an issue"}</h2>
        <p>
          {vi
            ? "Để báo lỗi kỹ thuật, vấn đề quyền sở hữu trí tuệ hoặc nội dung cần xem xét, hãy tạo issue trong kho mã nguồn VidGrab."
            : "To report a technical problem, intellectual-property concern, or content that needs review, open an issue in the VidGrab repository."}
        </p>
        <a
          href="https://github.com/anlvdt/vidgrab/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-3 text-sm"
        >
          GitHub Issues
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </section>

      <p className="legal-updated">
        {vi ? "Cập nhật lần cuối: 15/07/2026." : "Last updated: July 15, 2026."}
      </p>
    </LegalPageShell>
  );
}
