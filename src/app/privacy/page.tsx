"use client";

import { useI18n } from "@/lib/i18n";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const { locale } = useI18n();
  const vi = locale === "vi";

  return (
    <main className="relative z-10 min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-light)] hover:text-[var(--accent)] mb-8 min-h-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {vi ? "Về trang chủ" : "Back to home"}
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold">
            {vi ? "Chính Sách Bảo Mật" : "Privacy Policy"}
          </h1>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
          {vi ? (
            <>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Dữ liệu chúng tôi thu thập</h2>
                <p>VidGrab không thu thập, lưu trữ, hoặc chia sẻ bất kỳ dữ liệu cá nhân nào. Cụ thể:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Không yêu cầu đăng ký tài khoản.</li>
                  <li>Không lưu URL bạn tải — mọi xử lý diễn ra trong phiên làm việc.</li>
                  <li>Không sử dụng cookies theo dõi.</li>
                  <li>Lịch sử tải được lưu cục bộ trên trình duyệt của bạn (localStorage), không gửi đến máy chủ.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Quảng cáo</h2>
                <p>VidGrab có thể hiển thị quảng cáo từ Google AdSense. Google có thể sử dụng cookies để cá nhân hóa quảng cáo. Bạn có thể tắt cá nhân hóa quảng cáo tại cài đặt quảng cáo của Google.</p>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Báo cáo lỗi</h2>
                <p>Khi bạn gửi báo cáo lỗi, chúng tôi chỉ lưu: URL bị lỗi, thông báo lỗi, và mô tả bạn cung cấp. Không có thông tin cá nhân nào được thu thập.</p>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Liên hệ</h2>
                <p>Nếu có câu hỏi về chính sách bảo mật, vui lòng liên hệ qua GitHub Issues.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Data We Collect</h2>
                <p>VidGrab does not collect, store, or share any personal data. Specifically:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>No account registration required.</li>
                  <li>URLs are not stored — all processing happens within the session.</li>
                  <li>No tracking cookies.</li>
                  <li>Download history is stored locally in your browser (localStorage), never sent to our servers.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Advertising</h2>
                <p>VidGrab may display ads from Google AdSense. Google may use cookies to personalize ads. You can opt out of personalized advertising in your Google ad settings.</p>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Error Reports</h2>
                <p>When you submit an error report, we only store: the failed URL, error message, and your description. No personal information is collected.</p>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Contact</h2>
                <p>For privacy-related questions, please reach out via GitHub Issues.</p>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
