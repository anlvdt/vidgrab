"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import {
  Clock,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  History,
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
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const HISTORY_EVENT = "vidgrab-history-update";

function parseHistory(raw: string | null): HistoryEntry[] {
  try {
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    return list
      .filter((h) => now - h.timestamp < MAX_AGE_MS)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function getHistorySnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerHistorySnapshot(): string {
  return "[]";
}

function subscribeHistory(onStoreChange: () => void): () => void {
  window.addEventListener(HISTORY_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(HISTORY_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">) {
  try {
    const list = parseHistory(localStorage.getItem(STORAGE_KEY));

    const recent = list.find(
      (h) => h.url === entry.url && Date.now() - h.timestamp < 5 * 60 * 1000
    );
    if (recent) return;

    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const updated = [newEntry, ...list].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(HISTORY_EVENT));
  } catch {
    // localStorage not available
  }
}

interface DownloadHistoryProps {
  onReopen?: (url: string) => void;
}

export default function DownloadHistory({ onReopen }: DownloadHistoryProps) {
  const raw = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getServerHistorySnapshot
  );
  const history = useMemo(() => parseHistory(raw), [raw]);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { t } = useI18n();

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(HISTORY_EVENT));
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

  // Hide when empty — trust chips already explain local history
  if (history.length === 0) return null;

  const displayed = expanded ? history : history.slice(0, 3);

  return (
    <section className="relative z-10 py-6" aria-labelledby="history-title">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3
              id="history-title"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight sm:text-base"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
                <Clock className="h-3.5 w-3.5 text-[var(--accent-light)]" aria-hidden />
              </span>
              {t.historyTitle}
              <span className="rounded-full bg-[var(--section-bg)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--text-muted)]">
                {history.length}
              </span>
            </h3>
            <button
              type="button"
              onClick={clearHistory}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-[var(--danger)]"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              {t.historyClear}
            </button>
          </div>

          <div className="space-y-1.5">
            {displayed.map((entry) => {
              const platform = detectPlatform(entry.url);
              const PIcon = platform
                ? platformIconMap[platform.id] || Globe
                : Globe;
              const timeAgo = getTimeAgo(entry.timestamp);

              return (
                <div
                  key={entry.id}
                  className="glass-card flex items-center gap-2.5 rounded-xl px-2.5 py-2 sm:gap-3 sm:px-3"
                >
                  <div className="h-8 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)] ring-1 ring-[var(--border)] sm:h-9 sm:w-14">
                    {entry.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                        <History className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium sm:text-sm">
                      {entry.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--text-muted)]">
                      {platform && (
                        <span className="inline-flex items-center gap-1">
                          <PIcon size={11} style={{ color: platform.color }} aria-hidden />
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
                        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-[var(--accent-light)] transition-colors hover:bg-[var(--accent-soft)]"
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
                      className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--accent-light)]"
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
              className="mx-auto mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs text-[var(--accent-light)] transition-colors hover:bg-[var(--accent-soft)]"
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

          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
            <HardDrive className="h-3 w-3" aria-hidden />
            {t.historyPrivacyNote}
          </p>
        </div>
      </div>
    </section>
  );
}
