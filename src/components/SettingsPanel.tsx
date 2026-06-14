"use client";

import { useState } from "react";
import { CheckCircle, Settings, Shield, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [sponsorBlock, setSponsorBlock] = useState(() =>
    typeof window === "undefined"
      ? "off"
      : localStorage.getItem("vidgrab-sponsorblock") || "off"
  );
  const [saved, setSaved] = useState(false);
  const { locale } = useI18n();
  const vi = locale === "vi";

  const saveSponsorBlock = (mode: string) => {
    setSponsorBlock(mode);
    localStorage.setItem("vidgrab-sponsorblock", mode);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--accent-light)]" />
                {vi ? "Cài Đặt" : "Settings"}
              </h3>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-[var(--glass-bg)]" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {saved && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm bg-[var(--success)]/10 text-[var(--success)]">
                <CheckCircle className="w-4 h-4" />
                {vi ? "Đã lưu SponsorBlock" : "SponsorBlock saved"}
              </div>
            )}

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
          </div>
        </div>
      )}
    </>
  );
}
