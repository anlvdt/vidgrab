"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Top questions only — keeps home short; full answers still expandable */
const TOP_COUNT = 4;

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const { t, locale } = useI18n();

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
    { q: t.faq6Q, a: t.faq6A },
    { q: t.faq7Q, a: t.faq7A },
  ].slice(0, TOP_COUNT);

  return (
    <section className="relative z-10 py-6 sm:py-7">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-3 text-center">
            <p className="section-kicker mb-2">FAQ</p>
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">
              {t.faqTitle}
            </h2>
          </div>

          <div className="space-y-1.5">
            {faqs.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={i}
                  className={`glass-card overflow-hidden rounded-xl ${
                    isOpen
                      ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--glass-border))]"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--section-bg)] sm:px-4 sm:py-3"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                  >
                    <span className="pr-2 text-xs font-medium sm:text-sm">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[var(--accent-light)]" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    hidden={!isOpen}
                  >
                    <div className="border-t border-[var(--border)] px-3.5 pb-3 pt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:px-4 sm:text-sm">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11px] text-[var(--text-muted)]">
            {locale === "vi"
              ? "Còn câu hỏi? Mở issue trên GitHub."
              : "More questions? Open a GitHub issue."}
          </p>
        </div>
      </div>
    </section>
  );
}
