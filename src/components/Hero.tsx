"use client";

import { useState, useRef } from "react";
import {
  Search,
  Zap,
  List,
  Loader2,
  Clipboard,
  ShieldCheck,
  History,
  FileCheck2,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";
import PlatformBadge from "./PlatformBadge";
import { useI18n } from "@/lib/i18n";
import { sanitizeUrl } from "@/lib/url-sanitizer";

interface HeroProps {
  onFetch: (url: string, isPlaylist: boolean) => void;
  loading: boolean;
}

export default function Hero({ onFetch, loading }: HeroProps) {
  const [url, setUrl] = useState("");
  const [playlistMode, setPlaylistMode] = useState(false);
  const [invalidUrl, setInvalidUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && /^https?:\/\/.+/i.test(text.trim())) {
        setUrl(text.trim());
        setInvalidUrl(false);
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard permission denied
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!/^https?:\/\/[^\s]+$/i.test(value)) {
      setInvalidUrl(true);
      inputRef.current?.focus();
      return;
    }
    const cleanedUrl = sanitizeUrl(value);
    setInvalidUrl(false);
    setUrl(cleanedUrl);
    onFetch(cleanedUrl, playlistMode);
  };

  return (
    <section className="relative pt-5 pb-12 sm:pb-16 px-4">
      {/* Top bar */}
      <nav className="max-w-5xl mx-auto flex items-center justify-between mb-10 sm:mb-16">
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

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full glass text-xs font-medium text-[var(--accent-light)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t.heroOtherSites}
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-[1.08] tracking-[-0.035em] text-balance">
          {t.heroTitle}
        </h1>
        <p className="text-[var(--text-secondary)] text-base sm:text-lg mb-7 max-w-2xl mx-auto leading-relaxed text-balance">
          {t.heroSubtitle}
        </p>

        {url.trim() && (
          <div className="mb-4 flex justify-center">
            <PlatformBadge url={url} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="relative max-w-3xl mx-auto" aria-busy={loading}>
          <div
            className={`glow-input glass flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-2xl p-2.5 sm:pl-5 ${
              url.trim() ? "pulse-glow" : ""
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 sm:px-0">
              <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
              <input
                ref={inputRef}
                type="url"
                inputMode="url"
                enterKeyHint="go"
                autoComplete="off"
                spellCheck={false}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (invalidUrl) setInvalidUrl(false);
                }}
                placeholder={t.heroPlaceholder}
                className="min-w-0 flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-base"
                aria-label={t.heroPlaceholder}
                aria-invalid={invalidUrl}
                aria-describedby="url-help"
              />
              <button
                type="button"
                onClick={handleSmartPaste}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:bg-[var(--glass-bg)] transition-all"
                aria-label={t.pasteButton}
              >
                <Clipboard className="w-4 h-4" />
                <span className="hidden md:inline">{t.pasteButton}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="shrink-0 min-h-12 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
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

          <p
            id="url-help"
            className={`text-xs mt-2.5 ${invalidUrl ? "text-[var(--danger)]" : "text-[var(--text-muted)]"}`}
            role={invalidUrl ? "alert" : undefined}
          >
            {invalidUrl ? t.heroInvalidUrl : t.heroPasteHint}
          </p>

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

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-xs text-[var(--text-secondary)]">
          {[
            { icon: ShieldCheck, label: t.heroTrustPrivate },
            { icon: History, label: t.heroTrustHistory },
            { icon: FileCheck2, label: t.heroTrustFilename },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-[var(--success)]" />
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 max-w-3xl mx-auto">
          {[
            { step: "1", title: t.heroStep1Title, desc: t.heroStep1Desc },
            { step: "2", title: t.heroStep2Title, desc: t.heroStep2Desc },
            { step: "3", title: t.heroStep3Title, desc: t.heroStep3Desc },
          ].map((item) => (
            <div key={item.step} className="text-left glass-card rounded-2xl p-4 group">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center mb-3 text-[var(--accent-light)] font-bold text-xs">
                {item.step}
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{item.title}</h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
