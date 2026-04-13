"use client";

import { Star, Quote, ArrowUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Testimonials() {
  const { t } = useI18n();

  const reviews = [
    { text: t.testimonial1, author: t.testimonial1Author, role: t.testimonial1Role },
    { text: t.testimonial2, author: t.testimonial2Author, role: t.testimonial2Role },
    { text: t.testimonial3, author: t.testimonial3Author, role: t.testimonial3Role },
    { text: t.testimonial4, author: t.testimonial4Author, role: t.testimonial4Role },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Testimonials */}
      <section className="py-12 sm:py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            {t.testimonialsTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-5 sm:p-6 relative group"
              >
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-[var(--accent)] opacity-20 absolute top-4 right-4" />

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-3.5 h-3.5 fill-[var(--warning)] text-[var(--warning)]"
                    />
                  ))}
                </div>

                {/* Review text */}
                <p className="text-sm sm:text-base text-[var(--text-primary)] leading-relaxed mb-4 italic">
                  &ldquo;{r.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-xs font-bold">
                    {r.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.author}</p>
                    <p className="text-xs text-[var(--text-muted)]">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {t.ctaTitle}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 text-sm sm:text-base">
              {t.ctaSubtitle}
            </p>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
              style={{ boxShadow: "0 4px 24px var(--accent-glow)" }}
            >
              <ArrowUp className="w-4 h-4" />
              {t.ctaButton}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
