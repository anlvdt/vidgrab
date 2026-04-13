"use client";

import { useState, useRef } from "react";
import { Search, Zap, List, Loader2, Clipboard } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";
import TypingHeadline from "./TypingHeadline";
import PlatformBadge from "./PlatformBadge";
import { TOTAL_SUPPORTED_SITES } from "@/lib/platforms";
import { useI18n } from "@/lib/i18n";

interface HeroProps {
  onFetch: (url: string, isPlaylist: boolean) => void;
  loading: boolean;
}

export default function Hero({ onFetch, loading }: HeroProps) {
  const [url, setUrl] = useState("");
  const [playlistMode, setPlaylistMode] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const handleFocus = () => {
    if (!url.trim()) setPasteHint(true);
  };
  const handleBlur = () => setPasteHint(false);

  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && /^https?:\/\/.+/i.test(text.trim())) {
        setUrl(text.trim());
        setPasteHint(false);
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard permission denied
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onFetch(url.trim(), playlistMode);
    }
  };

  return (
    <section className="relative pt-6 pb-16 px-4">
      {/* Top bar */}
      <nav className="max-w-4xl mx-auto flex items-center justify-between mb-14">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Vid<span className="gradient-text">Grab</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </nav>

      <div className="relative max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight tracking-tight">
          {t.heroTitle} <TypingHeadline />
        </h1>
        <p className="text-[var(--text-secondary)] text-lg mb-4 max-w-xl mx-auto leading-relaxed">
          {t.heroSubtitle}{" "}
          <span className="text-[var(--accent-light)] font-medium">
            {TOTAL_SUPPORTED_SITES.toLocaleString()}+ {t.heroOtherSites}
          </span>
          .
        </p>

        {url.trim() && (
          <div className="mb-4 flex justify-center">
            <PlatformBadge url={url} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          <div
            className={`glow-input glass flex items-center gap-3 rounded-2xl px-5 py-4 ${
              url.trim() ? "pulse-glow" : ""
            }`}
          >
            <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={t.heroPlaceholder}
              className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-base"
              aria-label="Video URL input"
            />

            {!url.trim() && (
              <button
                type="button"
                onClick={handleSmartPaste}
                className="shrink-0 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-light)] hover:bg-[var(--glass-bg)] transition-all"
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="shrink-0 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              style={{
                boxShadow: url.trim()
                  ? "0 4px 20px var(--accent-glow)"
                  : "none",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.heroFetching}
                </>
              ) : (
                t.heroFetch
              )}
            </button>
          </div>

          {pasteHint && !url.trim() && (
            <p className="text-xs text-[var(--text-muted)] mt-2 animate-pulse">
              {t.heroPasteHint}
            </p>
          )}

          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => setPlaylistMode(!playlistMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                playlistMode
                  ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-lg"
                  : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <List className="w-4 h-4" />
              {t.heroPlaylist}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
          {[
            { step: "1", title: t.heroStep1Title, desc: t.heroStep1Desc },
            { step: "2", title: t.heroStep2Title, desc: t.heroStep2Desc },
            { step: "3", title: t.heroStep3Title, desc: t.heroStep3Desc },
          ].map((item) => (
            <div key={item.step} className="text-center group">
              <div className="w-11 h-11 rounded-full glass flex items-center justify-center mx-auto mb-3 text-[var(--accent-light)] font-bold text-sm group-hover:scale-110 transition-transform">
                {item.step}
              </div>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-[var(--text-secondary)] text-xs">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
