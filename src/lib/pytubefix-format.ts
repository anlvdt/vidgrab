export const PYTUBEFIX_FORMAT_PREFIX = "pf-";

export function pytubefixFormatId(itag: number | string): string {
  return `${PYTUBEFIX_FORMAT_PREFIX}${itag}`;
}

/** Is this a pytubefix-issued format id? */
export function isPytubefixFormat(formatId?: string | null): boolean {
  return !!formatId && formatId.startsWith(PYTUBEFIX_FORMAT_PREFIX);
}
