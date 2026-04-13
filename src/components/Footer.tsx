"use client";

import { Zap, Heart, ExternalLink, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative z-10 border-t border-[var(--glass-border)] pt-8 pb-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Disclaimer */}
        <div className="glass-card rounded-xl p-4 mb-6 flex items-start gap-3">
          <Shield className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {t.footerDisclaimer}
          </p>
        </div>

        {/* Footer content */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">VidGrab</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <a href="/terms" className="hover:text-[var(--text-secondary)] transition-colors min-h-0">
              {t.footerTerms}
            </a>
            <a href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors min-h-0">
              {t.footerPrivacy}
            </a>
          </div>

          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
            {t.footerMadeWith} <Heart className="w-3 h-3 text-[var(--accent-secondary)]" /> — {t.footerPoweredBy}
          </p>
        </div>
      </div>
    </footer>
  );
}
