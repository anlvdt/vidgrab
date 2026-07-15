"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, X, Send, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ErrorReportProps {
  url: string;
  error: string;
  onRetry: () => void;
}

export default function ErrorReport({ url, error, onRetry }: ErrorReportProps) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          error,
          description: desc,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });
      if (res.ok) {
        setSent(true);
        window.setTimeout(() => {
          setOpen(false);
          setSent(false);
          setDesc("");
        }, 2000);
      }
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button type="button" onClick={onRetry} className="btn-secondary min-h-10 px-3.5 text-xs">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        {t.errorRetry}
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="chip-toggle min-h-10 text-xs hover:border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] hover:text-[var(--danger)]"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {t.errorReportBtn}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div
            className="settings-dialog glass-card relative w-full max-w-sm rounded-2xl p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="error-report-title"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]">
                  <Flag className="h-4 w-4" aria-hidden />
                </span>
                <h3 id="error-report-title" className="text-sm font-semibold tracking-tight">
                  {t.errorReportTitle}
                </h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {sent ? (
              <div
                className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--success)]"
                role="status"
              >
                <CheckCircle className="h-4 w-4" aria-hidden />
                {t.errorReportSuccess}
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                    {t.errorReportUrl}
                  </label>
                  <div className="truncate rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-xs text-[var(--text-secondary)]">
                    {url}
                  </div>
                </div>

                <div className="mb-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-2.5 text-xs leading-relaxed text-[var(--danger)]">
                  {error}
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="error-report-desc"
                    className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]"
                  >
                    {t.errorReportDesc}
                  </label>
                  <textarea
                    id="error-report-desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={t.errorReportDescPlaceholder}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="btn-hero w-full text-sm"
                >
                  {sending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {sending ? t.errorReportSending : t.errorReportSend}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
