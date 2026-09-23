"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState, SectionHeading } from "@/components/page-header";
import { MODELS } from "@/lib/model-registry";
import {
  type RoutingConfig,
  type TestCase,
  DEFAULT_CONFIG,
  DEFAULT_CASES,
  applyRoutingRules,
  loadConfig,
  loadCases,
  saveCases,
} from "@/lib/routing-rules";

interface CaseResult {
  id: string;
  query: string;
  modelLabel: string;
  reason: string;
  pass: boolean;
  checks: { keyword: string; pass: boolean }[];
  answer: string;
  score?: number;
  rationale?: string;
  error?: string;
}

type Grader = "keyword" | "judge";

interface RunSummary {
  id: string;
  timestamp: string;
  grader: Grader;
  promptVersion?: number;
  total: number;
  passed: number;
  passRate: number;
}

const modelLabel = (id: string) => MODELS.find((m) => m.id === id)?.label ?? id;

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e5).toString(36)}`;
}

export function EvalsWorkbench() {
  // The routing config is read-only here (edited on the Routing page); the run
  // routes each case by it. Cases, grader and history are owned by this page.
  const [config, setConfig] = useState<RoutingConfig>(DEFAULT_CONFIG);
  const [cases, setCases] = useState<TestCase[]>(DEFAULT_CASES);
  const [hydrated, setHydrated] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const [grader, setGrader] = useState<Grader>("keyword");
  const [promptVersion, setPromptVersion] = useState<string>("");
  const [promptVersions, setPromptVersions] = useState<number[]>([]);
  const [history, setHistory] = useState<RunSummary[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/eval/runs", { cache: "no-store" });
      const data = await res.json();
      setHistory(data.runs ?? []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    setConfig(loadConfig());
    setCases(loadCases());
    setHydrated(true);
    void loadHistory();
    // Offer the assistant prompt's stored versions for pinned-version runs.
    // Evaluation is platform-wide, so pin against the default workspace's
    // baseline versions regardless of the selected workspace.
    void fetch("/api/prompts", {
      cache: "no-store",
      headers: { "x-workspace": "individual-income" },
    })
      .then((r) => r.json())
      .then((data: { prompts?: { name: string; versions: { version: number }[] }[] }) => {
        const record = data.prompts?.find((p) => p.name === "assistant-system");
        setPromptVersions(record?.versions.map((v) => v.version) ?? []);
      })
      .catch(() => setPromptVersions([]));
  }, [loadHistory]);

  function updateCases(next: TestCase[]) {
    setCases(next);
    if (hydrated) saveCases(next);
  }

  async function run() {
    setRunning(true);
    setResults(null);
    try {
      await runCases();
    } finally {
      // Anything thrown above (e.g. by applyRoutingRules on a bad rule) must
      // not leave the Run button permanently stuck on "Running...".
      setRunning(false);
    }
  }

  async function runCases() {
    const pinnedVersion = promptVersion ? Number(promptVersion) : undefined;
    const out = await Promise.all(
      cases.map(async (c): Promise<CaseResult> => {
        const route = applyRoutingRules(config, c.query);
        try {
          const res = await fetch("/api/eval", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: c.query,
              expects: c.expects,
              modelId: route.modelId,
              grader,
              ...(pinnedVersion !== undefined ? { promptVersion: pinnedVersion } : {}),
            }),
          });
          if (!res.ok) {
            return {
              id: c.id, query: c.query, modelLabel: modelLabel(route.modelId),
              reason: route.reason, pass: false, checks: [], answer: "",
              error: res.status === 429 ? "rate limited" : "request failed",
            };
          }
          const data = (await res.json()) as {
            model?: string;
            pass?: boolean;
            checks?: CaseResult["checks"];
            answer?: string;
            score?: number;
            rationale?: string;
          };
          return {
            id: c.id, query: c.query, modelLabel: data.model ?? modelLabel(route.modelId),
            reason: route.reason, pass: data.pass === true, checks: data.checks ?? [], answer: data.answer ?? "",
            ...(typeof data.score === "number" ? { score: data.score } : {}),
            ...(data.rationale ? { rationale: data.rationale } : {}),
          };
        } catch {
          return {
            id: c.id, query: c.query, modelLabel: modelLabel(route.modelId),
            reason: route.reason, pass: false, checks: [], answer: "", error: "request failed",
          };
        }
      }),
    );
    setResults(out);
    // Persist the run for the history trend, then refresh it. Errored cases
    // count as fails; storage failures only affect the history panel.
    try {
      await fetch("/api/eval/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grader,
          ...(pinnedVersion !== undefined ? { promptVersion: pinnedVersion } : {}),
          cases: out.map((r) => ({
            query: r.query,
            modelLabel: r.modelLabel,
            pass: r.pass,
            ...(typeof r.score === "number" ? { score: r.score } : {}),
            ...(r.rationale ? { rationale: r.rationale } : {}),
          })),
        }),
      });
      await loadHistory();
    } catch {
      // History is best-effort; the in-page results are already shown.
    }
  }

  // Stats
  const total = results?.length ?? 0;
  const passed = results?.filter((r) => r.pass).length ?? 0;
  const rate = total ? Math.round((passed / total) * 100) : 0;
  const perModel = new Map<string, { pass: number; total: number }>();
  for (const r of results ?? []) {
    const m = perModel.get(r.modelLabel) ?? { pass: 0, total: 0 };
    m.total += 1;
    if (r.pass) m.pass += 1;
    perModel.set(r.modelLabel, m);
  }

  const field =
    "min-h-10 w-full min-w-0 rounded-md border bg-muted px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/15";

  return (
    <div className="flex flex-col gap-12">
      {/* Test cases */}
      <section>
        <SectionHeading
          title="Test cases"
          description={
            <>
              Routed by your{" "}
              <Link
                href="/governance/policy"
                className="text-foreground underline underline-offset-4"
              >
                routing rules
              </Link>
              , then graded.
            </>
          }
        />
        <div className="overflow-hidden rounded-lg bg-card">
          <div className="hidden grid-cols-[1.5rem_minmax(0,1.4fr)_minmax(0,1fr)_2.25rem] gap-2 px-6 pb-1 pt-5 text-xs text-muted-foreground sm:grid">
            <span>#</span>
            <span>Question</span>
            <span>Must contain</span>
            <span />
          </div>
          <div className="flex flex-col gap-2 px-6 py-3">
            {cases.map((c, i) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 sm:grid sm:grid-cols-[1.5rem_minmax(0,1.4fr)_minmax(0,1fr)_2.25rem] sm:items-center"
              >
                <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:block">
                  {i + 1}
                </span>
                <input
                  aria-label={`Case ${i + 1} query`}
                  value={c.query}
                  onChange={(e) => updateCases(cases.map((x, j) => (j === i ? { ...x, query: e.target.value } : x)))}
                  placeholder="question"
                  className={field}
                />
                <input
                  aria-label={`Case ${i + 1} expected keywords`}
                  value={c.expects.join(", ")}
                  onChange={(e) =>
                    updateCases(cases.map((x, j) => (j === i ? { ...x, expects: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x)))
                  }
                  placeholder="must contain (comma separated)"
                  className={field}
                />
                <button
                  type="button"
                  aria-label={`Remove case ${i + 1}`}
                  onClick={() => updateCases(cases.filter((_, j) => j !== i))}
                  className="flex h-9 w-9 items-center justify-center self-end rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-destructive sm:self-auto"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
            {cases.length < 8 ? (
              <button
                type="button"
                onClick={() => updateCases([...cases, { id: genId("c"), query: "", expects: [] }])}
                className="rounded-full px-1 text-sm font-medium text-foreground hover:underline"
              >
                + Add case
              </button>
            ) : <span />}
            <span className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Grader"
                value={grader}
                onValueChange={(v) => setGrader(v as Grader)}
                options={[
                  { value: "keyword", label: "Keyword grader" },
                  { value: "judge", label: "LLM judge" },
                ]}
                className="h-9 w-40 rounded-full"
              />
              {promptVersions.length > 0 ? (
                // "active" stands in for the empty value (no pinned version),
                // which a Radix item cannot hold.
                <Select
                  aria-label="Prompt version"
                  value={promptVersion || "active"}
                  onValueChange={(v) => setPromptVersion(v === "active" ? "" : v)}
                  options={[
                    { value: "active", label: "Active prompt" },
                    ...promptVersions.map((v) => ({ value: String(v), label: `Prompt v${v}` })),
                  ]}
                  className="h-9 w-40 rounded-full"
                />
              ) : null}
              <Button onClick={run} disabled={running || cases.length === 0}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? "Running..." : "Run"}
              </Button>
            </span>
          </div>
        </div>
      </section>

      {/* Results (populated on run) */}
      <section>
        <SectionHeading title="Results" />
        {!results ? (
          <EmptyState title="No results yet">Run the cases to grade them.</EmptyState>
        ) : (
          <div className="flex flex-col gap-6" data-testid="eval-stats">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Pass rate" value={`${rate}%`} accent />
              <Stat label="Passed" value={`${passed}/${total}`} />
              <Stat label="Models used" value={String(perModel.size)} />
            </div>

            {perModel.size > 0 ? (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">By model</p>
                <ul className="flex flex-col overflow-hidden rounded-lg bg-card">
                  {[...perModel.entries()].map(([label, s]) => (
                    <li key={label} className="flex items-center justify-between border-b px-5 py-3 text-sm last:border-0">
                      <span className="text-foreground">{label}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">{s.pass}/{s.total} passed</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <ul className="flex flex-col overflow-hidden rounded-lg bg-card">
              {results.map((r) => (
                <li key={r.id} className="flex gap-3 border-b px-5 py-4 last:border-0">
                  <span
                    className={
                      r.pass
                        ? "mt-0.5 h-fit shrink-0 rounded-full bg-success/15 px-2 py-0.5 font-mono text-[11px] font-medium text-success"
                        : "mt-0.5 h-fit shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[11px] font-medium text-destructive"
                    }
                  >
                    {r.pass ? "PASS" : "FAIL"}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-sm font-medium text-foreground">{r.query}</span>
                      <span className="font-mono text-xs text-muted-foreground">{r.modelLabel}</span>
                    </div>
                    {r.error ? (
                      <p className="text-xs text-destructive">{r.error}</p>
                    ) : (
                      <>
                        {r.checks.length > 0 ? (
                          <p className="font-mono text-xs text-muted-foreground">
                            {r.checks.map((c) => `${c.pass ? "ok" : "miss"}: ${c.keyword}`).join("  |  ")}
                          </p>
                        ) : null}
                        {r.rationale ? (
                          <p className={`text-xs ${r.pass ? "text-muted-foreground" : "text-destructive"}`}>
                            {typeof r.score === "number" ? `Judge score ${r.score}: ` : ""}
                            {r.rationale}
                          </p>
                        ) : null}
                        {r.answer ? (
                          <details className="text-xs">
                            <summary className="w-fit cursor-pointer text-muted-foreground hover:text-foreground">
                              Show response
                            </summary>
                            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-[13px] leading-relaxed text-foreground">
                              {r.answer}
                            </pre>
                          </details>
                        ) : null}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Run history (persisted server-side) */}
      <section>
        <SectionHeading title="Run history" />
        {history.length === 0 ? (
          <EmptyState title="No runs yet">Each run is saved here.</EmptyState>
        ) : (
          <div className="overflow-hidden rounded-lg bg-card" data-testid="run-history">
            {/* Oldest to newest, left to right */}
            <div className="flex h-24 items-end gap-1.5 border-b px-6 pb-4 pt-5">
              {[...history].reverse().map((r) => (
                <div
                  key={r.id}
                  data-testid="run-bar"
                  title={`${r.passRate}%`}
                  style={{ height: `${Math.max(8, r.passRate)}%` }}
                  className="w-3 rounded-t-[3px] bg-foreground/80"
                />
              ))}
            </div>
            <ul className="flex flex-col">
              {history.map((r) => (
                <li
                  key={r.id}
                  data-testid="run-entry"
                  className="flex flex-wrap items-center justify-between gap-2 border-b px-6 py-3 text-sm last:border-0"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="tabular-nums text-muted-foreground">
                      {new Date(r.timestamp).toLocaleString("en-SG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Singapore",
                      })}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {r.grader}
                    </span>
                    {r.promptVersion !== undefined ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        Prompt v{r.promptVersion}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {r.passed}/{r.total}{" "}
                    <b className="ml-1 text-sm font-medium text-foreground">{r.passRate}%</b>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-3 text-4xl font-medium leading-none tracking-tight tabular-nums ${accent ? "text-foreground" : "text-foreground/85"}`}
      >
        {value}
      </p>
    </div>
  );
}
