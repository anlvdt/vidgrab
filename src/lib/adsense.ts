export const DEFAULT_ADSENSE_ACCOUNT = "ca-pub-2128076491386515";

export function adsenseAccount(): string | null {
  const configured = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT?.trim();
  const account = configured || DEFAULT_ADSENSE_ACCOUNT;
  return /^ca-pub-\d{16}$/.test(account) ? account : null;
}

export function adsensePublisherId(): string | null {
  return adsenseAccount()?.replace(/^ca-/, "") || null;
}
