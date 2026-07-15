"use client";

import { Loader2, Link2, Layers, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AnalyzingSkeletonProps {
  url?: string;
}

const stepsVi = [
  { icon: Link2, label: "Đang đọc liên kết" },
  { icon: Layers, label: "Đang lấy metadata & định dạng" },
  { icon: Download, label: "Chuẩn bị danh sách tải" },
] as const;

const stepsEn = [
  { icon: Link2, label: "Reading the link" },
  { icon: Layers, label: "Fetching metadata & formats" },
  { icon: Download, label: "Preparing download options" },
] as const;

export default function AnalyzingSkeleton({ url }: AnalyzingSkeletonProps) {
  const { locale } = useI18n();
  const vi = locale === "vi";
  const steps = vi ? stepsVi : stepsEn;

  return (
    <section
      className="mx-auto mb-10 w-full max-w-7xl scroll-mt-6 px-4 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-labelledby="analyzing-title"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 text-center">
          <p className="section-kicker">
            {vi ? "Đang xử lý" : "Working"}
          </p>
          <h2
            id="analyzing-title"
            className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            <Loader2
              className="h-6 w-6 shrink-0 animate-spin text-[var(--accent-light)]"
              aria-hidden
            />
            {vi ? "Đang phân tích liên kết" : "Analyzing your link"}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {vi
              ? "Thường mất vài giây — phụ thuộc nền tảng nguồn."
              : "Usually a few seconds — depends on the source platform."}
          </p>
          {url ? (
            <p className="mx-auto mt-2 max-w-md truncate text-xs text-[var(--text-muted)]">
              {url}
            </p>
          ) : null}
        </div>

        <div className="glass-card overflow-hidden rounded-2xl">
          {/* Preview skeleton */}
          <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-secondary)]">
            <div className="skeleton-shimmer absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card-solid)]/80 shadow-lg">
                <Loader2
                  className="h-6 w-6 animate-spin text-[var(--accent-light)]"
                  aria-hidden
                />
              </span>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {/* Title / meta bars */}
            <div className="space-y-2">
              <div className="skeleton-bar h-4 w-[80%] max-w-[20rem]" />
              <div className="skeleton-bar h-3 w-[40%] max-w-[12rem]" />
            </div>

            {/* CTA placeholders */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="skeleton-bar h-11 w-36 rounded-xl" />
              <div className="skeleton-bar h-11 w-28 rounded-xl" />
              <div className="skeleton-bar h-11 w-24 rounded-xl" />
            </div>

            {/* Format row placeholders */}
            <div className="space-y-2 pt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="skeleton-bar h-6 w-12 rounded-md" />
                    <div className="skeleton-bar h-3 w-16" />
                    <div className="skeleton-bar h-3 w-20 hidden sm:block" />
                  </div>
                  <div className="skeleton-bar h-9 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {steps.map(({ icon: Icon, label }) => (
            <li key={label} className="trust-chip">
              <Icon className="h-3.5 w-3.5 text-[var(--accent-light)]" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
