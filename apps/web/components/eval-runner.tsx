"use client";

import { useState } from "react";
import { Play, CheckCircle2, XCircle, Loader2, FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Check {
  keyword: string;
  pass: boolean;
}
interface EvalResult {
  answer: string;
  checks: Check[];
  pass: boolean;
}

export function EvalRunner() {
  const [question, setQuestion] = useState("What is the GST registration threshold?");
  const [expects, setExpects] = useState("1,000,000, turnover");
  const [result, setResult] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const keywords = expects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);
      const res = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, expects: keywords }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? "Rate limited, please wait a moment." : "Run failed.");
        return;
      }
      setResult((await res.json()) as EvalResult);
    } catch {
      setError("Run failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <FlaskConical className="h-4 w-4" /> Run your own check
      </h3>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        Ask the assistant a question and assert the answer contains certain
        keywords, the same icontains style the eval suite uses. Each run is one
        live model call.
      </p>
      <Card className="shadow-soft">
        <CardContent className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Question</span>
            <input
              aria-label="Eval question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Answer must contain (comma separated)
            </span>
            <input
              aria-label="Expected keywords"
              value={expects}
              onChange={(e) => setExpects(e.target.value)}
              placeholder="e.g. 1,000,000, turnover"
              className="min-h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <div>
            <Button onClick={run} disabled={loading || !question.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? "Running..." : "Run check"}
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {result ? (
            <div data-testid="eval-result" className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span
                  data-testid="eval-verdict"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
                  style={{
                    backgroundColor: result.pass ? "var(--success)" : "var(--destructive)",
                  }}
                >
                  {result.pass ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {result.pass ? "PASS" : "FAIL"}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {result.checks.map((c) => (
                  <li key={c.keyword} className="flex items-center gap-2 text-sm">
                    {c.pass ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-mono text-xs">contains &ldquo;{c.keyword}&rdquo;</span>
                  </li>
                ))}
              </ul>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Answer</p>
                <pre className="whitespace-pre-wrap rounded-md border bg-secondary/40 p-3 text-sm text-foreground">
                  {result.answer}
                </pre>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
