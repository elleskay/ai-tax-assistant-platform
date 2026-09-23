import {
  Activity,
  ArrowRightLeft,
  CircleDollarSign,
  Coins,
  Download,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelName, textClass, vendorOf, type Tone } from "@/components/tone";
import { PAGE_CLASS, PageHeader } from "@/components/page-header";
import {
  aggregateByModel,
  computeStats,
  getEffectivePolicy,
  loadPlatformActivity,
} from "@/lib/governance";

// Reads the live stores at request time, never at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Dashboard - AI Tax Assistant Platform",
};

function Stat({
  label,
  value,
  tone,
  icon: Icon,
  accent,
  sub,
  href,
  className,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
  icon: LucideIcon;
  accent: Tone;
  sub?: string;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={cn("size-4 shrink-0", textClass(accent))} strokeWidth={1.75} />
        <span className="flex-1">{label}</span>
        {tone ? (
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              tone === "good" ? "bg-success" : "bg-warning-foreground",
            )}
          />
        ) : null}
      </dt>
      <dd
        className={cn(
          "mt-3 text-4xl font-medium leading-none tracking-tight tabular-nums",
          tone === "warn" && "text-warning-foreground",
        )}
      >
        {value}
      </dd>
      {sub ? <dd className="mt-3 text-xs text-muted-foreground">{sub}</dd> : null}
    </>
  );
  const cls = cn("block rounded-lg bg-card p-5", className);
  return href ? (
    <a href={href} className={cn(cls, "transition-colors hover:bg-card/70")}>
      <dl>{body}</dl>
    </a>
  ) : (
    <dl className={cls}>{body}</dl>
  );
}

function Sparkline({ values, threshold }: { values: number[]; threshold: number }) {
  const passing = (values[values.length - 1] ?? 0) >= threshold;
  if (values.length < 2) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Two runs needed for a trend.
      </p>
    );
  }
  const w = 280;
  const h = 72;
  const pad = 6;
  const x = (i: number) => pad + (i / (values.length - 1)) * (w - 2 * pad);
  const y = (v: number) => pad + (1 - v / 100) * (h - 2 * pad);
  const points = values
    .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("w-full", passing ? "text-success" : "text-destructive")}
      role="img"
      aria-label="Eval pass-rate trend across recent runs"
    >
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${x(0).toFixed(1)},${h - pad} ${points} ${x(values.length - 1).toFixed(1)},${h - pad}`}
        fill="url(#trend-fill)"
      />
      <line
        x1={pad}
        y1={y(threshold)}
        x2={w - pad}
        y2={y(threshold)}
        strokeDasharray="3 3"
        className="stroke-warning-foreground/70"
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(v)}
          r="2.5"
          className={v >= threshold ? "fill-success" : "fill-destructive"}
        />
      ))}
    </svg>
  );
}

export default async function DashboardPage() {
  // Platform-wide: aggregates activity from every workspace, not the selected one.
  const { calls, runs, workspaceCount } = await loadPlatformActivity();
  const policy = await getEffectivePolicy();
  const g = policy.guardrails;
  const ceiling = g.costCeiling.usdPerCall;
  const stats = computeStats(calls, runs, ceiling, g.evalGate.threshold);

  const byModel = aggregateByModel(calls);
  const maxModelCalls = Math.max(1, ...byModel.map((m) => m.calls));
  const trend = [...runs]
    .slice(0, 12)
    .reverse()
    .map((r) => r.passRate);
  const overCeilingRate = stats.totalCalls
    ? (stats.overCeiling / stats.totalCalls) * 100
    : 0;
  const fallbackRate = stats.totalCalls
    ? (stats.fallbacks / stats.totalCalls) * 100
    : 0;
  const times = calls.map((c) => c.timestamp).sort();
  const fromTs = times[0];
  const toTs = times[times.length - 1];
  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-SG", {
        dateStyle: "medium",
        timeZone: "Asia/Singapore",
      });
    } catch {
      return iso;
    }
  };
  const usd = (n: number) => (n > 0 && n < 0.01 ? "<$0.01" : `$${n.toFixed(2)}`);

  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow="Platform"
        title="AI Dashboard"
        description={`Health across all ${workspaceCount} workspaces.`}
        actions={
          <a
            href="/api/governance/report"
            download
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary px-4 text-sm font-medium transition-colors hover:bg-secondary/70"
          >
            <Download className="h-4 w-4" /> Risk assessment (.md)
          </a>
        }
      />

      <section className="mt-12">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat
            label="Model calls"
            icon={Activity}
            accent="indigo"
            value={stats.totalCalls.toLocaleString()}
            sub={`${workspaceCount} workspaces`}
          />
          <Stat
            label={`Eval gate ≥${g.evalGate.threshold}%`}
            icon={ShieldCheck}
            accent="emerald"
            value={stats.latestPassRate == null ? "n/a" : `${stats.latestPassRate}%`}
            tone={stats.evalGatePass == null ? undefined : stats.evalGatePass ? "good" : "warn"}
            sub={runs.length ? `latest of ${runs.length} runs` : "no runs yet"}
            href="/evals"
          />
          <Stat
            label="Over cost ceiling"
            icon={CircleDollarSign}
            accent="orange"
            value={stats.overCeiling.toLocaleString()}
            tone={stats.overCeiling ? "warn" : "good"}
            sub={`${overCeilingRate.toFixed(1)}% of calls`}
            href="/governance/audit"
          />
          <Stat
            label="Fallbacks"
            icon={ArrowRightLeft}
            accent="sunset"
            value={stats.fallbacks.toLocaleString()}
            tone={stats.fallbacks ? "warn" : undefined}
            sub={`${fallbackRate.toFixed(1)}% of calls`}
            href="/governance/audit"
          />
          <Stat
            label="Total cost"
            icon={Coins}
            accent="yellow"
            value={usd(stats.totalCostUsd)}
            sub={`${stats.totalCalls.toLocaleString()} calls`}
            className="col-span-2 lg:col-span-1"
          />
        </div>
        {fromTs ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {fmtDate(fromTs)} to {fmtDate(toTs)}
          </p>
        ) : null}
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg bg-card p-6">
          <h2 className="text-base">By model</h2>
          {byModel.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No calls yet.</p>
          ) : (
            <ul className="mt-5 flex flex-col gap-4">
              {byModel.map((m) => (
                <li key={m.model} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <ModelName label={m.model} />
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {m.calls.toLocaleString()} calls &middot; {usd(m.costUsd)}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        vendorOf(m.model) === "anthropic"
                          ? "bg-vendor-anthropic"
                          : vendorOf(m.model) === "openai"
                            ? "bg-vendor-openai"
                            : "bg-foreground",
                      )}
                      style={{ width: `${(m.calls / maxModelCalls) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg bg-card p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base">Eval pass rate</h2>
            <p className="text-xs text-muted-foreground">
              Gate {g.evalGate.threshold}%
              {stats.latestPassRate == null ? "" : ` · latest ${stats.latestPassRate}%`}
            </p>
          </div>
          <div className="mt-5">
            <Sparkline values={trend} threshold={g.evalGate.threshold} />
          </div>
        </section>
      </div>
    </main>
  );
}
