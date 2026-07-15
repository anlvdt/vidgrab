"use client";

import { useState, useCallback, useEffect, useRef, type MouseEvent } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Hero from "@/components/Hero";
import VideoCard from "@/components/VideoCard";
import VideoPreview from "@/components/VideoPreview";
import FormatPicker from "@/components/FormatPicker";
import PlaylistQueue from "@/components/PlaylistQueue";
import PlatformGrid from "@/components/PlatformGrid";
import DownloadHistory from "@/components/DownloadHistory";
import { addToHistory } from "@/components/DownloadHistory";
import Features from "@/components/Features";
import FAQ from "@/components/FAQ";
import TechnologyCredits from "@/components/TechnologyCredits";
import Footer from "@/components/Footer";
import AuroraBackground from "@/components/AuroraBackground";
import ConfettiBurst from "@/components/ConfettiBurst";
import SettingsPanel from "@/components/SettingsPanel";
import ErrorReport from "@/components/ErrorReport";
import AnalyzingSkeleton from "@/components/AnalyzingSkeleton";
import { detectPlatform } from "@/lib/platforms";
import { useI18n } from "@/lib/i18n";
import { AlertCircle, Download, Music } from "lucide-react";
import { applyLogoRemovalParams, getLogoRemovalMode } from "@/lib/download-settings";

interface VideoFormat {
  formatId: string;
  ext: string;
  resolution: string;
  fps: number | null;
  vcodec: string;
  acodec: string;
  filesize: number | null;
  filesizeApprox: number | null;
  tbr: number | null;
  quality: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isHdr: boolean;
}

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  uploader: string;
  viewCount: number;
  uploadDate: string;
  description: string;
  formats: VideoFormat[];
  isPlaylist: boolean;
  playlistCount?: number;
  playlistEntries?: {
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    durationString: string;
    url: string;
  }[];
  // Cobalt/Scraper fallback fields
  directUrl?: string;
  directAudioUrl?: string;
  cobaltUrl?: string;
  cobaltAudioUrl?: string;
  cobaltPicker?: { type: string; url: string; thumb?: string }[];
}

function localizedError(message: string, locale: "en" | "vi"): string {
  if (locale === "en") return message;
  if (/too many requests|rate limited|429/i.test(message))
    return "Máy chủ đang nhận quá nhiều yêu cầu. Hãy đợi một lát rồi thử lại.";
  if (/sign.?in|login|required|cookies?|authentication/i.test(message))
    return "Nền tảng này đang yêu cầu đăng nhập hoặc cookie hợp lệ. Hãy kiểm tra Cài đặt rồi thử lại.";
  if (/private|restricted/i.test(message))
    return "Video đang ở chế độ riêng tư hoặc bị giới hạn quyền truy cập.";
  if (/region|country|geo/i.test(message))
    return "Video không khả dụng tại khu vực của máy chủ.";
  if (/not found|deleted|404/i.test(message))
    return "Không tìm thấy video hoặc nội dung đã bị xóa.";
  if (/unsupported|not supported/i.test(message))
    return "Nền tảng hoặc kiểu liên kết này hiện chưa được hỗ trợ ổn định.";
  if (/network|timed? out|timeout/i.test(message))
    return "Kết nối tới nền tảng nguồn bị gián đoạn. Hãy thử lại sau ít phút.";
  if (/valid public url|valid url/i.test(message))
    return "Hãy nhập một liên kết http(s) công khai hợp lệ.";
  if (/could not download|failed to fetch|extraction|signature|bot detection/i.test(message))
    return "Chưa thể trích xuất video. Nội dung có thể bị giới hạn hoặc nền tảng vừa thay đổi cơ chế truy cập.";
  return message || "Đã xảy ra lỗi ngoài dự kiến. Vui lòng thử lại.";
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [confetti, setConfetti] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const { locale } = useI18n();

  useEffect(() => {
    if (loading || videoInfo || error) {
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [loading, error, videoInfo]);

  const handleFetch = async (url: string, isPlaylist: boolean) => {
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setCurrentUrl(url);

    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, playlist: isPlaylist }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(localizedError(data.error || "Something went wrong", locale));
        return;
      }

      setVideoInfo(data);
    } catch {
      setError(locale === "vi"
        ? "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại."
        : "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStart = useCallback(() => {
    setConfetti(true);

    // Save to history
    if (videoInfo) {
      const platform = detectPlatform(currentUrl);
      addToHistory({
        url: currentUrl,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        platform: platform?.name || "Unknown",
        platformIcon: platform?.id || "unknown",
        quality: "Best",
      });
    }
  }, [videoInfo, currentUrl]);

  const handleConfettiDone = useCallback(() => {
    setConfetti(false);
  }, []);

  const buildDirectDownloadUrl = useCallback(
    (targetUrl: string, audioOnly = false) => {
      const params = new URLSearchParams({
        url: targetUrl,
        title: videoInfo?.title || "video",
        source: currentUrl,
        direct: "true",
      });
      if (videoInfo?.id) params.set("videoId", videoInfo.id);
      if (videoInfo?.uploader) params.set("uploader", videoInfo.uploader);
      const platform = detectPlatform(currentUrl);
      if (platform) params.set("platform", platform.id);
      if (audioOnly) params.set("audio", "true");
      applyLogoRemovalParams(params, !audioOnly);
      return `/api/download?${params.toString()}`;
    },
    [currentUrl, videoInfo?.id, videoInfo?.title, videoInfo?.uploader]
  );

  const handleDirectVideoDownload = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, targetUrl: string) => {
      if (getLogoRemovalMode() !== "blur") {
        handleDownloadStart();
        return;
      }
      event.preventDefault();
      handleDownloadStart();
      window.open(buildDirectDownloadUrl(targetUrl), "_blank");
    },
    [buildDirectDownloadUrl, handleDownloadStart]
  );

  return (
    <ErrorBoundary>
      <AuroraBackground />
      <ConfettiBurst active={confetti} onDone={handleConfettiDone} />

      <main className="relative z-10 min-h-screen">
        <Hero onFetch={handleFetch} loading={loading} />

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {loading
            ? locale === "vi"
              ? "Đang phân tích liên kết và kiểm tra các luồng tải xuống."
              : "Analyzing the link and checking available download streams."
            : videoInfo
              ? locale === "vi"
                ? "Đã phân tích xong. Hãy chọn file muốn tải."
                : "Analysis complete. Choose a file to download."
              : error || ""}
        </div>

        {/* Analyzing skeleton */}
        {loading && (
          <div
            ref={(node) => {
              resultRef.current = node;
            }}
          >
            <AnalyzingSkeleton url={currentUrl} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <section
            ref={resultRef}
            className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 scroll-mt-6"
            aria-labelledby="download-error-title"
          >
            <div className="mx-auto w-full max-w-3xl">
              <div className="glass-card rounded-2xl border border-[color-mix(in_srgb,var(--danger)_40%,var(--glass-border))] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]">
                    <AlertCircle className="h-4 w-4 text-[var(--danger)]" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="download-error-title"
                      className="text-sm font-semibold tracking-tight text-[var(--danger)] sm:text-base"
                    >
                      {locale === "vi"
                        ? "Chưa thể xử lý liên kết"
                        : "This link could not be processed"}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {error}
                    </p>
                  </div>
                </div>
                <ErrorReport
                  url={currentUrl}
                  error={error}
                  onRetry={() => currentUrl && handleFetch(currentUrl, false)}
                />
              </div>
            </div>
          </section>
        )}

        {/* Video result */}
        {videoInfo && !videoInfo.isPlaylist && !loading && (
          <section
            ref={resultRef}
            className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-6 pb-12"
            aria-labelledby="download-result-title"
          >
            <div className="mx-auto w-full max-w-3xl mb-6 text-center">
              <p className="section-kicker">
                {locale === "vi" ? "Đã phân tích xong" : "Analysis complete"}
              </p>
              <h2 id="download-result-title" className="text-2xl sm:text-3xl font-bold tracking-tight">
                {locale === "vi" ? "Chọn file muốn tải" : "Choose your download"}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                {locale === "vi"
                  ? "Chất lượng và dung lượng phụ thuộc vào dữ liệu nền tảng nguồn cung cấp."
                  : "Quality and size depend on what the source platform exposes."}
              </p>
            </div>
            {/* Always-on preview: YouTube embed, native player, or poster */}
            <VideoPreview
              sourceUrl={currentUrl}
              thumbnail={videoInfo.thumbnail}
              directUrl={videoInfo.directUrl || videoInfo.cobaltUrl}
              title={videoInfo.title}
            />

            {/* Metadata card (yt-dlp). Thumbnail hidden — preview shows it. */}
            {videoInfo.title !== "Video" && (
              <VideoCard
                title={videoInfo.title}
                thumbnail={videoInfo.thumbnail}
                duration={videoInfo.durationString}
                uploader={videoInfo.uploader}
                viewCount={videoInfo.viewCount}
                hideThumbnail
              />
            )}

            {/* Direct download (TikTok, Instagram, Twitter, Facebook via scraper) */}
            {(videoInfo.directUrl || videoInfo.cobaltUrl) && (
              <div className="mx-auto w-full max-w-3xl mt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <a
                    href={buildDirectDownloadUrl(videoInfo.directUrl || videoInfo.cobaltUrl || "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) =>
                      handleDirectVideoDownload(event, videoInfo.directUrl || videoInfo.cobaltUrl || "")
                    }
                    className="btn-hero px-6 text-sm"
                  >
                    <Download className="w-4 h-4" aria-hidden />
                    {locale === "vi" ? "Tải Video" : "Download Video"}
                  </a>
                  {(videoInfo.directAudioUrl || videoInfo.cobaltAudioUrl) && (
                    <a
                      href={buildDirectDownloadUrl(videoInfo.directAudioUrl || videoInfo.cobaltAudioUrl || "", true)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleDownloadStart}
                      className="btn-secondary text-sm"
                    >
                      <Music className="w-4 h-4" aria-hidden />
                      {locale === "vi" ? "Chỉ Âm Thanh" : "Audio Only"}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* yt-dlp format picker (when we have formats) */}
            {videoInfo.formats.length > 0 && (
              <>
                <FormatPicker
                  formats={videoInfo.formats}
                  videoUrl={currentUrl}
                  videoTitle={videoInfo.title}
                  videoId={videoInfo.id}
                  uploader={videoInfo.uploader}
                  platform={detectPlatform(currentUrl)?.id}
                  onDownloadStart={handleDownloadStart}
                />
              </>
            )}

          </section>
        )}

        {/* Playlist result */}
        {videoInfo && videoInfo.isPlaylist && videoInfo.playlistEntries && !loading && (
          <section
            ref={resultRef}
            className="mx-auto w-full max-w-7xl scroll-mt-6 px-4 pb-12 sm:px-6 lg:px-8"
          >
            <div className="mx-auto mb-5 w-full max-w-3xl text-center">
              <p className="section-kicker">
                {locale === "vi" ? "Danh sách phát" : "Playlist"}
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {locale === "vi" ? "Chọn video muốn tải" : "Choose videos to download"}
              </h2>
            </div>
            <PlaylistQueue
              entries={videoInfo.playlistEntries}
              onDownloadStart={handleDownloadStart}
            />
          </section>
        )}

        {/* Download History */}
        <DownloadHistory
          onReopen={(url) => {
            handleFetch(url, false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />

        {/* Platform Grid */}
        <PlatformGrid />

        <Features />

        <TechnologyCredits />

        <FAQ />

        <Footer />
      </main>

      <SettingsPanel />
    </ErrorBoundary>
  );
}
