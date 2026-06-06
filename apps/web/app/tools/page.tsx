"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Calculator, UserCheck, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function runTool(body: unknown): Promise<string> {
  const res = await fetch("/api/tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.result ?? data.error ?? "Something went wrong.";
}

export default function ToolsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8 pb-16">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
        <Wrench className="h-4 w-4" /> iras-mcp-server
      </div>
      <h2 className="text-xl font-semibold text-navy">MCP tools</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        These three tools are exposed by the IRAS MCP server over the Model Context
        Protocol, the same tools the assistant calls. Try the first two directly
        below.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <LookupTool />
        <EstimateTool />
        <EscalateInfo />
      </div>
    </main>
  );
}

function ToolShell({
  icon: Icon,
  name,
  signature,
  description,
  children,
}: {
  icon: typeof Search;
  name: string;
  signature: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-sm font-semibold text-navy">{name}</p>
            <p className="font-mono text-xs text-muted-foreground">{signature}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Result({ value }: { value: string | null }) {
  if (value === null) return null;
  return (
    <pre
      data-testid="tool-result"
      className="whitespace-pre-wrap rounded-md border bg-secondary/40 p-3 text-sm text-foreground"
    >
      {value}
    </pre>
  );
}

function LookupTool() {
  const [topic, setTopic] = useState("GST");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      setResult(await runTool({ tool: "lookup_tax_info", topic }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell
      icon={Search}
      name="lookup_tax_info"
      signature="(topic: string)"
      description="Look up factual Singapore tax rules: GST, income tax, corporate tax, or SRS."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="lookup-topic">
          Topic
        </label>
        <input
          id="lookup-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. GST"
          className="min-h-10 flex-1 rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <Button onClick={run} disabled={loading || !topic.trim()}>
          {loading ? "Running..." : "Run"}
        </Button>
      </div>
      <Result value={result} />
    </ToolShell>
  );
}

function EstimateTool() {
  const [income, setIncome] = useState("120000");
  const [deductions, setDeductions] = useState("20000");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      setResult(
        await runTool({
          tool: "calculate_tax_estimate",
          income: Number(income) || 0,
          deductions: Number(deductions) || 0,
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolShell
      icon={Calculator}
      name="calculate_tax_estimate"
      signature="(income: number, deductions: number)"
      description="Estimate chargeable income from gross income and deductions, in SGD."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label className="sr-only" htmlFor="est-income">
            Gross income (SGD)
          </label>
          <input
            id="est-income"
            inputMode="numeric"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="Gross income"
            className="min-h-10 w-full rounded-md border bg-card px-3 text-sm tabular-nums outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1">
          <label className="sr-only" htmlFor="est-deductions">
            Deductions (SGD)
          </label>
          <input
            id="est-deductions"
            inputMode="numeric"
            value={deductions}
            onChange={(e) => setDeductions(e.target.value)}
            placeholder="Deductions"
            className="min-h-10 w-full rounded-md border bg-card px-3 text-sm tabular-nums outline-none focus:border-primary"
          />
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? "Running..." : "Run"}
        </Button>
      </div>
      <Result value={result} />
    </ToolShell>
  );
}

function EscalateInfo() {
  return (
    <ToolShell
      icon={UserCheck}
      name="escalate_to_human"
      signature="(reason: string, original_query: string)"
      description="Routes personal or complex queries to a human advisor. Not runnable here because it writes to the advisor queue."
    >
      <Link
        href="/admin"
        className="text-sm font-medium text-primary underline underline-offset-2"
      >
        See escalations in the advisor queue
      </Link>
    </ToolShell>
  );
}
