import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/lib/ThemeContext";
import { I18nProvider } from "@/lib/i18n";
import { adsenseAccount } from "@/lib/adsense";
import "./globals.css";

const validAdsenseAccount = adsenseAccount();

export const metadata: Metadata = {
  title: "VidGrab — Tải video công khai theo chất lượng bạn chọn",
  description:
    "Phân tích liên kết video công khai và tải MP4, MP3 hoặc chất lượng cụ thể từ các nền tảng phổ biến. Một số nguồn có thể cần cookie hoặc giới hạn theo khu vực.",
  keywords: [
    "video downloader",
    "youtube downloader",
    "tiktok downloader",
    "instagram downloader",
    "twitter video download",
    "4k download",
    "8k hdr",
    "mp3 converter",
    "playlist downloader",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VidGrab",
  },
  ...(validAdsenseAccount
    ? { other: { "google-adsense-account": validAdsenseAccount } }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f8f7ff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var t=localStorage.getItem('vidgrab-theme');
                if(t!=='dark'&&t!=='light')t='light';
                document.documentElement.setAttribute('data-theme',t);
              })();
            `,
          }}
        />
        {/* Register Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if('serviceWorker' in navigator){
                window.addEventListener('load',function(){
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen min-h-dvh">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
