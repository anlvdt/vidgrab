"use client";

import { Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/use-document-title";
import LegalPageShell from "@/components/LegalPageShell";

export default function TermsPage() {
  const { locale, t } = useI18n();
  const vi = locale === "vi";
  useDocumentTitle(t.titleTerms);

  return (
    <LegalPageShell
      icon={Shield}
      kicker={vi ? "Điều khoản" : "Terms"}
      title={vi ? "Điều khoản sử dụng" : "Terms of Use"}
    >
      {vi ? (
        <>
          <section>
            <h2>1. Giới thiệu</h2>
            <p>
              VidGrab là công cụ độc lập xử lý theo yêu cầu các liên kết media
              công khai do người dùng cung cấp. VidGrab không thuộc, không được
              tài trợ hoặc chứng thực bởi các nền tảng nguồn và không duy trì
              danh mục media để tìm kiếm hoặc phát lại.
            </p>
          </section>
          <section>
            <h2>2. Trách nhiệm người dùng</h2>
            <p>
              Người dùng hoàn toàn chịu trách nhiệm về việc tải xuống và sử dụng
              nội dung. Bạn phải đảm bảo rằng:
            </p>
            <ul>
              <li>
                Nội dung tải xuống chỉ dùng cho mục đích cá nhân, phi thương mại.
              </li>
              <li>Bạn có quyền hợp pháp để tải và sử dụng nội dung đó.</li>
              <li>
                Việc tải xuống tuân thủ luật bản quyền tại quốc gia của bạn.
              </li>
              <li>
                Bạn tuân thủ điều khoản sử dụng của từng nền tảng gốc.
              </li>
            </ul>
          </section>
          <section>
            <h2>3. Bản quyền</h2>
            <p>
              VidGrab tôn trọng quyền sở hữu trí tuệ và không vượt DRM, paywall,
              cài đặt riêng tư hoặc cơ chế kiểm soát truy cập. Khả năng truy cập
              một URL công khai không đồng nghĩa với quyền sao chép nội dung.
            </p>
            <p className="mt-2">
              Nếu bạn là chủ sở hữu nội dung và muốn báo cáo vấn đề, vui lòng
              liên hệ qua{" "}
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
          <section>
            <h2>4. Miễn trừ trách nhiệm</h2>
            <p>
              VidGrab được cung cấp &quot;nguyên trạng&quot; (as-is). Chúng tôi
              không đảm bảo tính khả dụng, độ chính xác, hoặc tính hợp pháp của
              nội dung được tải xuống. Chúng tôi không chịu trách nhiệm cho bất
              kỳ thiệt hại nào phát sinh từ việc sử dụng dịch vụ.
            </p>
          </section>
          <section>
            <h2>5. Nội dung bị cấm</h2>
            <p>
              Nghiêm cấm sử dụng VidGrab để tải nội dung vi phạm pháp luật, bao
              gồm nhưng không giới hạn: nội dung có bản quyền mà không có sự cho
              phép, nội dung bất hợp pháp, hoặc nội dung vi phạm quyền riêng tư
              của người khác.
            </p>
          </section>
          <p className="legal-updated">Cập nhật lần cuối: 15/07/2026.</p>
        </>
      ) : (
        <>
          <section>
            <h2>1. Introduction</h2>
            <p>
              VidGrab is an independent tool that processes user-submitted public
              media links on demand. It is not owned, sponsored, or endorsed by
              source platforms and does not maintain a searchable or playable
              media catalog.
            </p>
          </section>
          <section>
            <h2>2. User responsibility</h2>
            <p>
              Users are solely responsible for downloading and using content. You
              must ensure that:
            </p>
            <ul>
              <li>
                Downloaded content is for personal, non-commercial use only.
              </li>
              <li>
                You have the legal right to download and use the content.
              </li>
              <li>
                Downloads comply with copyright laws in your jurisdiction.
              </li>
              <li>
                You comply with the terms of service of each source platform.
              </li>
            </ul>
          </section>
          <section>
            <h2>3. Copyright</h2>
            <p>
              VidGrab respects intellectual property rights and does not bypass
              DRM, paywalls, privacy settings, or access controls. Technical
              access to a public URL does not itself grant permission to copy its
              content.
            </p>
            <p className="mt-2">
              If you are a content owner and wish to report a concern, please
              contact us through{" "}
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
          <section>
            <h2>4. Disclaimer</h2>
            <p>
              VidGrab is provided &quot;as-is&quot;. We make no guarantees about
              the availability, accuracy, or legality of downloaded content. We
              are not liable for any damages arising from the use of this
              service.
            </p>
          </section>
          <section>
            <h2>5. Prohibited use</h2>
            <p>
              It is strictly prohibited to use VidGrab to download content that
              violates the law, including but not limited to: copyrighted content
              without permission, illegal content, or content that violates the
              privacy of others.
            </p>
          </section>
          <p className="legal-updated">Last updated: July 15, 2026.</p>
        </>
      )}
    </LegalPageShell>
  );
}
