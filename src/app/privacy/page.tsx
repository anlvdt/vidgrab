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
                <p>VidGrab không yêu cầu tài khoản và không dùng cookies theo dõi. Một số dữ liệu kỹ thuật có thể được xử lý để vận hành tính năng tải xuống:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Không yêu cầu đăng ký tài khoản.</li>
                  <li>URL bạn nhập được gửi đến máy chủ để trích xuất thông tin và tải media; URL không được lưu lâu dài trừ khi bạn gửi báo cáo lỗi.</li>
                  <li>Không sử dụng cookies theo dõi.</li>
                  <li>Lịch sử tải được lưu cục bộ trên trình duyệt của bạn (localStorage), không gửi đến máy chủ.</li>
                  <li>Cookies xác thực tùy chọn chỉ được quản trị viên cấu hình trực tiếp trên máy chủ, không upload từ giao diện công khai.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Quảng cáo</h2>
                <p>VidGrab hiện không hiển thị quảng cáo và không tải script quảng cáo của bên thứ ba.</p>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Báo cáo lỗi</h2>
                <p>Khi bạn gửi báo cáo lỗi, chúng tôi lưu URL bị lỗi đã lược bỏ query/hash, thông báo lỗi, mô tả bạn cung cấp và thông tin User-Agent của trình duyệt để chẩn đoán.</p>
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
                <p>VidGrab does not require accounts and does not use tracking cookies. Some technical data is processed to operate downloads:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>No account registration required.</li>
                  <li>Submitted URLs are sent to the server for extraction and media download; URLs are not retained unless you submit an error report.</li>
                  <li>No tracking cookies.</li>
                  <li>Download history is stored locally in your browser (localStorage), never sent to our servers.</li>
                  <li>Optional authentication cookies are configured directly on the server by an administrator and cannot be uploaded through the public interface.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Advertising</h2>
                <p>VidGrab currently does not display ads or load third-party advertising scripts.</p>
              </section>
              <section>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Error Reports</h2>
                <p>When you submit an error report, we store the failed URL with query/hash removed, error message, your description, and browser User-Agent information for diagnostics.</p>
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
