export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface LogoRemovalOptions {
  enabled: boolean;
  position: LogoPosition;
}

export function parseLogoRemoval(searchParams: URLSearchParams): LogoRemovalOptions {
  const enabled = searchParams.get("logo") === "blur";
  const raw = searchParams.get("logoPosition");
  const position: LogoPosition =
    raw === "top-left" ||
    raw === "top-right" ||
    raw === "bottom-left" ||
    raw === "bottom-right"
      ? raw
      : "top-right";

  return { enabled, position };
}
