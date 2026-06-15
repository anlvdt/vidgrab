export type LogoRemovalMode = "off" | "blur";
export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const LOGO_REMOVAL_STORAGE_KEY = "vidgrab-logo-removal";
export const LOGO_POSITION_STORAGE_KEY = "vidgrab-logo-position";

export function getLogoRemovalMode(): LogoRemovalMode {
  if (typeof window === "undefined") return "off";
  return localStorage.getItem(LOGO_REMOVAL_STORAGE_KEY) === "blur" ? "blur" : "off";
}

export function getLogoPosition(): LogoPosition {
  if (typeof window === "undefined") return "top-right";
  const value = localStorage.getItem(LOGO_POSITION_STORAGE_KEY);
  return value === "top-left" ||
    value === "top-right" ||
    value === "bottom-left" ||
    value === "bottom-right"
    ? value
    : "top-right";
}

export function applyLogoRemovalParams(params: URLSearchParams, hasVideo = true) {
  if (!hasVideo || getLogoRemovalMode() !== "blur") return;
  params.set("logo", "blur");
  params.set("logoPosition", getLogoPosition());
}
