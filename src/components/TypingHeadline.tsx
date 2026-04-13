"use client";

import { useEffect, useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";

export default function TypingHeadline() {
  const { t } = useI18n();
  const words = t.typingWords;
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // Find the longest word to reserve space and prevent layout shift
  const longestWord = useMemo(
    () => words.reduce((a, b) => (a.length >= b.length ? a : b), ""),
    [words]
  );

  useEffect(() => {
    const current = words[wordIndex % words.length];
    const speed = deleting ? 60 : 120;

    if (!deleting && charIndex === current.length) {
      const timeout = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (deleting && charIndex === 0) {
      setDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCharIndex((prev) => prev + (deleting ? -1 : 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, wordIndex, words]);

  const displayed = words[wordIndex % words.length].slice(0, charIndex);

  return (
    <span className="inline-block relative align-bottom">
      {/* Invisible longest word to reserve width */}
      <span className="invisible whitespace-pre" aria-hidden="true">
        {longestWord}
      </span>
      {/* Visible typed text, absolutely positioned so it doesn't affect layout */}
      <span className="absolute left-0 top-0 gradient-text whitespace-pre">
        {displayed}
        <span
          className="inline-block w-[2px] h-[0.8em] ml-0.5 align-middle"
          style={{
            background: "var(--accent)",
            animation: "typing-cursor 1s step-end infinite",
          }}
        />
      </span>
    </span>
  );
}
