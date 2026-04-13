"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const { t } = useI18n();

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
    <section className="py-12 sm:py-20 px-4 relative z-10">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
          {t.faqTitle}
        </h2>

        <div className="space-y-2.5 sm:space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 text-left transition-colors hover:bg-[var(--glass-bg)]"
                aria-expanded={open === i}
              >
                <span className="font-medium text-xs sm:text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-[var(--text-secondary)] transition-transform duration-300 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open === i ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
