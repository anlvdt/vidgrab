"use client";

import { Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/use-document-title";
import LegalPageShell from "@/components/LegalPageShell";

export default function PrivacyPage() {
  const { locale, t } = useI18n();
  const vi = locale === "vi";
  useDocumentTitle(t.titlePrivacy);

  return (
    <LegalPageShell
      icon={Lock}
      kicker={vi ? "Bảo mật" : "Privacy"}
      title={vi ? "Chính sách bảo mật" : "Privacy Policy"}
    >
      {vi ? (
        <>
          <section>
            <h2>Dữ liệu chúng tôi thu thập</h2>
            <p>
              VidGrab không yêu cầu tài khoản và không dùng cookies theo dõi.
              Một số dữ liệu kỹ thuật có thể được xử lý để vận hành tính năng
              tải xuống:
            </p>
            <ul>
              <li>Không yêu cầu đăng ký tài khoản.</li>
              <li>
                URL bạn nhập được gửi đến máy chủ để trích xuất thông tin và tải
                media; URL không được lưu lâu dài trừ khi bạn gửi báo cáo lỗi.
              </li>
              <li>Không sử dụng cookies theo dõi.</li>
              <li>
                Lịch sử tải được lưu cục bộ trên trình duyệt của bạn
                (localStorage), không gửi đến máy chủ.
              </li>
              <li>
                Cookies xác thực tùy chọn chỉ được quản trị viên cấu hình trực
                tiếp trên máy chủ, không upload từ giao diện công khai.
              </li>
            </ul>
          </section>
          <section>
            <h2>Quảng cáo</h2>
            <p>
              VidGrab hiện không hiển thị quảng cáo và không tải script quảng
              cáo của bên thứ ba. Nếu quảng cáo được bật sau khi nhà cung cấp
              phê duyệt, chính sách này sẽ được cập nhật trước khi script quảng
              cáo hoạt động.
            </p>
            <p className="mt-2">
              Khi Google AdSense được bật, Google và các đối tác có thể dùng
              cookies hoặc mã nhận dạng để phân phối, đo lường và cá nhân hóa
              quảng cáo. Người dùng có thể quản lý quảng cáo cá nhân hóa tại{" "}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cài đặt quảng cáo Google
              </a>
              . VidGrab sẽ triển khai cơ chế đồng ý phù hợp tại các khu vực pháp
              lý yêu cầu trước khi kích hoạt quảng cáo.
            </p>
          </section>
          <section>
            <h2>Báo cáo lỗi</h2>
            <p>
              Khi bạn gửi báo cáo lỗi, chúng tôi lưu URL bị lỗi đã lược bỏ
              query/hash, thông báo lỗi, mô tả bạn cung cấp và thông tin
              User-Agent của trình duyệt để chẩn đoán.
            </p>
          </section>
          <section>
            <h2>Liên hệ</h2>
            <p>
              Nếu có câu hỏi về chính sách bảo mật, vui lòng liên hệ qua{" "}
              <a
                href="https://github.com/anlvdt/vidgrab/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
              </a>
              .
            </p>
          </section>
          <p className="legal-updated">Cập nhật lần cuối: 15/07/2026.</p>
        </>
      ) : (
        <>
          <section>
            <h2>Data we collect</h2>
            <p>
              VidGrab does not require accounts and does not use tracking
              cookies. Some technical data is processed to operate downloads:
            </p>
            <ul>
              <li>No account registration required.</li>
              <li>
                Submitted URLs are sent to the server for extraction and media
                download; URLs are not retained unless you submit an error
                report.
              </li>
              <li>No tracking cookies.</li>
              <li>
                Download history is stored locally in your browser
                (localStorage), never sent to our servers.
              </li>
              <li>
                Optional authentication cookies are configured directly on the
                server by an administrator and cannot be uploaded through the
                public interface.
              </li>
            </ul>
          </section>
          <section>
            <h2>Advertising</h2>
            <p>
              VidGrab currently does not display ads or load third-party
              advertising scripts. If advertising is enabled after provider
              approval, this policy will be updated before advertising scripts
              become active.
            </p>
            <p className="mt-2">
              When Google AdSense is enabled, Google and its partners may use
              cookies or identifiers to serve, measure, and personalize ads.
              Users can manage personalized advertising in{" "}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ad Settings
              </a>
              . VidGrab will implement an appropriate consent mechanism in
              jurisdictions where one is required before enabling ads.
            </p>
          </section>
          <section>
            <h2>Error reports</h2>
            <p>
              When you submit an error report, we store the failed URL with
              query/hash removed, error message, your description, and browser
              User-Agent information for diagnostics.
            </p>
          </section>
          <section>
            <h2>Contact</h2>
            <p>
              For privacy-related questions, please reach out via{" "}
              <a
                href="https://github.com/anlvdt/vidgrab/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
              </a>
              .
            </p>
          </section>
          <p className="legal-updated">Last updated: July 15, 2026.</p>
        </>
      )}
    </LegalPageShell>
  );
}
