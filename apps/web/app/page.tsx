import { Fragment } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrambleWord } from "@/components/scramble-word";
import {
  AnalyticsPreview,
  ChatPreview,
  DocumentsPreview,
  EvalPreview,
  GatewayPreview,
  RevealLines,
  ToolsPreview,
} from "@/components/landing-previews";

export const metadata = {
  title: "AI Tax Assistant Platform",
};

/* ---------- Product cards: a live preview, a label, Explore ---------- */

function ProductCard({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/card relative flex h-[280px] overflow-hidden rounded-lg bg-card",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 p-5 transition-transform duration-500 ease-out group-hover/card:scale-[1.02]"
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-4 text-sm font-medium">
        <span>{label}</span>
        <span className="text-foreground transition-colors group-hover/card:text-muted-foreground">
          Explore &rarr;
        </span>
      </div>
    </Link>
  );
}

/* ---------- Governance: policy as code ---------- */

function PolicyWindow() {
  const k = (s: string) => <span className="text-[var(--syn-key)]">&quot;{s}&quot;</span>;
  const s = (v: string) => <span className="text-[var(--syn-str)]">&quot;{v}&quot;</span>;
  const n = (v: string) => <span className="text-[var(--syn-num)]">{v}</span>;
  const lines = [
    <Fragment key="0">{"{"}</Fragment>,
    <Fragment key="1">{"  "}{k("version")}: {s("1.0.0")},</Fragment>,
    <Fragment key="2">{"  "}{k("guardrails")}: {"{"}</Fragment>,
    <Fragment key="3">{"    "}{k("piiEscalation")}: {"{ "}{k("triggers")}: [{s("nric")}, {s("uen")}] {"}"},</Fragment>,
    <Fragment key="4">{"    "}{k("evalGate")}: {"{ "}{k("threshold")}: {n("80")} {"}"},</Fragment>,
    <Fragment key="5">{"    "}{k("costCeiling")}: {"{ "}{k("usdPerCall")}: {n("0.05")} {"}"},</Fragment>,
    <Fragment key="6">{"    "}{k("grounding")}: {"{ "}{k("rule")}: {s("cite sources")} {"}"}</Fragment>,
    <Fragment key="7">{"  "}{"}"},</Fragment>,
    <Fragment key="8">{"  "}{k("routing")}: {"{ "}{k("fallbackModelId")}: {s("...")} {"}"}</Fragment>,
    <Fragment key="9">
      {"}"}
      <span className="ml-1 inline-block h-[1.05em] w-[0.45em] translate-y-[0.18em] animate-caret bg-foreground/70" />
    </Fragment>,
  ];
  return (
    // Always a dark terminal, in either theme (the class scopes dark tokens).
    <div className="dark overflow-hidden rounded-xl bg-background text-foreground shadow-[0_0_0_1px_var(--border),0_24px_60px_-30px_rgb(0_0_0/0.8)]">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">policy.json</span>
      </div>
      <RevealLines
        lines={lines}
        className="overflow-x-auto whitespace-pre px-5 py-4 font-mono text-[12.5px] leading-[1.7]"
      />
    </div>
  );
}

const STATS: [string, string][] = [
  ["5", "Agent steps, max"],
  ["6", "Models routed"],
  ["1s", "Sandbox deadline"],
];

/* ---------- Oversight: cards with a small live visual on top ---------- */

const AUDIT: [string, string, string, string?][] = [
  ["09:41", "call", "Claude Haiku 4.5 · $0.0025"],
  ["09:41", "eval", "keyword grader · 5/5"],
  ["09:42", "call", "Claude Opus 4.8 · $0.0712", "over ceiling"],
  ["09:43", "prompt", "assistant-system v4 active"],
  ["09:44", "call", "GPT-4o mini · $0.0003"],
  ["09:44", "call", "Claude Sonnet 4.6 · $0.0121", "fallback"],
  ["09:45", "eval", "LLM judge · 92%"],
  ["09:46", "call", "GPT-4.1 nano · $0.0001"],
];

function AuditTicker() {
  return (
    <div className="h-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]">
      <div className="animate-ticker font-mono text-[10.5px]">
        {[...AUDIT, ...AUDIT].map(([time, kind, detail, flag], i) => (
          <div key={i} className="flex items-center gap-2.5 py-[5px]">
            <span className="text-muted-foreground">{time}</span>
            <span className="w-10 shrink-0 text-muted-foreground">{kind}</span>
            <span className="truncate">{detail}</span>
            {flag ? (
              <span
                className={cn(
                  "ml-auto shrink-0 rounded-full px-1.5 text-[9px]",
                  flag === "fallback" ? "bg-sunset/15 text-sunset" : "bg-warning text-warning-foreground",
                )}
              >
                {flag}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function InstructionsDiff() {
  return (
    <div className="font-mono text-[10.5px] leading-[1.9]">
      <p className="mb-1.5 text-muted-foreground">assistant-system &middot; v3 &rarr; v4</p>
      <p className="rounded-sm bg-[var(--syn-err)]/10 px-2 text-[var(--syn-err)]">
        - Answer in full paragraphs.
      </p>
      <p className="rounded-sm bg-[var(--syn-ok)]/10 px-2 text-[var(--syn-ok)]">
        + Answer in two sentences, then cite.
      </p>
      <p className="px-2 text-muted-foreground">&nbsp; Never give a final assessment.</p>
      <p className="rounded-sm bg-[var(--syn-ok)]/10 px-2 text-[var(--syn-ok)]">
        + Flag taxpayer PII for the officer.
        <span className="ml-1 inline-block h-[1.05em] w-[0.45em] translate-y-[0.18em] animate-caret bg-[var(--syn-ok)]" />
      </p>
    </div>
  );
}

function WorkspacesVisual() {
  return (
    <div className="flex flex-col gap-2 text-[11px]">
      {[
        ["Individual Income Tax", "3 docs"],
        ["Corporate Income Tax", "4 docs"],
      ].map(([name, meta], i) => (
        <div key={name} className="flex items-center gap-2.5 rounded-xl bg-foreground/[0.04] px-3 py-2">
          <span
            className="size-1.5 animate-live rounded-full bg-success"
            style={{ animationDelay: `${i * 400}ms` }}
          />
          <span className="truncate">{name}</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">{meta}</span>
        </div>
      ))}
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-foreground/15 px-3 py-2 text-muted-foreground">
        <span className="size-1.5 rounded-full bg-sunset" />
        <span>+ GST</span>
        <span className="ml-auto font-mono text-[10px]">inherits policy</span>
      </div>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
        policy v1.0.0 &rarr; every workspace <span className="text-[var(--syn-ok)]">&#x2713;</span>
      </p>
    </div>
  );
}

const OVERSIGHT = [
  {
    href: "/governance/audit",
    meta: "Platform · AI Audit Trail",
    title: "Every call, run, and change, on the record.",
    visual: <AuditTicker />,
  },
  {
    href: "/prompts",
    meta: "Workspace · AI Instructions",
    title: "Versioned instructions, one active at a time.",
    visual: <InstructionsDiff />,
  },
  {
    href: "/workspaces",
    meta: "Platform · Workspaces",
    title: "One workspace per department. One policy for all.",
    visual: <WorkspacesVisual />,
  },
];

function PathCard({
  title,
  body,
  items,
  cta,
  primary,
}: {
  title: string;
  body: string;
  items: string[];
  cta: { href: string; label: string };
  primary?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-card p-8 sm:p-10">
      <h3 className="text-2xl tracking-tight">{title}</h3>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <Check className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            {item}
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        className={cn(
          "mt-10 inline-flex h-11 w-fit items-center gap-1 rounded-full px-5 text-sm font-medium transition-colors",
          primary
            ? "bg-primary text-primary-foreground hover:bg-primary/85"
            : "bg-secondary text-foreground hover:bg-secondary/70",
        )}
      >
        {cta.label}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function PlatformHome() {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-10">
      {/* Hero */}
      <section className="flex flex-col items-center pb-16 pt-20 text-center md:pt-28">
        <h1 className="text-[44px] font-[450] leading-[1.06] tracking-[-0.01em] sm:text-6xl">
          <span className="sr-only">One governed AI assistant per department</span>
          <span aria-hidden>
            One governed AI assistant
            <br />
            per <ScrambleWord words={["department", "tax type", "workspace"]} />.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed">
          Cited answers, drafts, and case triage. Grounded in each
          department&apos;s own guidance.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/assistant"
            className="inline-flex h-11 items-center gap-1 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Open the assistant <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/workspaces"
            className="inline-flex h-11 items-center rounded-full bg-secondary px-5 text-sm font-medium transition-colors hover:bg-secondary/70"
          >
            Browse workspaces
          </Link>
        </div>
      </section>

      {/* Products: each card replays a short live demo of the feature */}
      <section aria-label="Products" className="grid gap-3 md:grid-cols-2 lg:grid-cols-12">
        <ProductCard href="/assistant" label="Assistant" className="lg:col-span-4">
          <ChatPreview />
        </ProductCard>
        <ProductCard href="/tools" label="AI Tools" className="lg:col-span-4">
          <ToolsPreview />
        </ProductCard>
        <ProductCard href="/documents" label="Documents" className="md:col-span-2 lg:col-span-4">
          <DocumentsPreview />
        </ProductCard>
        <ProductCard href="/insights" label="Usage analytics" className="md:col-span-2 lg:col-span-5">
          <AnalyticsPreview />
        </ProductCard>
        <ProductCard href="/gateway" label="AI Gateway" className="lg:col-span-4">
          <GatewayPreview />
        </ProductCard>
        <ProductCard href="/evals" label="AI Evaluation" className="lg:col-span-3">
          <EvalPreview />
        </ProductCard>
      </section>

      {/* Governance */}
      <section className="grid items-center gap-12 py-28 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-sm font-medium text-muted-foreground">For governance</p>
          <h2 className="mt-4 text-4xl leading-none tracking-tight sm:text-5xl">
            One policy.
            <br />
            Every workspace.
          </h2>
          <p className="mt-5 max-w-md leading-relaxed">
            Guardrails, routing, and audit as code. Applied the same way
            everywhere.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/governance"
              className="inline-flex h-11 items-center gap-1 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
            >
              Open the dashboard <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/governance/policy"
              className="inline-flex h-11 items-center rounded-full bg-secondary px-5 text-sm font-medium transition-colors hover:bg-secondary/70"
            >
              Read the policy
            </Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {STATS.map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-sm font-medium tabular-nums">{value}</dd>
                <dd className="mt-0.5 text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <PolicyWindow />
      </section>

      {/* Oversight */}
      <section className="pb-28">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-3xl tracking-tight">Oversight</h2>
          <Link
            href="/governance/audit"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Audit trail &rarr;
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {OVERSIGHT.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="group flex flex-col overflow-hidden rounded-lg bg-card transition-colors hover:bg-card/70"
            >
              <div
                aria-hidden
                className="m-2 mb-0 h-44 overflow-hidden rounded-xl bg-background/60 p-4 transition-transform duration-500 group-hover:scale-[1.01]"
              >
                {o.visual}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-6">
                <p className="text-sm text-muted-foreground">{o.meta}</p>
                <p className="text-lg leading-snug tracking-tight">{o.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Get started */}
      <section className="pb-28">
        <h2 className="mb-10 text-center text-3xl tracking-tight">
          Choose how to get started
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <PathCard
            title="Work a case"
            body="Ask, draft, and triage in one workspace."
            items={["Answers cited to your guidance", "Replies drafted for review", "Case triage with PII flags", "No-code tools"]}
            cta={{ href: "/assistant", label: "Open the assistant" }}
            primary
          />
          <PathCard
            title="Govern the platform"
            body="Set the rules every workspace runs under."
            items={["Policy as code", "Deterministic model routing", "Eval pass-rate gate", "Full audit trail"]}
            cta={{ href: "/governance", label: "Open the dashboard" }}
          />
        </div>
      </section>

      {/* The sidebar is the directory; the footer only carries the notice.
          (Repeating nav labels here would duplicate their link names.) */}
      <footer className="flex flex-col gap-2 border-t pt-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-medium text-foreground">Tax Assistant</span>
        </p>
        <p>General information only. Demo documents are self-authored, open, or synthetic.</p>
      </footer>
    </main>
  );
}
