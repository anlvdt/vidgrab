"use client";

export default function WaveformVisualizer() {
  const bars = 24;

  return (
    <div className="flex items-end justify-center gap-[3px] h-8 my-3" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => {
        const h = 6 + Math.random() * 22;
        const delay = i * 0.06;
        return (
          <div
            key={i}
            className="waveform-bar"
            style={
              {
                "--wave-h": `${h}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${0.5 + Math.random() * 0.6}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
