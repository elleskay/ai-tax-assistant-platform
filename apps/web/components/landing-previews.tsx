"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Live previews for the landing page's product cards. Each one replays a
 * short, looping demo of the real feature (a cited answer streaming in, a
 * sandboxed tool running, retrieval scoring passages, usage clustering, the
 * gateway log, an eval run). All of it is decorative: the cards are links with
 * their own labels, so previews are aria-hidden by the caller. Motion only runs
 * while a preview is on screen and the tab is visible, and reduced motion
 * shows the finished frame instead.
 */

/* ============================== plumbing ============================== */

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Calls `onActive(true/false)` as the element enters or leaves the screen or
 *  the tab is hidden, so work stops when nobody can see it. */
function watchVisibility(el: Element, onActive: (active: boolean) => void) {
  let onScreen = false;
  let active = false;
  const sync = () => {
    const next = onScreen && document.visibilityState === "visible";
    if (next === active) return;
    active = next;
    onActive(active);
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    },
    { threshold: 0.1 },
  );
  io.observe(el);
  document.addEventListener("visibilitychange", sync);
  return () => {
    io.disconnect();
    document.removeEventListener("visibilitychange", sync);
  };
}

/**
 * Elapsed ms on a looping timeline of `duration`. Quantized to 50ms, so a
 * preview re-renders at most ~20 times a second. Reduced motion pins it to
 * the final frame (`duration`).
 */
function useTimeline<T extends HTMLElement>(duration: number) {
  const ref = useRef<T>(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setT(duration);
      return;
    }
    let raf = 0;
    let origin = 0;
    let elapsed = 0;
    const frame = (now: number) => {
      elapsed = (now - origin) % duration;
      setT(Math.floor(elapsed / 50) * 50);
      raf = requestAnimationFrame(frame);
    };
    const stop = watchVisibility(el, (active) => {
      if (active) {
        origin = performance.now() - elapsed;
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    });
    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  }, [duration]);
  return [ref, t] as const;
}

/** A counter that ticks every `interval` ms while on screen (a live feed). */
function useTicker<T extends HTMLElement>(interval: number) {
  const ref = useRef<T>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let timer = 0;
    const stop = watchVisibility(el, (active) => {
      window.clearInterval(timer);
      if (active) timer = window.setInterval(() => setN((v) => v + 1), interval);
    });
    return () => {
      stop();
      window.clearInterval(timer);
    };
  }, [interval]);
  return [ref, n] as const;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const easeInOut = (x: number) => {
  const c = clamp01(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

/** Fade the whole preview out just before the loop restarts. */
const loopFade = (t: number, duration: number) => ({
  opacity: t > duration - 450 && t < duration ? 0 : 1,
  transition: "opacity 400ms ease",
});

/** Syntax-coloured text typed out to `n` characters. */
type Tok = readonly [text: string, className?: string];
const tokLength = (toks: readonly Tok[]) => toks.reduce((s, [text]) => s + text.length, 0);

function Typed({ toks, n }: { toks: readonly Tok[]; n: number }) {
  let left = n;
  return (
    <>
      {toks.map(([text, className], i) => {
        if (left <= 0) return null;
        const part = text.slice(0, left);
        left -= text.length;
        return (
          <span key={i} className={className}>
            {part}
          </span>
        );
      })}
    </>
  );
}

function Caret({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "ml-px inline-block h-[1.05em] w-[0.45em] translate-y-[0.18em] animate-caret bg-foreground/70",
        className,
      )}
    />
  );
}

function DotLoader({ className }: { className?: string }) {
  return (
    <span className={cn("dot-loader", className)}>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} />
      ))}
    </span>
  );
}

/* ============================== Assistant ============================== */

const CHAT_MS = 11000;
const CHAT = {
  u1: "Must I file if I only had employment income?",
  a1: "Yes, if you received a filing notice or earned $22,000 or more.",
  u2: "When is e-filing due?",
  a2: "18 April. Paper returns are due 15 April.",
};

function Bubble({ from, children }: { from: "user" | "ai"; children: React.ReactNode }) {
  return (
    <div className={cn("flex animate-blur-in", from === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2 text-[11px] leading-relaxed",
          from === "user"
            ? "rounded-br-md bg-foreground/[0.08]"
            : "rounded-bl-md bg-foreground/[0.04]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex animate-blur-in justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-foreground/[0.04] px-3.5 py-2.5">
        {[0, 160, 320].map((d) => (
          <span
            key={d}
            className="size-1.5 rounded-full bg-foreground/70"
            style={{ animation: "typing-dot 1s ease-in-out infinite", animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function CiteChip() {
  return (
    <span className="ml-1 inline-block animate-blur-in rounded-full bg-sunset/15 px-1.5 font-mono text-[9px] leading-4 text-sunset">
      1
    </span>
  );
}

export function ChatPreview() {
  const [ref, t] = useTimeline<HTMLDivElement>(CHAT_MS);
  const stream = (text: string, start: number) => {
    const words = text.split(" ");
    const n = t < start ? 0 : Math.min(words.length, Math.floor((t - start) / 55) + 1);
    return { text: words.slice(0, n).join(" "), started: n > 0, done: n >= words.length };
  };
  const a1 = stream(CHAT.a1, 2100);
  const a2 = stream(CHAT.a2, 6500);
  return (
    <div
      ref={ref}
      className="flex h-full flex-col justify-end gap-2.5 pb-12 [mask-image:linear-gradient(to_bottom,transparent,black_30%)]"
      style={loopFade(t, CHAT_MS)}
    >
      {t >= 200 ? <Bubble from="user">{CHAT.u1}</Bubble> : null}
      {t >= 800 && t < 2100 ? <TypingBubble /> : null}
      {a1.started ? (
        <Bubble from="ai">
          {a1.text}
          {a1.done ? <CiteChip /> : null}
        </Bubble>
      ) : null}
      {t >= 4700 ? <Bubble from="user">{CHAT.u2}</Bubble> : null}
      {t >= 5300 && t < 6500 ? <TypingBubble /> : null}
      {a2.started ? (
        <Bubble from="ai">
          {a2.text}
          {a2.done ? <CiteChip /> : null}
        </Bubble>
      ) : null}
    </div>
  );
}

/* ============================== AI Tools ============================== */

const TOOLS_MS = 10500;
const CALL_1: readonly Tok[] = [
  ["percentage_of", "text-[var(--syn-fn)]"],
  ["("],
  ["amount", "text-[var(--syn-key)]"],
  [": "],
  ["100", "text-[var(--syn-num)]"],
  [", "],
  ["rate", "text-[var(--syn-key)]"],
  [": "],
  ["9", "text-[var(--syn-num)]"],
  [")"],
];
const CALL_2: readonly Tok[] = [
  ["case_status", "text-[var(--syn-fn)]"],
  ["("],
  ["status", "text-[var(--syn-key)]"],
  [": "],
  ['"pending"', "text-[var(--syn-str)]"],
  [")"],
];

export function ToolsPreview() {
  const [ref, t] = useTimeline<HTMLDivElement>(TOOLS_MS);
  const typed = (start: number, toks: readonly Tok[]) =>
    t < start ? 0 : Math.min(tokLength(toks), Math.floor((t - start) / 28));
  const n1 = typed(300, CALL_1);
  const n2 = typed(4300, CALL_2);
  const pct = Math.min(100, (t / (TOOLS_MS - 600)) * 100);
  return (
    <div
      ref={ref}
      className="flex h-[calc(100%-2.75rem)] flex-col overflow-hidden rounded-xl bg-background/70 font-mono text-[11px] leading-[1.75] ring-1 ring-border"
      style={loopFade(t, TOOLS_MS)}
    >
      <div className="flex items-center gap-1.5 border-b px-3 py-2">
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[10px] text-muted-foreground">tools/sandbox</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground">
          <span className="h-1 w-10 overflow-hidden rounded-full bg-foreground/10">
            <span className="block h-full bg-foreground/60" style={{ width: `${pct}%` }} />
          </span>
          {pct.toFixed(2)}%
        </span>
      </div>
      <div className="flex-1 px-3 py-2">
        <p>
          <span className="text-[var(--syn-prompt)]">&#x276F; </span>
          <Typed toks={CALL_1} n={n1} />
          {n1 < tokLength(CALL_1) ? <Caret /> : null}
        </p>
        {t >= 1700 ? (
          <p className="animate-blur-in text-muted-foreground">
            &#x25B8; quickjs &middot; 1s &middot; 32MB{" "}
            {t < 2800 ? (
              <DotLoader className="ml-1 text-[var(--syn-num)]" />
            ) : (
              <span className="text-[var(--syn-ok)]">&#x2713; 4 ms</span>
            )}
          </p>
        ) : null}
        {t >= 2900 ? (
          <p className="animate-blur-in">
            {"{ "}
            <span className="text-[var(--syn-key)]">&quot;amount&quot;</span>:{" "}
            <span className="text-[var(--syn-num)]">100</span>,{" "}
            <span className="text-[var(--syn-key)]">&quot;rate&quot;</span>:{" "}
            <span className="text-[var(--syn-num)]">9</span>,{" "}
            <span className="text-[var(--syn-key)]">&quot;result&quot;</span>:{" "}
            <span className="text-[var(--syn-num)]">9</span>
            {" }"}
          </p>
        ) : null}
        {t >= 4200 ? (
          <p className="mt-1.5 animate-blur-in">
            <span className="text-[var(--syn-prompt)]">&#x276F; </span>
            <Typed toks={CALL_2} n={n2} />
            {n2 < tokLength(CALL_2) ? <Caret /> : null}
          </p>
        ) : null}
        {t >= 5400 ? (
          <p className="animate-blur-in text-muted-foreground">
            &#x25B8; lookup{" "}
            {t < 6300 ? (
              <DotLoader className="ml-1 text-[var(--syn-num)]" />
            ) : (
              <span className="text-[var(--syn-ok)]">&#x2713; 1 ms</span>
            )}
          </p>
        ) : null}
        {t >= 6400 ? (
          <p className="animate-blur-in text-[var(--syn-str)]">
            &quot;Pending: the case has been received and is awaiting review.&quot;
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ============================== Documents ============================== */

const DOCS_MS = 9500;
const QUERY = "who must file a return";
const HITS = [
  { file: "filing-and-deadlines.md", loc: "Facts", score: 0.842 },
  { file: "filing-and-deadlines.md", loc: "Officer notes", score: 0.791 },
  { file: "reliefs-and-deductions.md", loc: "Facts", score: 0.688 },
  { file: "residency-and-rates.md", loc: "Summary", score: 0.642 },
];

export function DocumentsPreview() {
  const [ref, t] = useTimeline<HTMLDivElement>(DOCS_MS);
  const q = t < 200 ? 0 : Math.min(QUERY.length, Math.floor((t - 200) / 45));
  const searching = t >= 1400 && t < 2000;
  const shown = t < 2000 ? 0 : Math.min(HITS.length, Math.floor((t - 2000) / 230) + 1);
  return (
    <div ref={ref} className="flex h-full flex-col gap-2" style={loopFade(t, DOCS_MS)}>
      <div className="flex items-center gap-2 rounded-full bg-foreground/[0.06] px-3.5 py-1.5 text-[11px]">
        <svg viewBox="0 0 16 16" className="size-3 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" strokeLinecap="round" />
        </svg>
        <span className="truncate">
          {QUERY.slice(0, q)}
          {t < 2000 ? <Caret /> : null}
        </span>
      </div>
      <div className="relative h-px overflow-hidden rounded-full">
        {searching ? <span className="scan-line absolute inset-0" /> : null}
      </div>
      {HITS.slice(0, shown).map((h, i) => (
        <div
          key={i}
          className="animate-blur-in rounded-xl bg-foreground/[0.04] px-3.5 py-2 text-[11px]"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">
              {h.file} <span className="text-muted-foreground">&middot; {h.loc}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {i === 0 && t >= 3200 ? (
                <span className="animate-blur-in rounded-full bg-sunset/15 px-1.5 font-mono text-[9px] leading-4 text-sunset">
                  cited
                </span>
              ) : null}
              <span className="font-mono text-muted-foreground">{h.score.toFixed(3)}</span>
            </span>
          </div>
          <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-foreground/[0.06]">
            <div
              className="h-full origin-left rounded-full animate-[grow-x_800ms_cubic-bezier(0.22,1,0.36,1)_both]"
              style={{
                width: `${h.score * 100}%`,
                backgroundImage: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================== Usage analytics ============================== */

// The individual-income usage clusters (public/insights.json).
const CLUSTERS = [
  { rgb: [99, 102, 241], label: "Personal reliefs", n: 195, x: 0.22, y: 0.3 },
  { rgb: [168, 85, 247], label: "Residency", n: 134, x: 0.52, y: 0.2 },
  { rgb: [236, 72, 153], label: "Employment income", n: 130, x: 0.78, y: 0.38 },
  { rgb: [249, 115, 22], label: "Self-employed", n: 68, x: 0.36, y: 0.62 },
  { rgb: [234, 179, 8], label: "Foreign income", n: 15, x: 0.66, y: 0.66 },
] as const;
const CYCLE_MS = 9000;

/** Deterministic PRNG, so the scatter is the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0 = scattered usage, 1 = clustered by topic, over one cycle. */
function clusterMix(ms: number) {
  if (ms < 1400) return 0;
  if (ms < 3800) return easeInOut((ms - 1400) / 2400);
  if (ms < 7400) return 1;
  if (ms < 8800) return 1 - easeInOut((ms - 7400) / 1400);
  return 0;
}

export function AnalyticsPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rand = mulberry32(563);
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
    const total = CLUSTERS.reduce((s, c) => s + c.n, 0);
    const points = CLUSTERS.flatMap((c, ci) =>
      Array.from({ length: Math.max(6, Math.round((c.n / total) * 190)) }, () => ({
        c: ci,
        sx: 0.05 + rand() * 0.9,
        sy: 0.05 + rand() * 0.72,
        hx: c.x + gauss() * 0.07,
        hy: c.y + gauss() * 0.09,
        phase: rand() * Math.PI * 2,
      })),
    );

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const parseRgb = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? ["255", "255", "255"]).slice(0, 3).map(Number);

    const draw = (ms: number, time: number) => {
      const m = clusterMix(ms);
      const dark = document.documentElement.classList.contains("dark");
      const fg = parseRgb(getComputedStyle(canvas).color);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Soft glow under each forming cluster.
      if (m > 0) {
        ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
        for (const c of CLUSTERS) {
          const r = Math.max(w, h) * (0.12 + 0.05 * m);
          const g = ctx.createRadialGradient(c.x * w, c.y * h, 0, c.x * w, c.y * h, r);
          g.addColorStop(0, `rgba(${c.rgb.join(",")},${(dark ? 0.22 : 0.14) * m})`);
          g.addColorStop(1, `rgba(${c.rgb.join(",")},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(c.x * w - r, c.y * h - r, r * 2, r * 2);
        }
      }

      // Points drift while scattered and orbit gently once clustered.
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
      for (const p of points) {
        const c = CLUSTERS[p.c];
        const wob = 0.006 + 0.004 * (1 - m);
        const x = (p.sx + (p.hx - p.sx) * m + Math.sin(time * 0.0011 + p.phase) * wob) * w;
        const y = (p.sy + (p.hy - p.sy) * m + Math.cos(time * 0.0013 + p.phase) * wob) * h;
        const col = fg.map((v, i) => Math.round(v + (c.rgb[i] - v) * m));
        ctx.fillStyle = `rgba(${col.join(",")},${0.3 + 0.6 * m})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + 0.9 * m, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels once the clusters have formed.
      const la = clamp01((m - 0.8) / 0.2);
      if (la > 0) {
        ctx.globalCompositeOperation = "source-over";
        ctx.font = `500 10px ${getComputedStyle(canvas).fontFamily}`;
        ctx.textAlign = "center";
        for (const c of CLUSTERS) {
          ctx.fillStyle = `rgba(${fg.join(",")},${0.85 * la})`;
          ctx.fillText(c.label, c.x * w, c.y * h - Math.max(18, h * 0.1));
          ctx.fillStyle = `rgba(${c.rgb.join(",")},${la})`;
          ctx.fillText(String(c.n), c.x * w, c.y * h - Math.max(18, h * 0.1) + 12);
        }
      }
    };

    if (prefersReducedMotion()) {
      draw(5000, 0);
      return () => ro.disconnect();
    }

    let raf = 0;
    let origin = 0;
    let elapsed = 0;
    const frame = (now: number) => {
      elapsed = (now - origin) % CYCLE_MS;
      draw(elapsed, now);
      raf = requestAnimationFrame(frame);
    };
    draw(0, 0);
    const stop = watchVisibility(canvas, (active) => {
      if (active) {
        origin = performance.now() - elapsed;
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    });
    return () => {
      stop();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative h-full">
      <p className="relative z-10 font-mono text-[10px] text-muted-foreground">
        563 interactions &middot; embeddings &middot; k-means
      </p>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full font-mono text-foreground" />
    </div>
  );
}

/* ============================== AI Gateway ============================== */

const CALLS = [
  { model: "Claude Haiku 4.5", vendor: "anthropic", ms: 812, cost: "0.0025" },
  { model: "GPT-4o mini", vendor: "openai", ms: 640, cost: "0.0003" },
  { model: "Claude Sonnet 4.6", vendor: "anthropic", ms: 1904, cost: "0.0121", fallback: true },
  { model: "GPT-4.1 nano", vendor: "openai", ms: 402, cost: "0.0001" },
  { model: "GPT-4.1", vendor: "openai", ms: 1320, cost: "0.0058" },
  { model: "Claude Haiku 4.5", vendor: "anthropic", ms: 655, cost: "0.0014" },
  { model: "Claude Opus 4.8", vendor: "anthropic", ms: 2410, cost: "0.0466" },
  { model: "GPT-4o mini", vendor: "openai", ms: 590, cost: "0.0004" },
] as const;
const VISIBLE_ROWS = 6;

export function GatewayPreview() {
  const [ref, n] = useTicker<HTMLDivElement>(1300);
  const rows = Array.from({ length: VISIBLE_ROWS }, (_, i) => n + VISIBLE_ROWS - 1 - i);
  return (
    <div ref={ref} className="flex h-full flex-col font-mono text-[11px]">
      <div className="flex items-center justify-between pb-2.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 animate-live rounded-full bg-success" />
          live
        </span>
        <span className="tabular-nums">
          {(1284 + n).toLocaleString()} calls &middot; ${(4.12 + n * 0.0031).toFixed(2)}
        </span>
      </div>
      <div className="flex flex-col [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        {rows.map((idx, i) => {
          const c = CALLS[idx % CALLS.length];
          return (
            <div
              key={idx}
              className={cn(
                "grid grid-cols-[0.5rem_minmax(0,1fr)_3.5rem_3.25rem_3.5rem] items-center gap-2.5 border-t py-[7px]",
                i === 0 && n > 0 && "animate-blur-in",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  c.vendor === "anthropic" ? "bg-sunset" : "bg-[#10b981]",
                )}
              />
              <span className="truncate">
                {c.model}
                {"fallback" in c && c.fallback ? (
                  <span className="ml-1.5 rounded-full bg-sunset/15 px-1.5 text-[9px] text-sunset">
                    fallback
                  </span>
                ) : null}
              </span>
              <span className="h-[3px] overflow-hidden rounded-full bg-foreground/[0.06]">
                <span
                  className="block h-full rounded-full bg-foreground/40"
                  style={{ width: `${Math.min(100, (c.ms / 2500) * 100)}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-muted-foreground">
                {c.ms.toLocaleString()}ms
              </span>
              <span className="text-right tabular-nums">${c.cost}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== AI Evaluation ============================== */

const EVAL_MS = 8000;
const RUNS = [62, 71, 78, 74, 83, 86, 81, 88, 92, 90, 94, 96];

export function EvalPreview() {
  const [ref, t] = useTimeline<HTMLDivElement>(EVAL_MS);
  const pct = Math.round(96 * easeOut((t - 300) / 1500));
  const settled = t >= 300 + RUNS.length * 110 + 500;
  return (
    <div ref={ref} className="flex h-full flex-col" style={loopFade(t, EVAL_MS)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[32px] font-medium leading-none tracking-tight tabular-nums">
            {pct}%
          </p>
          <p className="mt-1.5 text-[10px] text-muted-foreground">pass rate &middot; 12 runs</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[10px] transition-opacity duration-300",
            "bg-success/15 text-success",
            settled ? "opacity-100" : "opacity-0",
          )}
        >
          gate passed
        </span>
      </div>
      <div className="relative mt-5 flex h-28 items-end gap-1.5">
        <div
          className="absolute inset-x-0 z-10 border-t border-dashed border-foreground/30"
          style={{ bottom: "80%" }}
        >
          {/* Left side: the early runs there sit below the gate, so the
              label never collides with a bar. */}
          <span className="absolute -top-4 left-0 font-mono text-[9px] text-muted-foreground">
            gate 80%
          </span>
        </div>
        {RUNS.map((v, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t-[3px] transition-[height] duration-500 ease-out",
              v >= 80 ? "bg-success/80" : "bg-destructive/70",
            )}
            style={{ height: t >= 300 + i * 110 ? `${v}%` : "0%" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================== scroll reveal ============================== */

/**
 * Reveals its children one by one (blur-in, staggered) the first time the
 * block scrolls into view. Blocks already on screen at load, reduced motion,
 * and no-JS all just show the content.
 */
export function RevealLines({
  lines,
  className,
}: {
  lines: React.ReactNode[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;
    el.dataset.reveal = "pending";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "in";
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <div key={i} style={{ "--i": i } as React.CSSProperties}>
          {line}
        </div>
      ))}
    </div>
  );
}
