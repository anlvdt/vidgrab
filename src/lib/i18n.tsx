"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export type Locale = "en" | "vi";

// ─── English ────────────────────────────────────────────
const en = {
  // Hero
  heroTitle: "Download video in the quality you want",
  heroSubtitle: "Paste a public link, review the available formats, then download the file you need.",
  heroOtherSites: "YouTube · TikTok · Facebook · Vimeo · more sites",
  heroPlaceholder: "Paste a public video link…",
  heroPasteHint: "Only public http(s) links are processed.",
  heroFetch: "Analyze link",
  heroFetching: "Analyzing link…",
  heroPlaylist: "This is a playlist",
  heroStep1Title: "Paste a public link",
  heroStep1Desc: "Tracking parameters are removed automatically",
  heroStep2Title: "Review available files",
  heroStep2Desc: "See quality, format and estimated size",
  heroStep3Title: "Download responsibly",
  heroStep3Desc: "Choose MP4, MP3 or a specific quality",
  heroInvalidUrl: "Enter a complete public link beginning with http:// or https://.",
  heroTrustPrivate: "No account required",
  heroTrustHistory: "History stays in this browser",
  heroTrustFilename: "Clear, professional filenames",
  pasteButton: "Paste",
  pasteSuccess: "Pasted",
  pasteSuccessHint: "Link ready — tap Analyze to continue.",

  // Document titles
  siteTitle: "VidGrab — Download public video in the quality you choose",
  titlePrivacy: "Privacy Policy | VidGrab",
  titleTerms: "Terms of Use | VidGrab",
  titleTransparency: "Technology & Transparency | VidGrab",

  // Typing headline words
  typingWords: ["MP4", "MP3", "Playlist", "Best Available Quality"],

  // Platform
  platformDetected: "detected",
  platformTitle: "Platform compatibility",
  platformSubtitle: "Support changes as platforms change. These labels show the current expected reliability for public links.",
  platformMore: "Other public links are attempted through yt-dlp without a success guarantee",
  platformStrong: "Good",
  platformConditional: "May need cookies",
  platformBestEffort: "Best effort",

  // Video Card
  views: "views",

  // Format Picker
  bestQuality: "Best available MP4",
  audioOnly: "Download MP3",
  tabAll: "All",
  tabVideo: "Video",
  tabAudio: "Audio",
  showMore: "more formats",
  resultTitle: "Choose your download",
  resultSubtitle: "Quality and size depend on what the source platform exposes.",
  formatProgressive: "Video + audio",
  formatMerged: "Audio merged automatically",
  formatAudio: "Audio only",
  downloadLabel: "Download",
  clipLabel: "Download a clip",
  clipStart: "Start",
  clipEnd: "End",
  clipEndPlaceholder: "End",

  // Playlist
  playlistTitle: "Playlist",
  playlistVideos: "videos",
  selectAll: "Select All",
  deselectAll: "Deselect All",
  downloadCount: "Download",
  video: "video",
  videoPlural: "videos",

  // History
  historyTitle: "Recent Downloads",
  historyClear: "Clear all",
  historyShowMore: "more",
  historyShowLess: "Show less",
  historyEmptyTitle: "No downloads yet",
  historyEmptyDesc:
    "When you download a file, it appears here — stored only in this browser for 7 days.",
  historyEmptyHint: "Paste a public link above to get started.",
  historyReanalyze: "Analyze again",
  historyOpenSource: "Open original",
  historyPrivacyNote: "Private to this device · auto-clears after 7 days",
  timeJustNow: "just now",
  timeMinAgo: "m ago",
  timeHourAgo: "h ago",
  timeDayAgo: "d ago",

  // Features
  featuresTitle: "What VidGrab provides",
  featuresSubtitle: "Useful controls for public media, with honest limits when a platform requires sign-in or blocks server access.",
  feat1Title: "Up to 8K HDR",
  feat1Desc: "Download in the highest resolution available — 360p up to 8K, SDR and HDR.",
  feat2Title: "Popular Platforms First",
  feat2Desc: "YouTube, TikTok, Facebook, Vimeo and public yt-dlp-compatible links work best. Instagram/X often need cookies.",
  feat3Title: "Playlist & Batch",
  feat3Desc: "Paste a playlist URL, select videos, and batch-download them all at once.",
  feat4Title: "Video or Audio Only",
  feat4Desc: "Choose video stream, audio-only MP3, or let VidGrab mux them into one file.",
  feat5Title: "Auto Platform Detection",
  feat5Desc: "Paste a URL — VidGrab recognizes common platforms and explains when a site needs cookies or a public link.",
  feat6Title: "Multiple Extraction Paths",
  feat6Desc: "yt-dlp is backed by focused fallbacks, adaptive retries and optional browser impersonation for difficult public links.",

  // FAQ
  faqTitle: "Frequently Asked Questions",
  faq1Q: "What sites does VidGrab support?",
  faq1A: "VidGrab is tested most closely with public YouTube, TikTok, Facebook, and Vimeo links. Other public sites are attempted through yt-dlp, but success depends on the platform, region, video privacy, and whether cookies are required.",
  faq2Q: "Can VidGrab download videos in 8K HDR?",
  faq2A: "When the platform exposes 4K, 8K, or HDR streams, VidGrab shows them in the format picker. Many social platforms only expose lower qualities, and some high-quality streams need cookies.",
  faq3Q: "How do I download TikTok videos without watermark?",
  faq3A: "Paste a public TikTok URL and click Fetch. VidGrab first tries a TikTok-specific scraper; if TikTok changes or the video is private, it may fail or require another source link.",
  faq4Q: "How do I download a full YouTube playlist?",
  faq4A: "Enable Playlist Mode, paste the playlist URL, then click Fetch. VidGrab loads all videos in the queue. Select which ones to download and start the batch.",
  faq5Q: "Can I download Instagram Reels and Stories?",
  faq5A: "Sometimes. Public Instagram/X links often require sign-in now. If VidGrab reports that cookies are needed, add account cookies in Settings and retry.",
  faq6Q: "Is VidGrab free to use?",
  faq6A: "Yes, VidGrab is completely free. No hidden fees.",
  faq7Q: "Is my download history saved?",
  faq7A: "Yes, your recent downloads are saved locally in your browser. Nothing is sent to any server. You can clear your history at any time.",
  faq8Q: "Why do some downloads not show a platform watermark?",
  faq8A: "Some public sources expose media files without player overlays, while others include branding in the video itself. VidGrab does not guarantee watermark-free downloads.",
  faq9Q: "Can I remove a logo from a video?",
  faq9A: "VidGrab can blur a selected corner before download. Use this only for videos you own or have permission to edit.",
  faq10Q: "Can I download only a part of a video?",
  faq10A: "Yes! You can specify start/end times to download just a clip, useful for ringtones or specific moments.",

  // Stats
  statsTitle: "Compatibility Snapshot",
  statsSubtitle: "Current capability summary from local testing and the app's extraction paths.",
  statUsers: "Tested Core Sites",
  statDownloads: "Extraction Engines",
  statPlatforms: "Recognized Platforms",
  statUptime: "Cookie-Gated Sites",
  statToday: "Public Links",
  statThisWeek: "Cookies May Help",
  statThisMonth: "Playlist Support",
  statThisYear: "Local History",
  statAvgPerDay: "Best Coverage",
  statPeakHour: "Fallbacks",
  statTopPlatform: "Most Reliable",
  statSuccessRate: "No Guarantee",

  // Guide
  guideTitle: "How to Get the Link",
  guideSubtitle: "Step-by-step guide for each platform. It only takes a few seconds.",
  guideStep1: "Open the video",
  guideStep2: "Tap Share or copy URL",
  guideStep3: "Paste into VidGrab",
  guideYoutube1: "Open YouTube app or website",
  guideYoutube2: "Tap Share below the video, then Copy Link",
  guideYoutube3: "Or copy the URL from the browser address bar",
  guideTiktok1: "Open the TikTok video",
  guideTiktok2: "Tap Share (arrow icon), then Copy Link",
  guideTiktok3: "The link looks like: vm.tiktok.com/...",
  guideInstagram1: "Open the Reel or Post",
  guideInstagram2: "Tap the three dots (...), then Copy Link",
  guideInstagram3: "For Stories: open the story, tap ... then Copy Link",
  guideTwitter1: "Open the tweet with the video",
  guideTwitter2: "Tap Share, then Copy Link",
  guideTwitter3: "The link looks like: x.com/user/status/...",
  guideFacebook1: "Open the video on Facebook",
  guideFacebook2: "Tap Share, then Copy Link",
  guideFacebook3: "Or right-click the video and copy the URL",
  guideGeneric1: "Open a public video page",
  guideGeneric2: "Copy the URL from the address bar",
  guideGeneric3: "Paste into VidGrab and click Fetch",

  // Testimonials
  testimonialsTitle: "Loved by Users",
  testimonial1: "My grandma uses this! It's literally the only downloader she doesn't call me for help with.",
  testimonial1Author: "Minh T.",
  testimonial1Role: "Content Creator",
  testimonial2: "I save recipe videos for the kitchen where the WiFi doesn't reach. A literal lifesaver.",
  testimonial2Author: "Lan P.",
  testimonial2Role: "Home Chef",
  testimonial3: "I like that it tells me when Instagram or X needs cookies instead of pretending every link will work.",
  testimonial3Author: "Duc N.",
  testimonial3Role: "Social Media Manager",
  testimonial4: "YouTube quality options are clear, and TikTok links are quick when the video is public.",
  testimonial4Author: "Hoa V.",
  testimonial4Role: "Videographer",
  ctaTitle: "Ready to start?",
  ctaSubtitle: "Start downloading in seconds. Free, forever.",
  ctaButton: "Get Started",

  // Footer
  footerMadeWith: "Made with",
  footerPoweredBy: "Powered by yt-dlp",
  footerDisclaimer: "VidGrab does not host any copyrighted content. This tool only retrieves publicly available media from third-party platforms. Users are solely responsible for ensuring their downloads comply with applicable laws and the terms of service of each platform.",
  footerTerms: "Terms of Use",
  footerPrivacy: "Privacy",
  footerTransparency: "Transparency",
  footerSource: "Source code",

  // Error
  networkError: "Network error. Please check your connection and try again.",
  errorReportBtn: "Report Issue",
  errorReportTitle: "Report Download Issue",
  errorReportUrl: "URL that failed",
  errorReportDesc: "What happened?",
  errorReportDescPlaceholder: "Describe the issue...",
  errorReportSend: "Send Report",
  errorReportSending: "Sending...",
  errorReportSuccess: "Report sent. Thank you!",
  errorReportFail: "Could not send report. Try again later.",
  errorRetry: "Try Again",
};

// ─── Vietnamese ─────────────────────────────────────────
const vi: typeof en = {
  heroTitle: "Tải video theo chất lượng bạn muốn",
  heroSubtitle: "Dán liên kết công khai, xem các định dạng có sẵn rồi chọn file phù hợp.",
  heroOtherSites: "YouTube · TikTok · Facebook · Vimeo · nguồn khác",
  heroPlaceholder: "Dán liên kết video công khai…",
  heroPasteHint: "Chỉ xử lý liên kết http(s) công khai.",
  heroFetch: "Phân tích liên kết",
  heroFetching: "Đang phân tích…",
  heroPlaylist: "Đây là danh sách phát",
  heroStep1Title: "Dán liên kết công khai",
  heroStep1Desc: "Tự loại bỏ tham số theo dõi không cần thiết",
  heroStep2Title: "Xem các file có sẵn",
  heroStep2Desc: "Kiểm tra chất lượng, định dạng và dung lượng",
  heroStep3Title: "Tải xuống có trách nhiệm",
  heroStep3Desc: "Chọn MP4, MP3 hoặc chất lượng cụ thể",
  heroInvalidUrl: "Hãy nhập liên kết công khai đầy đủ, bắt đầu bằng http:// hoặc https://.",
  heroTrustPrivate: "Không cần tài khoản",
  heroTrustHistory: "Lịch sử chỉ lưu trong trình duyệt",
  heroTrustFilename: "Tên file rõ ràng, chuyên nghiệp",
  pasteButton: "Dán",
  pasteSuccess: "Đã dán",
  pasteSuccessHint: "Liên kết sẵn sàng — bấm Phân tích để tiếp tục.",

  siteTitle: "VidGrab — Tải video công khai theo chất lượng bạn chọn",
  titlePrivacy: "Chính sách bảo mật | VidGrab",
  titleTerms: "Điều khoản sử dụng | VidGrab",
  titleTransparency: "Công nghệ & Minh bạch | VidGrab",

  typingWords: ["MP4", "MP3", "Playlist", "Chất Lượng Có Sẵn"],

  platformDetected: "đã nhận diện",
  platformTitle: "Tương thích nền tảng",
  platformSubtitle: "Mức hỗ trợ thay đổi theo từng nền tảng. Nhãn dưới đây phản ánh độ ổn định dự kiến với liên kết công khai.",
  platformMore: "Các liên kết công khai khác vẫn được thử qua yt-dlp nhưng không cam kết thành công",
  platformStrong: "Tốt",
  platformConditional: "Có thể cần cookie",
  platformBestEffort: "Thử nghiệm",

  views: "lượt xem",

  bestQuality: "Tải MP4 tốt nhất",
  audioOnly: "Tải MP3",
  tabAll: "Tất cả",
  tabVideo: "Video",
  tabAudio: "Âm thanh",
  showMore: "định dạng khác",
  resultTitle: "Chọn file muốn tải",
  resultSubtitle: "Chất lượng và dung lượng phụ thuộc vào dữ liệu nền tảng nguồn cung cấp.",
  formatProgressive: "Video + âm thanh",
  formatMerged: "Tự ghép âm thanh",
  formatAudio: "Chỉ âm thanh",
  downloadLabel: "Tải xuống",
  clipLabel: "Chỉ tải một đoạn",
  clipStart: "Bắt đầu",
  clipEnd: "Kết thúc",
  clipEndPlaceholder: "Cuối video",

  playlistTitle: "Danh sách phát",
  playlistVideos: "video",
  selectAll: "Chọn tất cả",
  deselectAll: "Bỏ chọn tất cả",
  downloadCount: "Tải",
  video: "video",
  videoPlural: "video",

  historyTitle: "Đã tải gần đây",
  historyClear: "Xóa hết",
  historyShowMore: "thêm",
  historyShowLess: "Thu gọn",
  historyEmptyTitle: "Chưa có lượt tải nào",
  historyEmptyDesc:
    "Khi bạn tải file, mục sẽ hiện ở đây — chỉ lưu trong trình duyệt này, tự xóa sau 7 ngày.",
  historyEmptyHint: "Dán liên kết công khai ở phía trên để bắt đầu.",
  historyReanalyze: "Phân tích lại",
  historyOpenSource: "Mở nguồn",
  historyPrivacyNote: "Chỉ trên thiết bị này · tự xóa sau 7 ngày",
  timeJustNow: "vừa xong",
  timeMinAgo: " phút trước",
  timeHourAgo: " giờ trước",
  timeDayAgo: " ngày trước",

  featuresTitle: "VidGrab có gì",
  featuresSubtitle: "Các công cụ hữu ích cho media công khai, đồng thời nói rõ giới hạn khi nền tảng yêu cầu đăng nhập hoặc chặn truy cập từ server.",
  feat1Title: "Lên Đến 8K HDR",
  feat1Desc: "Tải với độ phân giải cao nhất — từ 360p đến 8K, SDR và HDR.",
  feat2Title: "Ưu Tiên Nền Tảng Phổ Biến",
  feat2Desc: "YouTube, TikTok, Facebook, Vimeo và link public tương thích yt-dlp hoạt động tốt nhất. Instagram/X thường cần cookies.",
  feat3Title: "Playlist & Tải Hàng Loạt",
  feat3Desc: "Dán URL playlist, chọn video, và tải hàng loạt cùng lúc.",
  feat4Title: "Video hoặc Chỉ Âm Thanh",
  feat4Desc: "Chọn video, chỉ âm thanh MP3, hoặc để VidGrab ghép tự động.",
  feat5Title: "Tự Nhận Diện Nền Tảng",
  feat5Desc: "Dán URL — VidGrab nhận diện nền tảng phổ biến và báo rõ khi cần cookies hoặc link public.",
  feat6Title: "Nhiều Lớp Trích Xuất",
  feat6Desc: "yt-dlp kết hợp fallback chuyên biệt, retry thích nghi và giả lập trình duyệt tùy chọn cho các liên kết công khai khó tải.",

  faqTitle: "Câu hỏi thường gặp",
  faq1Q: "VidGrab hỗ trợ những trang nào?",
  faq1A: "VidGrab được test kỹ nhất với link public từ YouTube, TikTok, Facebook và Vimeo. Các trang public khác sẽ được thử qua yt-dlp, nhưng thành công phụ thuộc nền tảng, khu vực, quyền riêng tư của video và việc có cần cookies hay không.",
  faq2Q: "VidGrab có tải được video 8K HDR không?",
  faq2A: "Khi nền tảng cung cấp luồng 4K, 8K hoặc HDR, VidGrab sẽ hiển thị trong bộ chọn định dạng. Nhiều mạng xã hội chỉ cung cấp chất lượng thấp hơn, và một số luồng chất lượng cao cần cookies.",
  faq3Q: "Làm sao tải video TikTok không có watermark?",
  faq3A: "Dán URL TikTok public và nhấn Tải về. VidGrab thử scraper riêng cho TikTok trước; nếu TikTok thay đổi hoặc video riêng tư, link có thể không tải được.",
  faq4Q: "Làm sao tải toàn bộ playlist YouTube?",
  faq4A: "Bật Chế độ Playlist, dán URL playlist, rồi nhấn Tải về. VidGrab sẽ tải tất cả video vào hàng đợi. Bạn có thể chọn video nào muốn tải và bắt đầu.",
  faq5Q: "Tôi có thể tải Instagram Reels và Stories không?",
  faq5A: "Có lúc được. Link Instagram/X public hiện thường yêu cầu đăng nhập. Nếu VidGrab báo cần cookies, hãy thêm cookies tài khoản trong Cài đặt rồi thử lại.",
  faq6Q: "VidGrab có miễn phí không?",
  faq6A: "Có, VidGrab hoàn toàn miễn phí. Không có phí ẩn.",
  faq7Q: "Lịch sử tải có được lưu không?",
  faq7A: "Có, lịch sử tải gần đây được lưu cục bộ trong trình duyệt. Không có gì được gửi đến máy chủ. Bạn có thể xóa lịch sử bất cứ lúc nào.",
  faq8Q: "Tại sao một số video tải về không có logo nền tảng?",
  faq8A: "Một số nguồn public trả về file media không có lớp phủ trình phát, trong khi nguồn khác nhúng branding trực tiếp trong video. VidGrab không cam kết mọi video đều không có watermark.",
  faq9Q: "Tôi có thể che logo trong video không?",
  faq9A: "VidGrab có thể làm mờ một góc được chọn trước khi tải. Chỉ dùng cho video bạn sở hữu hoặc có quyền chỉnh sửa.",
  faq10Q: "Tôi có thể tải một phần của video không?",
  faq10A: "Có! Bạn có thể chỉ định thời gian bắt đầu/kết thúc để tải clip, hữu ích cho nhạc chuông.",

  statsTitle: "Tình Trạng Tương Thích",
  statsSubtitle: "Tóm tắt năng lực hiện tại dựa trên test local và các luồng trích xuất trong app.",
  statUsers: "Site Lõi Đã Test",
  statDownloads: "Engine Trích Xuất",
  statPlatforms: "Nền Tảng Nhận Diện",
  statUptime: "Site Cần Cookies",
  statToday: "Link Public",
  statThisWeek: "Cookies Có Thể Giúp",
  statThisMonth: "Hỗ Trợ Playlist",
  statThisYear: "Lịch Sử Cục Bộ",
  statAvgPerDay: "Phủ Tốt Nhất",
  statPeakHour: "Fallback",
  statTopPlatform: "Ổn Định Nhất",
  statSuccessRate: "Không Cam Kết",

  guideTitle: "Cách Lấy Link Video",
  guideSubtitle: "Hướng dẫn từng bước cho mỗi nền tảng. Chỉ mất vài giây.",
  guideStep1: "Mở video",
  guideStep2: "Nhấn Chia sẻ hoặc sao chép URL",
  guideStep3: "Dán vào VidGrab",
  guideYoutube1: "Mở ứng dụng hoặc trang web YouTube",
  guideYoutube2: "Nhấn Chia sẻ bên dưới video, rồi chọn Sao chép liên kết",
  guideYoutube3: "Hoặc sao chép URL từ thanh địa chỉ trình duyệt",
  guideTiktok1: "Mở video TikTok",
  guideTiktok2: "Nhấn Chia sẻ (biểu tượng mũi tên), rồi Sao chép liên kết",
  guideTiktok3: "Link có dạng: vm.tiktok.com/...",
  guideInstagram1: "Mở Reel hoặc Bài đăng",
  guideInstagram2: "Nhấn ba chấm (...), rồi Sao chép liên kết",
  guideInstagram3: "Với Stories: mở story, nhấn ... rồi Sao chép liên kết",
  guideTwitter1: "Mở tweet có chứa video",
  guideTwitter2: "Nhấn Chia sẻ, rồi Sao chép liên kết",
  guideTwitter3: "Link có dạng: x.com/user/status/...",
  guideFacebook1: "Mở video trên Facebook",
  guideFacebook2: "Nhấn Chia sẻ, rồi Sao chép liên kết",
  guideFacebook3: "Hoặc nhấp chuột phải vào video và sao chép URL",
  guideGeneric1: "Mở trang video public",
  guideGeneric2: "Sao chép URL từ thanh địa chỉ",
  guideGeneric3: "Dán vào VidGrab và nhấn Tải về",

  testimonialsTitle: "Người Dùng Yêu Thích",
  testimonial1: "Bà tôi cũng dùng được! Đây là công cụ tải video duy nhất mà bà không cần gọi tôi hỗ trợ.",
  testimonial1Author: "Minh T.",
  testimonial1Role: "Nhà sáng tạo nội dung",
  testimonial2: "Tôi lưu video nấu ăn để xem trong bếp nơi WiFi không tới. Thật sự cứu cánh.",
  testimonial2Author: "Lan P.",
  testimonial2Role: "Đầu bếp tại gia",
  testimonial3: "Mình thích việc app báo rõ khi Instagram hoặc X cần cookies, thay vì hứa link nào cũng tải được.",
  testimonial3Author: "Đức N.",
  testimonial3Role: "Quản lý mạng xã hội",
  testimonial4: "Tùy chọn chất lượng YouTube rõ ràng, còn link TikTok public thì xử lý rất nhanh.",
  testimonial4Author: "Hoa V.",
  testimonial4Role: "Quay phim",
  ctaTitle: "Sẵn sàng bắt đầu?",
  ctaSubtitle: "Bắt đầu tải trong vài giây. Miễn phí, mãi mãi.",
  ctaButton: "Bắt Đầu Ngay",

  footerMadeWith: "Được tạo với",
  footerPoweredBy: "Sử dụng yt-dlp",
  footerDisclaimer: "VidGrab không lưu trữ bất kỳ nội dung có bản quyền nào. Công cụ này chỉ truy xuất nội dung công khai từ các nền tảng bên thứ ba. Người dùng hoàn toàn chịu trách nhiệm đảm bảo việc tải xuống tuân thủ luật pháp hiện hành và điều khoản sử dụng của từng nền tảng.",
  footerTerms: "Điều Khoản",
  footerPrivacy: "Bảo Mật",
  footerTransparency: "Minh Bạch",
  footerSource: "Mã Nguồn",

  networkError: "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.",
  errorReportBtn: "Báo Lỗi",
  errorReportTitle: "Báo Lỗi Tải Video",
  errorReportUrl: "URL bị lỗi",
  errorReportDesc: "Mô tả vấn đề",
  errorReportDescPlaceholder: "Mô tả lỗi bạn gặp phải...",
  errorReportSend: "Gửi Báo Cáo",
  errorReportSending: "Đang gửi...",
  errorReportSuccess: "Đã gửi báo cáo. Cảm ơn bạn!",
  errorReportFail: "Không thể gửi. Vui lòng thử lại sau.",
  errorRetry: "Thử Lại",
};

// ─── Translations map ───────────────────────────────────
const translations: Record<Locale, typeof en> = { en, vi };
const LOCALE_EVENT = "vidgrab-locale-change";

function subscribeLocale(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCALE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCALE_EVENT, onStoreChange);
  };
}

/** Default product language is Vietnamese. */
const DEFAULT_LOCALE: Locale = "vi";

function localeSnapshot(): Locale {
  const stored = localStorage.getItem("vidgrab-locale") as Locale | null;
  if (stored && translations[stored]) return stored;
  // First visit / invalid value → persist VI so UI stays consistent
  try {
    localStorage.setItem("vidgrab-locale", DEFAULT_LOCALE);
  } catch {
    /* private mode */
  }
  return DEFAULT_LOCALE;
}

function serverLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export type Translations = typeof en;

// ─── Context ────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: vi,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    localeSnapshot,
    serverLocaleSnapshot
  );

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("vidgrab-locale", l);
    document.documentElement.setAttribute("lang", l);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
    // Ensure default is always written if storage was empty after SSR hydrate
    if (!localStorage.getItem("vidgrab-locale")) {
      localStorage.setItem("vidgrab-locale", DEFAULT_LOCALE);
    }
  }, [locale]);

  const pathname = usePathname();

  // Home document title follows locale. Legal pages set their own titles.
  // Do not treat pathname=null as "/" — that races and overwrites legal titles.
  useEffect(() => {
    if (pathname == null) return;
    const path = pathname.replace(/\/$/, "") || "/";
    if (path === "/") {
      document.title = translations[locale].siteTitle;
    }
  }, [locale, pathname]);

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
