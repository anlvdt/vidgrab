"use client";

import { useState, useEffect, useRef } from "react";
import {
  Settings,
  X,
  Shield,
  Cookie,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Globe,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SettingsState {
  proxyUrl: string;
  cookiesExist: boolean;
}

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SettingsState>({ proxyUrl: "", cookiesExist: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showCookieGuide, setShowCookieGuide] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { locale } = useI18n();
  const vi = locale === "vi";

  useEffect(() => {
    if (!open) return;
    setState((s) => ({ ...s, proxyUrl: localStorage.getItem("vidgrab-proxy") || "" }));
    fetch("/api/cookies").then((r) => r.json()).then((d) => {
      setState((s) => ({ ...s, cookiesExist: d.exists }));
    }).catch(() => {});
  }, [open]);

  const saveProxy = () => {
    localStorage.setItem("vidgrab-proxy", state.proxyUrl);
    setMessage({ type: "ok", text: vi ? "Đã lưu proxy" : "Proxy saved" });
    setTimeout(() => setMessage(null), 2000);
  };

  const uploadCookies = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/cookies", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        setState((s) => ({ ...s, cookiesExist: true }));
        setMessage({ type: "ok", text: vi ? "Đã lưu cookies" : "Cookies saved" });
      } else {
        setMessage({ type: "err", text: data.error });
      }
    } catch {
      setMessage({ type: "err", text: vi ? "Lỗi upload" : "Upload failed" });
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteCookies = async () => {
    await fetch("/api/cookies", { method: "DELETE" });
    setState((s) => ({ ...s, cookiesExist: false }));
    setMessage({ type: "ok", text: vi ? "Đã xóa cookies" : "Cookies deleted" });
    setTimeout(() => setMessage(null), 2000);
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
          <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 glass-card rounded-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--accent-light)]" />
                {vi ? "Cài Đặt Nâng Cao" : "Advanced Settings"}
              </h3>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-[var(--glass-bg)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {message && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm ${
                message.type === "ok" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--danger)]/10 text-[var(--danger)]"
              }`}>
                {message.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            {/* Proxy */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Globe className="w-4 h-4 text-[var(--accent-light)]" />
                Proxy
              </label>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                {vi
                  ? "Dùng proxy để vượt qua chặn IP hoặc giới hạn vùng. Hỗ trợ HTTP, SOCKS5."
                  : "Bypass IP blocks or geo-restrictions. Supports HTTP, SOCKS5."}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={state.proxyUrl}
                  onChange={(e) => setState((s) => ({ ...s, proxyUrl: e.target.value }))}
                  placeholder="socks5://127.0.0.1:1080"
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button onClick={saveProxy} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90">
                  {vi ? "Lưu" : "Save"}
                </button>
              </div>
            </div>

            {/* Cookies */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Cookie className="w-4 h-4 text-[var(--accent-light)]" />
                Cookies
              </label>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                {vi
                  ? "Upload cookies.txt để tải nội dung riêng tư (Facebook private, YouTube giới hạn tuổi, v.v.)"
                  : "Upload cookies.txt for private content (Facebook private, YouTube age-restricted, etc.)"}
              </p>

              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  state.cookiesExist ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}>
                  <Shield className="w-3.5 h-3.5" />
                  {state.cookiesExist ? (vi ? "Đã cài đặt" : "Active") : (vi ? "Chưa có" : "Not set")}
                </div>
                <input ref={fileRef} type="file" accept=".txt" onChange={uploadCookies} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-medium hover:text-[var(--accent-light)] disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                {state.cookiesExist && (
                  <button onClick={deleteCookies} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10">
                    <Trash2 className="w-3.5 h-3.5" />
                    {vi ? "Xóa" : "Delete"}
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowCookieGuide(!showCookieGuide)}
                className="flex items-center gap-1.5 text-xs text-[var(--accent-light)] hover:text-[var(--accent)]"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCookieGuide ? "rotate-180" : ""}`} />
                {vi ? "Hướng dẫn lấy cookies" : "How to get cookies"}
              </button>

              {showCookieGuide && (
                <div className="mt-3 bg-[var(--bg-secondary)] rounded-xl p-4 space-y-3 text-xs">
                  <p className="font-medium text-[var(--accent-light)]">
                    {vi ? "Cách lấy file cookies.txt:" : "How to get cookies.txt:"}
                  </p>
                  <div className="space-y-2">
                    {[
                      { n: "1", vi: "Cài extension trên Chrome/Edge/Firefox:", en: "Install browser extension:" },
                      { n: "2", vi: "Đăng nhập vào trang web cần tải (Instagram, Facebook, YouTube, v.v.)", en: "Log in to the target website (Instagram, Facebook, YouTube, etc.)" },
                      { n: "3", vi: "Nhấn vào icon extension, chọn 'Export' hoặc 'Download cookies.txt'", en: "Click the extension icon, select 'Export' or 'Download cookies.txt'" },
                      { n: "4", vi: "Upload file cookies.txt vào đây bằng nút Upload ở trên", en: "Upload the cookies.txt file here using the Upload button above" },
                    ].map((s) => (
                      <div key={s.n} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">{s.n}</span>
                        <div>
                          <p>{vi ? s.vi : s.en}</p>
                          {s.n === "1" && (
                            <a href="https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-light)] hover:underline flex items-center gap-1 mt-0.5">
                              Get cookies.txt LOCALLY <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[var(--glass-border)] pt-2">
                    <p className="text-[var(--text-muted)]">
                      {vi
                        ? "Lưu ý: Cookies được lưu trên server của bạn, không gửi đi đâu. Nên cập nhật cookies mỗi 1-2 tuần."
                        : "Note: Cookies are stored on your server only. Refresh every 1-2 weeks."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Platform status */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
              <p className="text-xs font-medium mb-2 text-[var(--accent-light)]">
                {vi ? "Trạng thái từng nền tảng" : "Platform Status"}
              </p>
              <div className="space-y-2 text-xs">
                {[
                  { name: "YouTube", ok: true, note: vi ? "Hoạt động tốt. Cookies chỉ cần cho video giới hạn tuổi." : "Works great. Cookies only for age-restricted." },
                  { name: "TikTok", ok: true, note: vi ? "Hoạt động tốt qua scraper. Không cần cookies." : "Works via scraper. No cookies needed." },
                  { name: "X / Twitter", ok: true, note: vi ? "Hoạt động với video công khai." : "Works with public video tweets." },
                  { name: "Instagram", ok: false, note: vi ? "Nội dung công khai qua scraper. Riêng tư cần cookies." : "Public via scraper. Private needs cookies." },
                  { name: "Facebook", ok: false, note: vi ? "Video công khai OK. Riêng tư cần cookies." : "Public OK. Private needs cookies." },
                  { name: "Reddit", ok: true, note: vi ? "Hoạt động tốt." : "Works great." },
                ].map((p) => (
                  <div key={p.name} className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${p.ok ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`} />
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-[var(--text-muted)]"> — {p.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
