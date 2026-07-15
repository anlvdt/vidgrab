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
  ChevronRight,
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
    <section className="relative px-3 pb-10 pt-4 sm:px-6 sm:pb-14">
      {/* Top bar */}
      <nav className="mx-auto mb-12 flex max-w-6xl items-center justify-between sm:mb-16">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[0_8px_24px_var(--accent-glow)]">
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

      <div className="relative mx-auto max-w-6xl text-center">
        <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--bg-card-solid)] px-3 py-1.5 text-xs font-medium text-[var(--accent-light)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t.heroOtherSites}
        </div>
        <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.5rem]">
          {t.heroTitle}
        </h1>
        <p className="mx-auto mb-7 max-w-xl text-balance text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          {t.heroSubtitle}
        </p>

        {url.trim() && (
          <div className="mb-4 flex justify-center">
            <PlatformBadge url={url} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="relative mx-auto max-w-5xl" aria-busy={loading}>
          <div
            className="download-shell flex flex-col items-stretch gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:pl-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 sm:px-0">
              <Search className="h-5 w-5 shrink-0 text-[var(--accent-light)]" />
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
                className="min-w-0 flex-1 bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                aria-label={t.heroPlaceholder}
                aria-invalid={invalidUrl}
                aria-describedby="url-help"
              />
              <button
                type="button"
                onClick={handleSmartPaste}
                className="compact-control inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]"
                aria-label={t.pasteButton}
              >
                <Clipboard className="w-4 h-4" />
                <span className="hidden md:inline">{t.pasteButton}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_var(--accent-glow)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--button-disabled)] disabled:text-[var(--text-muted)] disabled:shadow-none"
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

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPlaylistMode(!playlistMode)}
              className={`compact-control flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                playlistMode
                  ? "bg-[var(--accent-soft)] text-[var(--accent-light)] ring-1 ring-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]"
              }`}
            >
              <List className="w-4 h-4" />
              {t.heroPlaylist}
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${playlistMode ? "rotate-90" : ""}`} />
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--text-secondary)]">
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

      </div>
    </section>
  );
}
