"use client";

import { Zap, Heart, Shield } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative z-10 border-t border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-secondary)_55%,transparent)] pb-8 pt-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card-solid)]/70 p-4 shadow-[0_1px_2px_var(--glass-shadow)] sm:p-5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]">
              <Shield
                className="h-3.5 w-3.5 text-[var(--warning)]"
                aria-hidden
              />
            </span>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
              {t.footerDisclaimer}
            </p>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-hover)] to-[var(--accent)] ring-1 ring-white/10">
                <Zap className="h-3.5 w-3.5 text-white" aria-hidden />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Vid<span className="gradient-text">Grab</span>
              </span>
            </div>

            <nav
              className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs text-[var(--text-muted)]"
              aria-label="Legal"
            >
              {[
                { href: "/terms", label: t.footerTerms },
                { href: "/privacy", label: t.footerPrivacy },
                { href: "/transparency", label: t.footerTransparency },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-9 items-center rounded-lg px-2.5 whitespace-nowrap transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--text-primary)]"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="https://github.com/anlvdt/vidgrab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center rounded-lg px-2.5 whitespace-nowrap transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--text-primary)]"
              >
                {t.footerSource}
              </a>
            </nav>

            <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              {t.footerMadeWith}{" "}
              <Heart
                className="h-3 w-3 fill-[var(--accent-secondary)] text-[var(--accent-secondary)]"
                aria-hidden
              />{" "}
              — {t.footerPoweredBy}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
