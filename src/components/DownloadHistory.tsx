"use client";

import { useState, useEffect } from "react";
import { Clock, Trash2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
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

    const updated = [newEntry, ...list].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("vidgrab-history-update"));
  } catch {
    // localStorage not available
  }
}

export default function DownloadHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
    const handler = () => loadHistory();
    window.addEventListener("vidgrab-history-update", handler);
    return () => window.removeEventListener("vidgrab-history-update", handler);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  if (history.length === 0) return null;

  const displayed = expanded ? history : history.slice(0, 3);

  const getTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.timeJustNow;
    if (mins < 60) return `${mins}${t.timeMinAgo}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t.timeHourAgo}`;
    const days = Math.floor(hours / 24);
    return `${days}${t.timeDayAgo}`;
  };

  return (
    <section className="py-8 px-4 relative z-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--accent-light)]" />
            {t.historyTitle}
          </h3>
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            {t.historyClear}
          </button>
        </div>

        <div className="space-y-2">
          {displayed.map((entry) => {
            const platform = detectPlatform(entry.url);
            const PIcon = platform ? platformIconMap[platform.id] || Globe : Globe;
            const timeAgo = getTimeAgo(entry.timestamp);

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 glass-card rounded-xl px-3 py-2.5"
              >
                <div className="w-12 h-8 sm:w-14 sm:h-9 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-secondary)]">
                  {entry.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.thumbnail} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{entry.title}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    {platform && (
                      <span className="flex items-center gap-1">
                        <PIcon size={12} style={{ color: platform.color }} />
                        <span className="hidden sm:inline">{platform.name}</span>
                      </span>
                    )}
                    <span>·</span>
                    <span>{entry.quality}</span>
                    <span>·</span>
                    <span>{timeAgo}</span>
                  </div>
                </div>

                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-light)] transition-colors"
                  aria-label="Open original URL"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>

        {history.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 mx-auto mt-3 text-xs text-[var(--accent-light)] hover:text-[var(--accent)] transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                {t.historyShowLess}
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                {history.length - 3} {t.historyShowMore}
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
