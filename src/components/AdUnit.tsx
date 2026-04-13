"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
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
  const containerRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (pushed.current) return;
    if (typeof window.adsbygoogle === "undefined") return;

    try {
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch { /* ad blocker */ }

    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      const ins = container.querySelector("ins.adsbygoogle");
      if (ins && ins.getAttribute("data-ad-status") === "filled") {
        setLoaded(true);
        observer.disconnect();
      }
    });

    observer.observe(container, { attributes: true, subtree: true, childList: true });
    const timeout = setTimeout(() => observer.disconnect(), 5000);
    return () => { observer.disconnect(); clearTimeout(timeout); };
  }, []);

  const styleMap: Record<string, React.CSSProperties> = {
    auto: { display: "block" },
    horizontal: { display: "inline-block", width: 728, height: 90 },
    vertical: { display: "inline-block", width: 160, height: 600 },
    rectangle: { display: "inline-block", width: 336, height: 280 },
  };

  if (!loaded) {
    return (
      <div ref={containerRef} className="hidden" aria-hidden="true">
        <ins
          className="adsbygoogle"
          style={styleMap[format] || styleMap.auto}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
          {...(responsive && format === "auto"
            ? { "data-ad-format": "auto", "data-full-width-responsive": "true" }
            : {})}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`ad-container flex items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <ins
        className="adsbygoogle"
        style={styleMap[format] || styleMap.auto}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        {...(responsive && format === "auto"
          ? { "data-ad-format": "auto", "data-full-width-responsive": "true" }
          : {})}
      />
    </div>
  );
}
