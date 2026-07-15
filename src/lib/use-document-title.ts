"use client";

import { useEffect } from "react";

/**
 * Sets document.title and re-asserts shortly after navigation.
 * Next.js root metadata can overwrite the title after client navigations.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (!title) return;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const t0 = window.setTimeout(apply, 0);
    const t1 = window.setTimeout(apply, 50);
    const t2 = window.setTimeout(apply, 200);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [title]);
}
