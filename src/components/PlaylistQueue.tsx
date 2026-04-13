"use client";

import { useState } from "react";
import { Download, Check, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface PlaylistEntry {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  url: string;
}

interface PlaylistQueueProps {
  entries: PlaylistEntry[];
  onDownloadStart?: () => void;
}

export default function PlaylistQueue({ entries, onDownloadStart }: PlaylistQueueProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(entries.map((e) => e.id)));
  const { t } = useI18n();

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(entries.map((e) => e.id)));
  const selectNone = () => setSelected(new Set());

  const handleBatchDownload = () => {
    onDownloadStart?.();
    entries
      .filter((e) => selected.has(e.id))
      .forEach((entry, i) => {
        setTimeout(() => {
          const params = new URLSearchParams({ url: entry.url, title: entry.title });
          window.open(`/api/download?${params.toString()}`, "_blank");
        }, i * 1500);
      });
  };

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base sm:text-lg">
          {t.playlistTitle} — {entries.length} {t.playlistVideos}
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={selectAll} className="text-[var(--accent-light)] hover:text-[var(--accent)]">
            {t.selectAll}
          </button>
          <span className="text-[var(--text-muted)]">|</span>
          <button onClick={selectNone} className="text-[var(--text-secondary)] hover:text-[var(--danger)]">
            {t.deselectAll}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[60vh] sm:max-h-[400px] overflow-y-auto pr-1">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            onClick={() => toggleSelect(entry.id)}
            className={`flex items-center gap-2 sm:gap-3 glass-card rounded-xl px-2.5 sm:px-3 py-2.5 cursor-pointer transition-all ${
              selected.has(entry.id) ? "" : "opacity-50"
            }`}
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                selected.has(entry.id)
                  ? "bg-[var(--accent)] border-[var(--accent)]"
                  : "border-[var(--text-muted)]"
              }`}
            >
              {selected.has(entry.id) && <Check className="w-3 h-3 text-white" />}
            </div>

            <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-secondary)]">
              {entry.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.thumbnail} alt="" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">{entry.title}</p>
              <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Clock className="w-3 h-3" />
                {entry.durationString}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleBatchDownload}
        disabled={selected.size === 0}
        className="flex items-center gap-2 mx-auto mt-6 px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
        style={{ boxShadow: "0 4px 20px var(--accent-glow)" }}
      >
        <Download className="w-4 h-4" />
        {t.downloadCount} {selected.size} {selected.size !== 1 ? t.videoPlural : t.video}
      </button>
    </div>
  );
}
