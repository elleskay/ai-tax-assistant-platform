"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "abcdefghijklmnopqrstuvwxyz";

type Char = { ch: string; done: boolean };

const settled = (word: string): Char[] => [...word].map((ch) => ({ ch, done: true }));

/**
 * Cycles through words with a short scramble: letters resolve left to right
 * out of random glyphs, and a spectrum band sweeps along the underline on
 * each change. Decorative only, so it is aria-hidden and callers keep the real
 * text for assistive tech. Holds the first word under prefers-reduced-motion.
 */
export function ScrambleWord({
  words,
  interval = 3200,
  duration = 700,
}: {
  words: string[];
  interval?: number;
  duration?: number;
}) {
  const [chars, setChars] = useState<Char[]>(() => settled(words[0] ?? ""));
  // Bumped on every change; keys the underline so its sweep replays.
  const [sweep, setSweep] = useState(0);
  const index = useRef(0);
  const key = words.join("|");

  useEffect(() => {
    const list = key.split("|");
    if (list.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const timer = window.setInterval(() => {
      const from = list[index.current];
      index.current = (index.current + 1) % list.length;
      const to = list[index.current];
      setSweep((s) => s + 1);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        if (t >= 1) {
          setChars(settled(to));
          return;
        }
        const length = Math.round(from.length + (to.length - from.length) * t);
        const resolved = Math.floor(t * to.length);
        setChars(
          Array.from({ length: Math.max(length, resolved) }, (_, i) =>
            i < resolved
              ? { ch: to[i], done: true }
              : {
                  ch: to[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
                  done: false,
                },
          ),
        );
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, interval);
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(raf);
    };
  }, [key, interval, duration]);

  return (
    <span aria-hidden className="relative inline-block whitespace-pre">
      {chars.map((c, i) => (
        <span key={i} className={c.done ? undefined : "text-muted-foreground"}>
          {c.ch}
        </span>
      ))}
      <span
        key={sweep}
        className="hero-shimmer absolute inset-x-0 -bottom-1 h-[3px] rounded-full"
      />
    </span>
  );
}
