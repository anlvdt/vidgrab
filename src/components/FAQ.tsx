"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const { t, locale } = useI18n();

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
    { q: t.faq6Q, a: t.faq6A },
    { q: t.faq7Q, a: t.faq7A },
  ];

  return (
    <section className="relative z-10 py-[var(--space-8)] sm:py-[var(--space-10)]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8 text-center sm:mb-10">
            <p className="section-kicker">FAQ</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t.faqTitle}
            </h2>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={i}
                  className={`glass-card overflow-hidden rounded-xl transition-[border-color,box-shadow] ${
                    isOpen
                      ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--glass-border))] shadow-[0_8px_28px_color-mix(in_srgb,var(--glass-shadow)_65%,transparent)]"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--section-bg)] sm:px-5 sm:py-4"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                  >
                    <span
                      className={`pr-2 text-xs font-medium sm:text-sm ${
                        isOpen ? "text-[var(--text-primary)]" : ""
                      }`}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isOpen
                          ? "bg-[var(--accent-soft)] text-[var(--accent-light)]"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </span>
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    hidden={!isOpen}
                  >
                    <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 text-xs leading-relaxed text-[var(--text-secondary)] sm:px-5 sm:text-sm">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
            {locale === "vi"
              ? "Còn câu hỏi? Mở issue trên GitHub."
              : "More questions? Open a GitHub issue."}
          </p>
        </div>
      </div>
    </section>
  );
}
