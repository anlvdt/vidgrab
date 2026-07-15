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

  const saveSponsorBlock = (mode: string) => {
    setSponsorBlock(mode);
    localStorage.setItem("vidgrab-sponsorblock", mode);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveLogoRemoval = (mode: LogoRemovalMode) => {
    setLogoRemoval(mode);
    localStorage.setItem(LOGO_REMOVAL_STORAGE_KEY, mode);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveLogoPosition = (position: LogoPosition) => {
    setLogoPosition(position);
    localStorage.setItem(LOGO_POSITION_STORAGE_KEY, position);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
        aria-label={vi ? "Mở cài đặt tải xuống" : "Open download settings"}
      >
        <Settings className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
            onClick={() => setOpen(false)}
            aria-label={vi ? "Đóng cài đặt" : "Close settings"}
          />
          <div
            className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 glass-card rounded-2xl p-5 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="settings-title" className="font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--accent-light)]" />
                {vi ? "Cài Đặt" : "Settings"}
              </h3>
              <button
                ref={closeButtonRef}
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--glass-bg)]"
                aria-label={vi ? "Đóng" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saved && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm bg-[var(--success)]/10 text-[var(--success)]">
                <CheckCircle className="w-4 h-4" />
                {vi ? "Đã lưu cài đặt" : "Settings saved"}
              </div>
            )}

            <div className="space-y-5">
              <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Shield className="w-4 h-4 text-[var(--accent-light)]" />
                SponsorBlock
              </label>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                {vi
                  ? "Tự động bỏ qua hoặc đánh dấu quảng cáo, intro, outro trong video YouTube."
                  : "Auto-skip or chapter-mark sponsors, intros, and outros in YouTube videos."}
              </p>
              <div className="flex gap-2">
                {[
                  { value: "off", label: vi ? "Tắt" : "Off" },
                  { value: "mark", label: vi ? "Đánh dấu" : "Mark" },
                  { value: "remove", label: vi ? "Cắt bỏ" : "Remove" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => saveSponsorBlock(option.value)}
                    aria-pressed={sponsorBlock === option.value}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      sponsorBlock === option.value
                        ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-md"
                        : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Eraser className="w-4 h-4 text-[var(--accent-light)]" />
                  {vi ? "Che logo trước khi tải" : "Hide logo before download"}
                </label>
                <p className="text-xs text-[var(--text-muted)] mb-2">
                  {vi
                    ? "Làm mờ vùng logo ở một góc video. Chỉ dùng cho video bạn có quyền chỉnh sửa; file sẽ xử lý lâu hơn."
                    : "Blurs a corner logo area. Use only for videos you have rights to edit; downloads take longer."}
                </p>
                <div className="flex gap-2 mb-3">
                  {[
                    { value: "off", label: vi ? "Tắt" : "Off" },
                    { value: "blur", label: vi ? "Che logo" : "Hide logo" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => saveLogoRemoval(option.value as LogoRemovalMode)}
                      aria-pressed={logoRemoval === option.value}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        logoRemoval === option.value
                          ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-md"
                          : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {logoRemoval === "blur" && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "top-left", label: vi ? "Trên trái" : "Top left" },
                      { value: "top-right", label: vi ? "Trên phải" : "Top right" },
                      { value: "bottom-left", label: vi ? "Dưới trái" : "Bottom left" },
                      { value: "bottom-right", label: vi ? "Dưới phải" : "Bottom right" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => saveLogoPosition(option.value as LogoPosition)}
                        aria-pressed={logoPosition === option.value}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          logoPosition === option.value
                            ? "bg-[var(--accent)] text-white shadow-md"
                            : "glass text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
