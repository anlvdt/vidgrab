"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Locale = "en" | "vi";

// ─── English ────────────────────────────────────────────
const en = {
  // Hero
  heroTitle: "Download Public Videos in",
  heroSubtitle: "Paste a public link from YouTube, TikTok, Facebook, Vimeo, or",
  heroOtherSites: "other yt-dlp compatible sites",
  heroPlaceholder: "Paste any video URL here...",
  heroPasteHint: "Tip: Click the paste icon or press Ctrl+V to paste a URL",
  heroFetch: "Fetch",
  heroFetching: "Fetching...",
  heroPlaylist: "Playlist Mode",
  heroStep1Title: "Find Content",
  heroStep1Desc: "Browse a public video page and copy the URL",
  heroStep2Title: "Paste Link",
  heroStep2Desc: "Drop it in — we auto-detect the platform",
  heroStep3Title: "Download",
  heroStep3Desc: "Pick quality and enjoy offline",

  // Typing headline words
  typingWords: ["MP4", "MP3", "Playlist", "Best Available Quality"],

  // Platform
  platformDetected: "detected",
  platformTitle: "Popular Platforms",
  platformSubtitle: "Best results are on public videos. Some platforms may require cookies or may block server-side downloads.",
  platformMore: "More sites are attempted through yt-dlp when the video is public",

  // Video Card
  views: "views",

  // Format Picker
  bestQuality: "Best Quality (MP4)",
  audioOnly: "Audio Only (MP3)",
  tabAll: "All",
  tabVideo: "Video",
  tabAudio: "Audio",
  showMore: "more formats",

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
  historyClear: "Clear",
  historyShowMore: "more",
  historyShowLess: "Show less",
  timeJustNow: "just now",
  timeMinAgo: "m ago",
  timeHourAgo: "h ago",
  timeDayAgo: "d ago",

  // Features
  featuresTitle: "Why",
  featuresSubtitle: "Practical download tools with clear limits when a platform requires sign-in or blocks extraction.",
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
  feat6Title: "Lightning Fast",
  feat6Desc: "Powered by yt-dlp, plus focused fallbacks for YouTube and TikTok. Download history stays local.",

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
  heroTitle: "Tải Video Public",
  heroSubtitle: "Dán link public từ YouTube, TikTok, Facebook, Vimeo, hoặc",
  heroOtherSites: "trang tương thích yt-dlp",
  heroPlaceholder: "Dán link video vào đây...",
  heroPasteHint: "Mẹo: Nhấn nút dán hoặc Ctrl+V để dán URL",
  heroFetch: "Tải về",
  heroFetching: "Đang tải...",
  heroPlaylist: "Chế độ Playlist",
  heroStep1Title: "Tìm Nội Dung",
  heroStep1Desc: "Mở trang video public và sao chép URL",
  heroStep2Title: "Dán Link",
  heroStep2Desc: "Dán vào — chúng tôi tự nhận diện nền tảng",
  heroStep3Title: "Tải Về",
  heroStep3Desc: "Chọn chất lượng và thưởng thức offline",

  typingWords: ["MP4", "MP3", "Playlist", "Chất Lượng Có Sẵn"],

  platformDetected: "đã nhận diện",
  platformTitle: "Nền Tảng Phổ Biến",
  platformSubtitle: "Hoạt động tốt nhất với video public. Một số nền tảng có thể cần cookies hoặc chặn tải từ server.",
  platformMore: "Các trang khác sẽ được thử qua yt-dlp khi video ở chế độ public",

  views: "lượt xem",

  bestQuality: "Chất Lượng Tốt Nhất (MP4)",
  audioOnly: "Chỉ Âm Thanh (MP3)",
  tabAll: "Tất cả",
  tabVideo: "Video",
  tabAudio: "Âm thanh",
  showMore: "định dạng khác",

  playlistTitle: "Danh sách phát",
  playlistVideos: "video",
  selectAll: "Chọn tất cả",
  deselectAll: "Bỏ chọn tất cả",
  downloadCount: "Tải",
  video: "video",
  videoPlural: "video",

  historyTitle: "Đã Tải Gần Đây",
  historyClear: "Xóa",
  historyShowMore: "thêm",
  historyShowLess: "Thu gọn",
  timeJustNow: "vừa xong",
  timeMinAgo: " phút trước",
  timeHourAgo: " giờ trước",
  timeDayAgo: " ngày trước",

  featuresTitle: "Tại Sao Chọn",
  featuresSubtitle: "Công cụ tải thực tế, nói rõ giới hạn khi nền tảng yêu cầu đăng nhập hoặc chặn trích xuất.",
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
  feat6Title: "Nhanh Như Chớp",
  feat6Desc: "Dùng yt-dlp, kèm fallback riêng cho YouTube và TikTok. Lịch sử tải được lưu cục bộ.",

  faqTitle: "Câu Hỏi Thường Gặp",
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

export type Translations = typeof en;

// ─── Context ────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "vi",
  setLocale: () => {},
  t: vi,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "vi";
    const stored = localStorage.getItem("vidgrab-locale") as Locale | null;
    return stored && translations[stored] ? stored : "vi";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("vidgrab-locale", l);
    document.documentElement.setAttribute("lang", l);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
