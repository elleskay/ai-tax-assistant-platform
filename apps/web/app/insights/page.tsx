"use client";

import { useEffect, useState } from "react";
import { PageTabs } from "@/components/page-tabs";
import {
  EmptyState,
  Notice,
  PAGE_CLASS,
  PageHeader,
  SectionHeading,
} from "@/components/page-header";

interface TrainingNeed {
  label: string;
  count: number;
  examplePrompts: string[];
  recommendation: string;
}
interface DocGap {
  topic: string;
  reason: string;
  count: number;
}
interface ProcImp {
  topic: string;
  avgTurns: number;
  avgSteps: number;
  avgTimeSeconds: number;
  count: number;
}
interface WsInsights {
  name: string;
  generatedAt: string;
  synthetic: boolean;
  totalInteractions: number;
  trainingNeeds: TrainingNeed[];
  docGaps: DocGap[];
  processImprovements: ProcImp[];
}
type Meta = { embeddingPath: string; clusterPath: string; note: string };
type InsightsFile = Record<string, WsInsights | Meta>;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeading title={title} description={blurb} />
      {children}
    </section>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsFile | null>(null);
  const [ws, setWs] = useState("individual-income");
  const [err, setErr] = useState(false);

  useEffect(() => {
    setWs(readCookie("workspace") ?? "individual-income");
    fetch("/insights.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("no data"))))
      .then((d: InsightsFile) => setData(d))
      .catch(() => setErr(true));
  }, []);

  const meta = data?._meta as Meta | undefined;
  // No cross-workspace fallback: a workspace with no usage data shows the reset
  // (empty) state rather than another workspace's analytics. The unvalidated
  // cookie could name the "_meta" key, which is not a workspace entry.
  const cur =
    ws !== "_meta" ? (data?.[ws] as WsInsights | undefined) : undefined;
  const maxNeed = Math.max(1, ...(cur?.trainingNeeds.map((t) => t.count) ?? [1]));

  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow="Workspace"
        title="Usage analytics"
        description="What officers ask, where guidance runs out, where work stalls."
      />

      <div className="mt-8">
        {err ? (
          <p className="text-sm text-muted-foreground">
            No insights artifact found. Generate it with{" "}
            <code className="font-mono text-[13px]">services/insights/generate.py</code>.
          </p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !cur ? (
          <EmptyState title="No usage yet">
            Fills in as officers use the assistant.
          </EmptyState>
        ) : (
          <>
            <Notice>
              Synthetic sample: {cur.name}, {cur.totalInteractions.toLocaleString()}{" "}
              interactions.
              {meta ? (
                <span className="text-muted-foreground/70">
                  {" "}
                  {meta.embeddingPath} &middot; {meta.clusterPath}
                </span>
              ) : null}
            </Notice>
            <PageTabs
              ariaLabel="Usage analytics sections"
              tabs={[
                {
                  id: "training",
                  label: "Training needs",
                  content: (
                    <Section
                      title="Training needs"
                      blurb="The most-asked topics."
                    >
                      <ul className="overflow-hidden rounded-lg bg-card">
                        {cur.trainingNeeds.map((t, i) => (
                          <li key={i} className="border-b px-5 py-4 last:border-0">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="font-medium text-foreground">{t.label}</span>
                              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                                {t.count} queries
                              </span>
                            </div>
                            <div aria-hidden className="mt-2.5 h-1 overflow-hidden rounded-full bg-foreground/10">
                              <div
                                className="h-full rounded-full bg-foreground/80"
                                style={{ width: `${(t.count / maxNeed) * 100}%` }}
                              />
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                              {t.recommendation}
                            </p>
                            {t.examplePrompts?.length ? (
                              <p className="mt-1 text-xs italic text-muted-foreground">
                                e.g. {t.examplePrompts.slice(0, 2).join("  /  ")}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  ),
                },
                {
                  id: "gaps",
                  label: "Doc gaps",
                  content: (
                    <Section
                      title="Documentation gaps"
                      blurb="Where retrieval came up short."
                    >
                      <ul className="overflow-hidden rounded-lg bg-card">
                        {cur.docGaps.map((d, i) => (
                          <li key={i} className="border-b px-5 py-4 last:border-0">
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="font-medium text-foreground">{d.topic}</span>
                              <span className="shrink-0 rounded-full bg-warning px-2 py-0.5 font-mono text-[11px] tabular-nums text-warning-foreground">
                                {d.count} queries
                              </span>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {d.reason}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  ),
                },
                {
                  id: "process",
                  label: "Process hotspots",
                  content: (
                    <Section
                      title="Process hotspots"
                      blurb="Where work takes longest."
                    >
                      <div className="overflow-x-auto rounded-lg bg-card">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                              <th scope="col" className="px-5 py-3 font-medium">Topic</th>
                              <th scope="col" className="px-5 py-3 text-right font-medium">Avg turns</th>
                              <th scope="col" className="px-5 py-3 text-right font-medium">Avg steps</th>
                              <th scope="col" className="px-5 py-3 text-right font-medium">Avg time</th>
                              <th scope="col" className="px-5 py-3 text-right font-medium">Cases</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cur.processImprovements.map((p, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="px-5 py-3 font-medium text-foreground">{p.topic}</td>
                                <td className="px-5 py-3 text-right font-mono text-[13px] tabular-nums">{p.avgTurns}</td>
                                <td className="px-5 py-3 text-right font-mono text-[13px] tabular-nums">{p.avgSteps}</td>
                                <td className="px-5 py-3 text-right font-mono text-[13px] tabular-nums">{p.avgTimeSeconds}s</td>
                                <td className="px-5 py-3 text-right font-mono text-[13px] tabular-nums">{p.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Section>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    </main>
  );
}
