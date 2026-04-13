"use client";

import { useState, useCallback } from "react";
import Hero from "@/components/Hero";
import VideoCard from "@/components/VideoCard";
import FormatPicker from "@/components/FormatPicker";
import PlaylistQueue from "@/components/PlaylistQueue";
import PlatformGrid from "@/components/PlatformGrid";
import DownloadHistory from "@/components/DownloadHistory";
import { addToHistory } from "@/components/DownloadHistory";
import Features from "@/components/Features";
import StatsCounter from "@/components/StatsCounter";
import Testimonials from "@/components/Testimonials";
import LinkGuide from "@/components/LinkGuide";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import AdUnit from "@/components/AdUnit";
import AuroraBackground from "@/components/AuroraBackground";
import ConfettiBurst from "@/components/ConfettiBurst";
import SettingsPanel from "@/components/SettingsPanel";
import ErrorReport from "@/components/ErrorReport";
import { detectPlatform } from "@/lib/platforms";
import { useI18n } from "@/lib/i18n";
import { AlertCircle, Download, Music } from "lucide-react";

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

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [confetti, setConfetti] = useState(false);
  const { locale } = useI18n();

  const handleFetch = async (url: string, isPlaylist: boolean) => {
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setCurrentUrl(url);

    try {
      const proxy = typeof window !== "undefined" ? localStorage.getItem("vidgrab-proxy") || "" : "";
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, playlist: isPlaylist, proxy: proxy || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
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

  return (
    <>
      <AuroraBackground />
      <ConfettiBurst active={confetti} onDone={handleConfettiDone} />

      <main className="relative z-10 min-h-screen">
        <Hero onFetch={handleFetch} loading={loading} />

        {/* === AD #1: Below Hero === */}
        <AdUnit
          slot="1111111111"
          format="auto"
          className="max-w-4xl mx-auto px-4 my-6"
        />

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto px-4 mb-8">
            <div
              className="glass-card rounded-xl px-4 py-3"
              style={{ borderColor: "var(--danger)", borderWidth: 1 }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--danger)]">{error}</p>
              </div>
              <ErrorReport
                url={currentUrl}
                error={error}
                onRetry={() => currentUrl && handleFetch(currentUrl, false)}
              />
            </div>
          </div>
        )}

        {/* Video result */}
        {videoInfo && !videoInfo.isPlaylist && (
          <section className="px-4 pb-12">
            {/* Show video card only if we have metadata (yt-dlp) */}
            {videoInfo.title !== "Video" && (
              <VideoCard
                title={videoInfo.title}
                thumbnail={videoInfo.thumbnail}
                duration={videoInfo.durationString}
                uploader={videoInfo.uploader}
                viewCount={videoInfo.viewCount}
              />
            )}

            {/* Direct download (TikTok, Instagram, Twitter, Facebook via scraper) */}
            {(videoInfo.directUrl || videoInfo.cobaltUrl) && (
              <div className="max-w-2xl mx-auto mt-6">
                {videoInfo.thumbnail && (
                  <div className="glass-card rounded-2xl overflow-hidden mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={videoInfo.thumbnail} alt="" className="w-full aspect-video object-cover" />
                    {videoInfo.title && videoInfo.title !== "Video" && (
                      <div className="p-4">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{videoInfo.title}</h3>
                        {videoInfo.uploader && (
                          <p className="text-xs text-[var(--text-muted)] mt-1">{videoInfo.uploader}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 justify-center">
                  <a
                    href={videoInfo.directUrl || videoInfo.cobaltUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownloadStart}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg hover:scale-[1.02]"
                    style={{ boxShadow: "0 4px 20px var(--accent-glow)" }}
                  >
                    <Download className="w-4 h-4" />
                    {locale === "vi" ? "Tải Video" : "Download Video"}
                  </a>
                  {(videoInfo.directAudioUrl || videoInfo.cobaltAudioUrl) && (
                    <a
                      href={videoInfo.directAudioUrl || videoInfo.cobaltAudioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleDownloadStart}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-[var(--text-primary)] font-semibold text-sm hover:scale-[1.02] transition-all"
                    >
                      <Music className="w-4 h-4" />
                      {locale === "vi" ? "Chỉ Âm Thanh" : "Audio Only"}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* yt-dlp format picker (when we have formats) */}
            {videoInfo.formats.length > 0 && (
              <>
                <AdUnit
                  slot="2222222222"
                  format="auto"
                  className="max-w-2xl mx-auto my-6"
                />
                <FormatPicker
                  formats={videoInfo.formats}
                  videoUrl={currentUrl}
                  videoTitle={videoInfo.title}
                  onDownloadStart={handleDownloadStart}
                />
              </>
            )}

            <AdUnit
              slot="3333333333"
              format="auto"
              className="max-w-2xl mx-auto mt-8"
            />
          </section>
        )}

        {/* Playlist result */}
        {videoInfo && videoInfo.isPlaylist && videoInfo.playlistEntries && (
          <section className="px-4 pb-12">
            <PlaylistQueue
              entries={videoInfo.playlistEntries}
              onDownloadStart={handleDownloadStart}
            />

            <AdUnit
              slot="3333333333"
              format="auto"
              className="max-w-2xl mx-auto mt-8"
            />
          </section>
        )}

        {/* Download History */}
        <DownloadHistory />

        {/* Platform Grid */}
        <PlatformGrid />

        {/* How to get link guide */}
        <LinkGuide />

        <Features />

        {/* Stats */}
        <StatsCounter />

        {/* === AD #4: Between Stats and Testimonials === */}
        <AdUnit
          slot="4444444444"
          format="auto"
          className="max-w-4xl mx-auto px-4 my-4"
        />

        {/* Testimonials + CTA */}
        <Testimonials />

        <FAQ />

        {/* === AD #5: Above Footer === */}
        <AdUnit
          slot="5555555555"
          format="auto"
          className="max-w-4xl mx-auto px-4 my-8"
        />

        <Footer />
      </main>

      <SettingsPanel />
    </>
  );
}
