"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  History,
  Shield,
  RotateCcw,
  HardDrive,
} from "lucide-react";
import { detectPlatform } from "@/lib/platforms";
import { platformIconMap } from "@/components/icons/PlatformIcons";
import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: string;
  platformIcon: string;
  quality: string;
  timestamp: number;
}

const STORAGE_KEY = "vidgrab-history";
const MAX_ENTRIES = 50;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    return list
      .filter((h) => now - h.timestamp < MAX_AGE_MS)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];

    const recent = list.find(
      (h) => h.url === entry.url && Date.now() - h.timestamp < 5 * 60 * 1000
    );
    if (recent) return;

    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const now = Date.now();
    const validList = list.filter((h) => now - h.timestamp < MAX_AGE_MS);
    const updated = [newEntry, ...validList].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("vidgrab-history-update"));
  } catch {
    // localStorage not available
  }
}

interface DownloadHistoryProps {
  /** Re-run analysis for a past link (core product loop). */
  onReopen?: (url: string) => void;
}

export default function DownloadHistory({ onReopen }: DownloadHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { t } = useI18n();

  useEffect(() => {
    setHistory(readHistory());
    setReady(true);
    const handler = () => setHistory(readHistory());
    window.addEventListener("vidgrab-history-update", handler);
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.removeEventListener("vidgrab-history-update", handler);
      window.clearInterval(tick);
    };
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  const getTimeAgo = (timestamp: number): string => {
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.timeJustNow;
    if (mins < 60) return `${mins}${t.timeMinAgo}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t.timeHourAgo}`;
    const days = Math.floor(hours / 24);
    return `${days}${t.timeDayAgo}`;
  };

  // Avoid SSR/client mismatch flash
  if (!ready) return null;

  // ── Empty state: keep the promise visible (local history) ──
  if (history.length === 0) {
    return (
      <section className="relative z-10 py-8 sm:py-10" aria-labelledby="history-empty-title">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="glass-card rounded-2xl px-5 py-6 text-center sm:px-8 sm:py-7">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-light)]">
                <History className="h-5 w-5" aria-hidden />
              </span>
              <h3
                id="history-empty-title"
                className="text-base font-semibold tracking-tight sm:text-lg"
              >
                {t.historyEmptyTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                {t.historyEmptyDesc}
              </p>
              <p className="mt-3 text-xs font-medium text-[var(--accent-light)]">
                {t.historyEmptyHint}
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--section-bg)] px-3 py-1.5 text-[11px] text-[var(--text-muted)]">
                <Shield className="h-3 w-3 text-[var(--success)]" aria-hidden />
                {t.historyPrivacyNote}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const displayed = expanded ? history : history.slice(0, 3);

  return (
    <section className="relative z-10 py-8 sm:py-10" aria-labelledby="history-title">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h3
                id="history-title"
                className="flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
                  <Clock className="h-4 w-4 text-[var(--accent-light)]" aria-hidden />
                </span>
                {t.historyTitle}
                <span className="ml-0.5 rounded-full bg-[var(--section-bg)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--text-muted)]">
                  {history.length}
                </span>
              </h3>
              <p className="mt-1 flex items-center gap-1.5 pl-10 text-[11px] text-[var(--text-muted)]">
                <HardDrive className="h-3 w-3" aria-hidden />
                {t.historyPrivacyNote}
              </p>
            </div>
            <button
              type="button"
              onClick={clearHistory}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-[var(--danger)]"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              {t.historyClear}
            </button>
          </div>

          <div className="space-y-2">
            {displayed.map((entry) => {
              const platform = detectPlatform(entry.url);
              const PIcon = platform
                ? platformIconMap[platform.id] || Globe
                : Globe;
              const timeAgo = getTimeAgo(entry.timestamp);

              return (
                <div
                  key={entry.id}
                  className="glass-card flex items-center gap-2.5 rounded-xl px-3 py-2.5 sm:gap-3"
                >
                  <div className="h-9 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)] ring-1 ring-[var(--border)] sm:h-10 sm:w-16">
                    {entry.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                        <History className="h-4 w-4" aria-hidden />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium sm:text-sm">
                      {entry.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-muted)] sm:text-xs">
                      {platform && (
                        <span className="inline-flex items-center gap-1">
                          <PIcon size={12} style={{ color: platform.color }} aria-hidden />
                          <span className="hidden sm:inline">{platform.name}</span>
                        </span>
                      )}
                      <span aria-hidden>·</span>
                      <span>{entry.quality}</span>
                      <span aria-hidden>·</span>
                      <span>{timeAgo}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {onReopen && (
                      <button
                        type="button"
                        onClick={() => onReopen(entry.url)}
                        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[var(--accent-light)] transition-colors hover:bg-[var(--accent-soft)]"
                        aria-label={t.historyReanalyze}
                        title={t.historyReanalyze}
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--accent-light)]"
                      aria-label={t.historyOpenSource}
                      title={t.historyOpenSource}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {history.length > 3 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mx-auto mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs text-[var(--accent-light)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                  {t.historyShowLess}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  {history.length - 3} {t.historyShowMore}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
