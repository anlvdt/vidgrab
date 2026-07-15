"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Eraser, Settings, Shield, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  LOGO_POSITION_STORAGE_KEY,
  LOGO_REMOVAL_STORAGE_KEY,
  type LogoPosition,
  type LogoRemovalMode,
} from "@/lib/download-settings";

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [sponsorBlock, setSponsorBlock] = useState(() =>
    typeof window === "undefined"
      ? "off"
      : localStorage.getItem("vidgrab-sponsorblock") || "off"
  );
  const [logoRemoval, setLogoRemoval] = useState<LogoRemovalMode>(() =>
    typeof window === "undefined"
      ? "off"
      : localStorage.getItem(LOGO_REMOVAL_STORAGE_KEY) === "blur"
        ? "blur"
        : "off"
  );
  const [logoPosition, setLogoPosition] = useState<LogoPosition>(() => {
    if (typeof window === "undefined") return "top-right";
    const value = localStorage.getItem(LOGO_POSITION_STORAGE_KEY);
    return value === "top-left" ||
      value === "top-right" ||
      value === "bottom-left" ||
      value === "bottom-right"
      ? value
      : "top-right";
  });
  const [saved, setSaved] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { locale } = useI18n();
  const vi = locale === "vi";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const saveSponsorBlock = (mode: string) => {
    setSponsorBlock(mode);
    localStorage.setItem("vidgrab-sponsorblock", mode);
    flashSaved();
  };

  const saveLogoRemoval = (mode: LogoRemovalMode) => {
    setLogoRemoval(mode);
    localStorage.setItem(LOGO_REMOVAL_STORAGE_KEY, mode);
    flashSaved();
  };

  const saveLogoPosition = (position: LogoPosition) => {
    setLogoPosition(position);
    localStorage.setItem(LOGO_POSITION_STORAGE_KEY, position);
    flashSaved();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fab-settings"
        aria-label={vi ? "Mở cài đặt tải xuống" : "Open download settings"}
      >
        <Settings className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label={vi ? "Đóng cài đặt" : "Close settings"}
          />
          <div
            className="settings-dialog glass-card relative mx-3 mb-3 w-full max-w-lg rounded-2xl p-5 sm:mx-4 sm:mb-0 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-light)]">
                  <Settings className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3 id="settings-title" className="text-base font-bold tracking-tight sm:text-lg">
                    {vi ? "Cài đặt tải xuống" : "Download settings"}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {vi ? "Áp dụng cho lần tải tiếp theo" : "Applies to your next download"}
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors hover:bg-[var(--section-bg)] hover:text-[var(--text-primary)]"
                aria-label={vi ? "Đóng" : "Close"}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {saved && (
              <div
                className="mb-4 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--success)_28%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-3 py-2.5 text-sm text-[var(--success)]"
                role="status"
              >
                <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
                {vi ? "Đã lưu cài đặt" : "Settings saved"}
              </div>
            )}

            <div className="space-y-5">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--section-bg)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4 text-[var(--accent-light)]" aria-hidden />
                  SponsorBlock
                </div>
                <p className="mb-3 text-xs leading-relaxed text-[var(--text-muted)]">
                  {vi
                    ? "Tự động bỏ qua hoặc đánh dấu quảng cáo, intro, outro trong video YouTube."
                    : "Auto-skip or chapter-mark sponsors, intros, and outros in YouTube videos."}
                </p>
                <div className="seg-control" role="group" aria-label="SponsorBlock">
                  {[
                    { value: "off", label: vi ? "Tắt" : "Off" },
                    { value: "mark", label: vi ? "Đánh dấu" : "Mark" },
                    { value: "remove", label: vi ? "Cắt bỏ" : "Remove" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => saveSponsorBlock(option.value)}
                      aria-pressed={sponsorBlock === option.value}
                      className={`seg-option ${
                        sponsorBlock === option.value ? "is-active" : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--border)] bg-[var(--section-bg)] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Eraser className="h-4 w-4 text-[var(--accent-light)]" aria-hidden />
                  {vi ? "Che logo trước khi tải" : "Hide logo before download"}
                </div>
                <p className="mb-3 text-xs leading-relaxed text-[var(--text-muted)]">
                  {vi
                    ? "Làm mờ vùng logo ở một góc video. Chỉ dùng cho video bạn có quyền chỉnh sửa; file sẽ xử lý lâu hơn."
                    : "Blurs a corner logo area. Use only for videos you have rights to edit; downloads take longer."}
                </p>
                <div className="seg-control mb-3" role="group" aria-label={vi ? "Che logo" : "Hide logo"}>
                  {[
                    { value: "off" as const, label: vi ? "Tắt" : "Off" },
                    { value: "blur" as const, label: vi ? "Che logo" : "Hide logo" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => saveLogoRemoval(option.value)}
                      aria-pressed={logoRemoval === option.value}
                      className={`seg-option ${
                        logoRemoval === option.value ? "is-active" : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {logoRemoval === "blur" && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "top-left" as const, label: vi ? "Trên trái" : "Top left" },
                      { value: "top-right" as const, label: vi ? "Trên phải" : "Top right" },
                      { value: "bottom-left" as const, label: vi ? "Dưới trái" : "Bottom left" },
                      { value: "bottom-right" as const, label: vi ? "Dưới phải" : "Bottom right" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => saveLogoPosition(option.value)}
                        aria-pressed={logoPosition === option.value}
                        className={`seg-option ${
                          logoPosition === option.value ? "is-active" : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
