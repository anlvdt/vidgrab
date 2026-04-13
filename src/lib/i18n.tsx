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
  heroTitle: "Download Any Video in",
  heroSubtitle: "Paste a link from YouTube, TikTok, Instagram, X, or",
  heroOtherSites: "other sites",
  heroPlaceholder: "Paste any video URL here...",
  heroPasteHint: "Tip: Click the paste icon or press Ctrl+V to paste a URL",
  heroFetch: "Fetch",
  heroFetching: "Fetching...",
  heroPlaylist: "Playlist Mode",
  heroStep1Title: "Find Content",
  heroStep1Desc: "Browse any supported site and copy the URL",
  heroStep2Title: "Paste Link",
  heroStep2Desc: "Drop it in — we auto-detect the platform",
  heroStep3Title: "Download",
  heroStep3Desc: "Pick quality and enjoy offline",

  // Typing headline words
  typingWords: ["4K", "8K HDR", "MP3", "Playlist"],

  // Platform
  platformDetected: "detected",
  platformTitle: "Sites Supported",
  platformSubtitle: "Not just YouTube. Download from virtually any platform on the internet.",
  platformMore: "more sites powered by yt-dlp",

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
  featuresSubtitle: "Everything you need to save your favorite content for offline viewing.",
  feat1Title: "Up to 8K HDR",
  feat1Desc: "Download in the highest resolution available — 360p up to 8K, SDR and HDR.",
  feat2Title: "1,800+ Sites",
  feat2Desc: "YouTube, TikTok, Instagram, X, Facebook, Reddit, Twitch, Vimeo and thousands more.",
  feat3Title: "Playlist & Batch",
  feat3Desc: "Paste a playlist URL, select videos, and batch-download them all at once.",
  feat4Title: "Video or Audio Only",
  feat4Desc: "Choose video stream, audio-only MP3, or let VidGrab mux them into one file.",
  feat5Title: "Auto Platform Detection",
  feat5Desc: "Paste any URL — VidGrab instantly recognizes the platform and fetches the best options.",
  feat6Title: "Lightning Fast",
  feat6Desc: "Powered by yt-dlp for maximum speed and reliability. Download history saved locally.",

  // FAQ
  faqTitle: "Frequently Asked Questions",
  faq1Q: "What sites does VidGrab support?",
  faq1A: "VidGrab supports 1,800+ websites including YouTube, TikTok, Instagram, X/Twitter, Facebook, Reddit, Twitch, Vimeo, Dailymotion, SoundCloud, Bilibili, Pinterest, and many more. Just paste any URL and we'll auto-detect the platform.",
  faq2Q: "Can VidGrab download videos in 8K HDR?",
  faq2A: "Yes. VidGrab fetches all streams the platform exposes. If an 8K or HDR stream exists, you'll see it in the format picker. VidGrab will mux video-only streams with audio automatically.",
  faq3Q: "How do I download TikTok videos without watermark?",
  faq3A: "Just paste the TikTok URL and click Fetch. VidGrab uses yt-dlp which fetches the highest quality version available. For most TikTok videos, this means no watermark.",
  faq4Q: "How do I download a full YouTube playlist?",
  faq4A: "Enable Playlist Mode, paste the playlist URL, then click Fetch. VidGrab loads all videos in the queue. Select which ones to download and start the batch.",
  faq5Q: "Can I download Instagram Reels and Stories?",
  faq5A: "Yes. Paste the Instagram Reel or Story URL directly. VidGrab supports Instagram posts, Reels, Stories, and IGTV content.",
  faq6Q: "Is VidGrab free to use?",
  faq6A: "Yes, VidGrab is completely free. No hidden fees.",
  faq7Q: "Is my download history saved?",
  faq7A: "Yes, your recent downloads are saved locally in your browser. Nothing is sent to any server. You can clear your history at any time.",

  // Stats
  statsTitle: "Trusted by Thousands",
  statsSubtitle: "Join the community of happy users who save time every day.",
  statUsers: "Happy Users",
  statDownloads: "Total Downloads",
  statPlatforms: "Platforms",
  statUptime: "Uptime",
  statToday: "Today",
  statThisWeek: "This Week",
  statThisMonth: "This Month",
  statThisYear: "This Year",
  statAvgPerDay: "Avg / Day",
  statPeakHour: "Peak Hour",
  statTopPlatform: "Top Platform",
  statSuccessRate: "Success Rate",

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
  guideGeneric1: "Open the video on any supported site",
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
  testimonial3: "Finally a downloader that works with TikTok, Instagram AND YouTube. No more switching between 5 different sites.",
  testimonial3Author: "Duc N.",
  testimonial3Role: "Social Media Manager",
  testimonial4: "The 8K HDR download is insane. I archive nature documentaries and the quality is perfect.",
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
  heroTitle: "Tải Mọi Video Chất Lượng",
  heroSubtitle: "Dán link từ YouTube, TikTok, Instagram, X, hoặc",
  heroOtherSites: "trang khác",
  heroPlaceholder: "Dán link video vào đây...",
  heroPasteHint: "Mẹo: Nhấn nút dán hoặc Ctrl+V để dán URL",
  heroFetch: "Tải về",
  heroFetching: "Đang tải...",
  heroPlaylist: "Chế độ Playlist",
  heroStep1Title: "Tìm Nội Dung",
  heroStep1Desc: "Duyệt bất kỳ trang nào và sao chép URL",
  heroStep2Title: "Dán Link",
  heroStep2Desc: "Dán vào — chúng tôi tự nhận diện nền tảng",
  heroStep3Title: "Tải Về",
  heroStep3Desc: "Chọn chất lượng và thưởng thức offline",

  typingWords: ["4K", "8K HDR", "MP3", "Playlist"],

  platformDetected: "đã nhận diện",
  platformTitle: "Trang Web Được Hỗ Trợ",
  platformSubtitle: "Không chỉ YouTube. Tải video từ hầu hết mọi nền tảng trên internet.",
  platformMore: "trang khác được hỗ trợ bởi yt-dlp",

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
  featuresSubtitle: "Mọi thứ bạn cần để lưu nội dung yêu thích và xem offline.",
  feat1Title: "Lên Đến 8K HDR",
  feat1Desc: "Tải với độ phân giải cao nhất — từ 360p đến 8K, SDR và HDR.",
  feat2Title: "1.800+ Trang Web",
  feat2Desc: "YouTube, TikTok, Instagram, X, Facebook, Reddit, Twitch, Vimeo và hàng nghìn trang khác.",
  feat3Title: "Playlist & Tải Hàng Loạt",
  feat3Desc: "Dán URL playlist, chọn video, và tải hàng loạt cùng lúc.",
  feat4Title: "Video hoặc Chỉ Âm Thanh",
  feat4Desc: "Chọn video, chỉ âm thanh MP3, hoặc để VidGrab ghép tự động.",
  feat5Title: "Tự Nhận Diện Nền Tảng",
  feat5Desc: "Dán bất kỳ URL nào — VidGrab nhận diện nền tảng ngay lập tức và đưa ra lựa chọn tốt nhất.",
  feat6Title: "Nhanh Như Chớp",
  feat6Desc: "Sử dụng yt-dlp cho tốc độ và độ tin cậy tối đa. Lịch sử tải được lưu cục bộ.",

  faqTitle: "Câu Hỏi Thường Gặp",
  faq1Q: "VidGrab hỗ trợ những trang nào?",
  faq1A: "VidGrab hỗ trợ hơn 1.800 trang web bao gồm YouTube, TikTok, Instagram, X/Twitter, Facebook, Reddit, Twitch, Vimeo, Dailymotion, SoundCloud, Bilibili, Pinterest và nhiều trang khác. Chỉ cần dán URL và chúng tôi sẽ tự nhận diện nền tảng.",
  faq2Q: "VidGrab có tải được video 8K HDR không?",
  faq2A: "Có. VidGrab lấy tất cả luồng mà nền tảng cung cấp. Nếu có luồng 8K hoặc HDR, bạn sẽ thấy trong bộ chọn định dạng. VidGrab sẽ tự động ghép video với âm thanh.",
  faq3Q: "Làm sao tải video TikTok không có watermark?",
  faq3A: "Chỉ cần dán URL TikTok và nhấn Tải về. VidGrab sử dụng yt-dlp để lấy phiên bản chất lượng cao nhất. Với hầu hết video TikTok, điều này có nghĩa là không có watermark.",
  faq4Q: "Làm sao tải toàn bộ playlist YouTube?",
  faq4A: "Bật Chế độ Playlist, dán URL playlist, rồi nhấn Tải về. VidGrab sẽ tải tất cả video vào hàng đợi. Bạn có thể chọn video nào muốn tải và bắt đầu.",
  faq5Q: "Tôi có thể tải Instagram Reels và Stories không?",
  faq5A: "Có. Dán trực tiếp URL Instagram Reel hoặc Story. VidGrab hỗ trợ bài đăng, Reels, Stories và nội dung IGTV của Instagram.",
  faq6Q: "VidGrab có miễn phí không?",
  faq6A: "Có, VidGrab hoàn toàn miễn phí. Không có phí ẩn.",
  faq7Q: "Lịch sử tải có được lưu không?",
  faq7A: "Có, lịch sử tải gần đây được lưu cục bộ trong trình duyệt. Không có gì được gửi đến máy chủ. Bạn có thể xóa lịch sử bất cứ lúc nào.",

  statsTitle: "Được Tin Dùng Bởi Hàng Nghìn Người",
  statsSubtitle: "Tham gia cộng đồng người dùng hài lòng, tiết kiệm thời gian mỗi ngày.",
  statUsers: "Người Dùng",
  statDownloads: "Tổng Lượt Tải",
  statPlatforms: "Nền Tảng",
  statUptime: "Hoạt Động",
  statToday: "Hôm Nay",
  statThisWeek: "Tuần Này",
  statThisMonth: "Tháng Này",
  statThisYear: "Năm Nay",
  statAvgPerDay: "TB / Ngày",
  statPeakHour: "Giờ Cao Điểm",
  statTopPlatform: "Nền Tảng Hàng Đầu",
  statSuccessRate: "Tỷ Lệ Thành Công",

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
  guideGeneric1: "Mở video trên bất kỳ trang được hỗ trợ",
  guideGeneric2: "Sao chép URL từ thanh địa chỉ",
  guideGeneric3: "Dán vào VidGrab và nhấn Tải về",

  testimonialsTitle: "Người Dùng Yêu Thích",
  testimonial1: "Bà tôi cũng dùng được! Đây là công cụ tải video duy nhất mà bà không cần gọi tôi hỗ trợ.",
  testimonial1Author: "Minh T.",
  testimonial1Role: "Nhà sáng tạo nội dung",
  testimonial2: "Tôi lưu video nấu ăn để xem trong bếp nơi WiFi không tới. Thật sự cứu cánh.",
  testimonial2Author: "Lan P.",
  testimonial2Role: "Đầu bếp tại gia",
  testimonial3: "Cuối cùng cũng có công cụ tải được cả TikTok, Instagram VÀ YouTube. Không cần chuyển qua lại 5 trang khác nhau nữa.",
  testimonial3Author: "Đức N.",
  testimonial3Role: "Quản lý mạng xã hội",
  testimonial4: "Tải video 8K HDR quá đỉnh. Tôi lưu trữ phim tài liệu thiên nhiên và chất lượng hoàn hảo.",
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
  const [locale, setLocaleState] = useState<Locale>("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("vidgrab-locale") as Locale | null;
    if (stored && translations[stored]) {
      setLocaleState(stored);
    }
    // Default is Vietnamese — no auto-detect needed
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("vidgrab-locale", l);
    document.documentElement.setAttribute("lang", l);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale, mounted]);

  const t = translations[locale];

  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
