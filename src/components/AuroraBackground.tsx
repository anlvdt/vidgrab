"use client";

import { useEffect, useRef } from "react";

export default function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create floating particles
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.left = `${Math.random() * 100}%`;
      p.style.bottom = `${Math.random() * -20}%`;
      p.style.animationDuration = `${8 + Math.random() * 15}s`;
      p.style.animationDelay = `${Math.random() * 10}s`;
      p.style.width = `${2 + Math.random() * 3}px`;
      p.style.height = p.style.width;
      container.appendChild(p);
      particles.push(p);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div className="aurora-bg" ref={containerRef}>
      <div className="aurora-blob" />
      <div className="aurora-blob" />
      <div className="aurora-blob" />
    </div>
  );
}
