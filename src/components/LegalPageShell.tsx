"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import AuroraBackground from "@/components/AuroraBackground";
import ThemeToggle from "@/components/ThemeToggle";
import LangToggle from "@/components/LangToggle";
import { Zap } from "lucide-react";

interface LegalPageShellProps {
  icon: LucideIcon;
  title: string;
  kicker?: string;
  children: ReactNode;
}

export default function LegalPageShell({
  icon: Icon,
  title,
  kicker,
  children,
}: LegalPageShellProps) {
  const { locale, t } = useI18n();
  const vi = locale === "vi";

  const links = [
    { href: "/privacy", label: t.footerPrivacy },
    { href: "/terms", label: t.footerTerms },
    { href: "/transparency", label: t.footerTransparency },
  ];

  return (
    <>
      <AuroraBackground />
      <main className="relative z-10 min-h-screen pb-12">
        <div className="nav-chrome mb-8 sm:mb-10">
          <div className="mx-auto flex min-h-12 w-full max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2.5 rounded-xl pr-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-hover)] to-[var(--accent)] shadow-[0_8px_24px_var(--accent-glow)] ring-1 ring-white/10">
                <Zap className="h-4 w-4 text-white" aria-hidden />
              </span>
              <span className="text-lg font-bold tracking-tight">
                Vid<span className="gradient-text">Grab</span>
              </span>
            </Link>
            <div className="flex min-h-11 items-center gap-2">
              <LangToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <Link
              href="/"
              className="mb-6 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-[var(--accent-light)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {vi ? "Về trang chủ" : "Back to home"}
            </Link>

            <header className="mb-6">
              {kicker ? <p className="section-kicker">{kicker}</p> : null}
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-light)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {vi
                      ? "Thông tin rõ ràng về cách VidGrab hoạt động."
                      : "Clear information about how VidGrab works."}
                  </p>
                </div>
              </div>
            </header>

            <article className="legal-prose glass-card space-y-6 rounded-2xl p-5 text-sm leading-relaxed text-[var(--text-secondary)] sm:space-y-7 sm:p-8">
              {children}
            </article>

            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-1 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-muted)]"
              aria-label={vi ? "Trang pháp lý" : "Legal pages"}
            >
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-9 items-center rounded-lg px-2.5 transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--text-primary)]"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/"
                className="inline-flex min-h-9 items-center rounded-lg px-2.5 transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--text-primary)]"
              >
                {vi ? "Trang chủ" : "Home"}
              </Link>
            </nav>
          </div>
        </div>
      </main>
    </>
  );
}
