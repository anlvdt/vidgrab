"use client";

import { useState } from "react";
import { Download, Check, Clock, ListVideo } from "lucide-react";
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
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(entries.map((e) => e.id))
  );
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
        }, i * 2500);
      });
  };

  const allSelected = selected.size === entries.length && entries.length > 0;

  return (
    <div className="mx-auto mt-6 w-full max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-light)]">
            <ListVideo className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight sm:text-lg">
              {t.playlistTitle}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {selected.size}/{entries.length} {t.playlistVideos}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected}
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 font-medium text-[var(--accent-light)] transition-colors hover:bg-[var(--accent-soft)] disabled:opacity-40"
          >
            {t.selectAll}
          </button>
          <span className="text-[var(--border)]" aria-hidden>
            |
          </span>
          <button
            type="button"
            onClick={selectNone}
            disabled={selected.size === 0}
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 font-medium text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-[var(--danger)] disabled:opacity-40"
          >
            {t.deselectAll}
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--section-bg)] p-2 sm:max-h-[400px] sm:p-2.5">
        {entries.map((entry) => {
          const isSelected = selected.has(entry.id);
          return (
            <div
              key={entry.id}
              onClick={() => toggleSelect(entry.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleSelect(entry.id);
                }
              }}
              role="checkbox"
              tabIndex={0}
              aria-checked={isSelected}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-2.5 transition-all sm:gap-3 sm:px-3 ${
                isSelected
                  ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[var(--bg-card-solid)] shadow-[0_1px_2px_var(--glass-shadow)]"
                  : "border-transparent bg-transparent opacity-55 hover:opacity-80"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-[var(--text-muted)]"
                }`}
                aria-hidden
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>

              <div className="h-9 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)] ring-1 ring-[var(--border)] sm:h-10 sm:w-16">
                {entry.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium sm:text-sm">{entry.title}</p>
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <Clock className="h-3 w-3" aria-hidden />
                  {entry.durationString || "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleBatchDownload}
        disabled={selected.size === 0}
        className="btn-hero mx-auto mt-6 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Download className="h-4 w-4" aria-hidden />
        {t.downloadCount} {selected.size}{" "}
        {selected.size !== 1 ? t.videoPlural : t.video}
      </button>
    </div>
  );
}
