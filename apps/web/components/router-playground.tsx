"use client";

import { useState } from "react";
import { GitBranch, Play, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RouteResult {
  model: string;
  modelId: string;
  provider: string;
  tier: string;
  reason: string;
}

const EXAMPLES = [
  "What is the GST registration threshold?",
  "Should I contribute to SRS this year?",
  "Compare the tax treatment of a sole proprietorship versus a Pte Ltd for a growing business",
  "My NRIC is S1234567A, what reliefs apply?",
];

export function RouterPlayground() {
  const [query, setQuery] = useState("What is the GST registration threshold?");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(q: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? "Rate limited, please wait." : "Routing failed.");
        return;
      }
      setResult((await res.json()) as RouteResult);
    } catch {
      setError("Routing failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <GitBranch className="h-4 w-4" /> Live model router
      </h3>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        This is the real router the assistant uses: the cheapest model reads the
        query and picks the cheapest model that can answer it well. Type a query
        and route it.
      </p>
      <Card className="shadow-soft">
        <CardContent className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="router-query">
            Query to route
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="router-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a tax query"
              className="min-h-10 flex-1 rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => run(query)}
              disabled={loading || !query.trim()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? "Routing..." : "Route"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setQuery(e);
                  void run(e);
                }}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:brightness-95"
              >
                {e.length > 48 ? e.slice(0, 46) + "..." : e}
              </button>
            ))}
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {result ? (
            <div
              data-testid="route-result"
              className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs text-muted-foreground">Routed to</p>
                <p className="font-medium text-navy">{result.model}</p>
                <p className="mt-1 text-xs text-muted-foreground">{result.reason}</p>
              </div>
              <Badge className="bg-accent font-mono text-accent-foreground hover:bg-accent">
                {result.tier}
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
