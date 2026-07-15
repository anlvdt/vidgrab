"use client";

import { useState, useRef } from "react";
import {
  Search,
  List,
  Loader2,
  Clipboard,
  ClipboardCheck,
  ShieldCheck,
  History,
  FileCheck2,
  ChevronRight,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";
import PlatformBadge from "./PlatformBadge";
import BrandMark from "./BrandMark";
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
  const [pasted, setPasted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && /^https?:\/\/.+/i.test(text.trim())) {
        setUrl(text.trim());
        setInvalidUrl(false);
        setPasted(true);
        inputRef.current?.focus();
        window.setTimeout(() => setPasted(false), 1600);
      }
    } catch {
      // Clipboard permission denied — user can still type/paste manually
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
    <section className="relative pb-8 sm:pb-10">
      <div className="nav-chrome mb-6 sm:mb-8">
        <nav
          className="mx-auto flex min-h-12 w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8"
          aria-label="Primary"
        >
          <div className="flex min-h-11 items-center gap-2.5">
            <BrandMark className="h-9 w-9 shrink-0 rounded-[0.65rem] shadow-[0_8px_24px_var(--accent-glow)]" />
            <span className="text-xl font-bold tracking-tight">
              Vid<span className="gradient-text">Grab</span>
            </span>
          </div>
          <div className="flex min-h-11 items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto w-full max-w-3xl text-center">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--bg-card-solid)]/90 px-3.5 py-1.5 text-xs font-medium text-[var(--accent-light)] shadow-[0_1px_2px_var(--glass-shadow),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{t.heroOtherSites}</span>
          </div>

          <h1 className="mx-auto mb-3 max-w-[18em] text-balance text-[1.75rem] font-bold leading-[1.12] tracking-[-0.035em] sm:max-w-none sm:text-3xl lg:text-[2.5rem]">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mb-6 max-w-md text-pretty text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[0.95rem]">
            {t.heroSubtitle}
          </p>

          {url.trim() && (
            <div className="mb-4 flex justify-center">
              <PlatformBadge url={url} />
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="relative mx-auto w-full max-w-3xl"
            aria-busy={loading}
          >
            <div
              className={`download-shell flex flex-col items-stretch gap-2 p-2 sm:flex-row sm:items-center sm:pl-4 ${
                invalidUrl ? "is-invalid" : ""
              } ${pasted && !invalidUrl ? "is-pasted" : ""}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 sm:gap-3 sm:px-0">
                <Search
                  className="h-5 w-5 shrink-0 text-[var(--accent-light)]"
                  aria-hidden
                />
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
                    if (pasted) setPasted(false);
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
                  className={`paste-btn inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                    pasted
                      ? "is-success"
                      : "text-[var(--text-secondary)] hover:bg-[var(--section-bg)] hover:text-[var(--text-primary)]"
                  }`}
                  aria-label={t.pasteButton}
                >
                  {pasted ? (
                    <ClipboardCheck className="paste-icon h-4 w-4" aria-hidden />
                  ) : (
                    <Clipboard className="paste-icon h-4 w-4" aria-hidden />
                  )}
                  <span className="hidden md:inline">
                    {pasted ? t.pasteSuccess : t.pasteButton}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !url.trim()}
                aria-describedby="url-help"
                className="btn-hero shrink-0 sm:min-w-[9.5rem]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t.heroFetching}
                  </>
                ) : (
                  t.heroFetch
                )}
              </button>
            </div>

            <p
              id="url-help"
              className={`mt-2.5 text-left text-xs sm:text-center ${
                invalidUrl
                  ? "font-medium text-[var(--danger)]"
                  : pasted
                    ? "paste-feedback"
                    : "text-[var(--text-muted)]"
              }`}
              role={invalidUrl ? "alert" : pasted ? "status" : undefined}
            >
              {invalidUrl
                ? t.heroInvalidUrl
                : pasted
                  ? t.pasteSuccessHint
                  : t.heroPasteHint}
            </p>

            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setPlaylistMode(!playlistMode)}
                aria-pressed={playlistMode}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                  playlistMode
                    ? "bg-[var(--accent-soft)] text-[var(--accent-light)] ring-1 ring-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--section-bg)] hover:text-[var(--text-primary)]"
                }`}
              >
                <List className="h-4 w-4" aria-hidden />
                {t.heroPlaylist}
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    playlistMode ? "rotate-90" : ""
                  }`}
                  aria-hidden
                />
              </button>
            </div>
          </form>

          <ul className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            {[
              { icon: ShieldCheck, label: t.heroTrustPrivate },
              { icon: History, label: t.heroTrustHistory },
              { icon: FileCheck2, label: t.heroTrustFilename },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="trust-chip">
                <Icon className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
