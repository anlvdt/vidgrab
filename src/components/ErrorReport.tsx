"use client";

import { useState } from "react";
import { Flag, X, Send, CheckCircle, RefreshCw } from "lucide-react";
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
  const { t } = useI18n();

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
        setTimeout(() => { setOpen(false); setSent(false); setDesc(""); }, 2000);
      }
    } catch {
      // silent fail
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
      {/* Retry button */}
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-medium text-[var(--accent-light)] hover:text-[var(--accent)] transition-colors min-h-0"
      >
        <RefreshCw className="w-3 h-3" />
        {t.errorRetry}
      </button>

      {/* Report button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-medium text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors min-h-0"
      >
        <Flag className="w-3 h-3" />
        {t.errorReportBtn}
      </button>

      {/* Report modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Flag className="w-4 h-4 text-[var(--danger)]" />
                {t.errorReportTitle}
              </h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--glass-bg)] min-h-0 min-w-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sent ? (
              <div className="flex items-center gap-2 text-[var(--success)] text-sm py-4 justify-center">
                <CheckCircle className="w-4 h-4" />
                {t.errorReportSuccess}
              </div>
            ) : (
              <>
                {/* URL */}
                <div className="mb-3">
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">{t.errorReportUrl}</label>
                  <div className="bg-[var(--bg-secondary)] rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] truncate">
                    {url}
                  </div>
                </div>

                {/* Error */}
                <div className="mb-3">
                  <div className="bg-[var(--danger)]/10 rounded-lg px-3 py-2 text-xs text-[var(--danger)]">
                    {error}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">{t.errorReportDesc}</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={t.errorReportDescPlaceholder}
                    rows={3}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
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
