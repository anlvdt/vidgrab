"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

interface AdUnitProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  responsive?: boolean;
  className?: string;
}

const AD_CLIENT = "ca-pub-2128076491386515";

export default function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className = "",
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;

    // Wait for adsbygoogle script to load, then push
    const tryPush = () => {
      if (typeof window === "undefined") return;
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
      try {
        window.adsbygoogle.push({});
        pushed.current = true;
      } catch {
        // Ad blocker or script not loaded
      }
    };

    // If script already loaded, push immediately
    if (window.adsbygoogle) {
      tryPush();
      return;
    }

    // Otherwise wait for it
    const interval = setInterval(() => {
      if (window.adsbygoogle) {
        tryPush();
        clearInterval(interval);
      }
    }, 300);

    // Give up after 10 seconds
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const styleMap: Record<string, React.CSSProperties> = {
    auto: { display: "block" },
    horizontal: { display: "inline-block", width: 728, height: 90 },
    vertical: { display: "inline-block", width: 160, height: 600 },
    rectangle: { display: "inline-block", width: 336, height: 280 },
  };

  return (
    <div
      className={`ad-container overflow-hidden min-h-[50px] ${className}`}
      aria-hidden="true"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={styleMap[format] || styleMap.auto}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        {...(responsive && format === "auto"
          ? {
              "data-ad-format": "auto",
              "data-full-width-responsive": "true",
            }
          : {})}
      />
    </div>
  );
}
