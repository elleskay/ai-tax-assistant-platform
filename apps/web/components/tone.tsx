import { cn } from "@/lib/utils";

/*
 * The color vocabulary for the console pages. Color always carries meaning:
 *  - vendor: Anthropic models are orange, OpenAI models green;
 *  - status: pass green, fail red, flags amber, fallback orange;
 *  - category: one hue per rule reason, tool kind, event type, or cluster;
 *  - scope: the workspace is indigo, the platform orange.
 * Class strings are literal so Tailwind can see them.
 */

export type Tone =
  | "indigo"
  | "purple"
  | "pink"
  | "orange"
  | "yellow"
  | "cyan"
  | "emerald"
  | "success"
  | "warning"
  | "danger"
  | "sunset"
  | "neutral";

const TAG: Record<Tone, string> = {
  indigo: "bg-cat-indigo/15 text-cat-indigo",
  purple: "bg-cat-purple/15 text-cat-purple",
  pink: "bg-cat-pink/15 text-cat-pink",
  orange: "bg-cat-orange/15 text-cat-orange",
  yellow: "bg-cat-yellow/15 text-cat-yellow",
  cyan: "bg-cat-cyan/15 text-cat-cyan",
  emerald: "bg-cat-emerald/15 text-cat-emerald",
  success: "bg-success/15 text-success",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-destructive/15 text-destructive",
  sunset: "bg-sunset/15 text-sunset",
  neutral: "bg-secondary text-muted-foreground",
};

const FILL: Record<Tone, string> = {
  indigo: "bg-cat-indigo",
  purple: "bg-cat-purple",
  pink: "bg-cat-pink",
  orange: "bg-cat-orange",
  yellow: "bg-cat-yellow",
  cyan: "bg-cat-cyan",
  emerald: "bg-cat-emerald",
  success: "bg-success",
  warning: "bg-warning-foreground",
  danger: "bg-destructive",
  sunset: "bg-sunset",
  neutral: "bg-muted-foreground",
};

const TEXT: Record<Tone, string> = {
  indigo: "text-cat-indigo",
  purple: "text-cat-purple",
  pink: "text-cat-pink",
  orange: "text-cat-orange",
  yellow: "text-cat-yellow",
  cyan: "text-cat-cyan",
  emerald: "text-cat-emerald",
  success: "text-success",
  warning: "text-warning-foreground",
  danger: "text-destructive",
  sunset: "text-sunset",
  neutral: "text-muted-foreground",
};

export const fillClass = (tone: Tone) => FILL[tone];
export const textClass = (tone: Tone) => TEXT[tone];

/** A small rounded label in a tone. */
export function Tag({
  tone = "neutral",
  mono,
  className,
  children,
}: {
  tone?: Tone;
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-4",
        mono && "font-mono",
        TAG[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", FILL[tone], className)} />;
}

/* ---------- vendor ---------- */

export type Vendor = "anthropic" | "openai";

/** Vendor from a model label ("Claude Haiku 4.5", "GPT-4o mini"). */
export function vendorOf(label: string): Vendor | undefined {
  if (/^claude/i.test(label)) return "anthropic";
  if (/^(gpt|o\d)/i.test(label)) return "openai";
  return undefined;
}

/** A model name led by its vendor dot. */
export function ModelName({ label, className }: { label: string; className?: string }) {
  const vendor = vendorOf(label);
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      {vendor ? (
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            vendor === "anthropic" ? "bg-vendor-anthropic" : "bg-vendor-openai",
          )}
        />
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

/* ---------- categories ---------- */

/** Model-routing rule reasons (lib/routing-rules). */
export const REASON_TONE: Record<string, Tone> = {
  "pii-sensitive": "pink",
  drafting: "purple",
  "complex-reasoning": "indigo",
  calculation: "orange",
  "grounded-citation": "yellow",
  "factual-lookup": "cyan",
};
export const reasonTone = (reason: string): Tone => REASON_TONE[reason] ?? "neutral";

/** Custom-tool kinds. */
export const KIND_TONE: Record<string, Tone> = {
  lookup: "indigo",
  template: "pink",
  code: "orange",
};

/** Audit-trail event kinds. */
export const EVENT_TONE: Record<string, Tone> = {
  "model-call": "indigo",
  "eval-run": "emerald",
  "prompt-version": "purple",
};

/** Cycle for anything ordered without its own category (clusters, workspaces). */
export const SERIES: Tone[] = ["indigo", "purple", "pink", "orange", "yellow", "cyan", "emerald"];

/* ---------- code ---------- */

/**
 * JSON with syntax colors (keys, strings, numbers, literals). Tokenizes the
 * formatted text rather than parsing, so any valid JSON string renders.
 */
export function JsonCode({ value, className }: { value: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|\b(true|false|null)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(value))) {
    if (m.index > last) parts.push(value.slice(last, m.index));
    if (m[1] && m[2]) {
      parts.push(<span key={i++} className="text-[var(--syn-key)]">{m[1]}</span>, m[2]);
    } else if (m[1]) {
      parts.push(<span key={i++} className="text-[var(--syn-str)]">{m[1]}</span>);
    } else if (m[3]) {
      parts.push(<span key={i++} className="text-[var(--syn-num)]">{m[3]}</span>);
    } else {
      parts.push(<span key={i++} className="text-[var(--syn-fn)]">{m[4]}</span>);
    }
    last = re.lastIndex;
  }
  if (last < value.length) parts.push(value.slice(last));
  return <code className={className}>{parts}</code>;
}
