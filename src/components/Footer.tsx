"use client";

import { Zap, Heart, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative z-10 border-t border-[var(--glass-border)] py-6 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm">VidGrab</span>
        </div>

        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
          {t.footerMadeWith} <Heart className="w-3 h-3 text-[var(--accent-secondary)]" /> — {t.footerPoweredBy}
        </p>

        <a
          href="https://github.com/yt-dlp/yt-dlp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="yt-dlp on GitHub"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </footer>
  );
}
