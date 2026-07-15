/** VidGrab brand mark — distinctive V monogram with film strip */

interface BrandMarkProps {
  className?: string;
  title?: string;
  /** Prefer crisp raster in UI chrome; SVG remains for favicon/PWA. */
  variant?: "raster" | "svg";
}

export default function BrandMark({
  className = "h-9 w-9",
  title = "VidGrab",
  variant = "raster",
}: BrandMarkProps) {
  const src =
    variant === "svg" ? "/icons/icon.svg?v=6" : "/icons/icon-192.png?v=6";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand asset
    <img
      src={src}
      alt={title}
      width={36}
      height={36}
      className={className}
      draggable={false}
      decoding="async"
    />
  );
}
