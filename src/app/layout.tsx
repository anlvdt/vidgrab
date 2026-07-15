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
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
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
