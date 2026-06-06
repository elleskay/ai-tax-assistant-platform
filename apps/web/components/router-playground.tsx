"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { routeQuery, ROUTE_REASON_TEXT } from "@/lib/router";

const EXAMPLES = [
  "What is the GST registration threshold?",
  "Should I contribute to SRS this year?",
  "My NRIC is S1234567A, what reliefs apply?",
  "Tell me about Singapore taxes",
];

export function RouterPlayground() {
  const [query, setQuery] = useState("What is the GST registration threshold?");
  const route = routeQuery(query);

  return (
    <section className="mt-10">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <GitBranch className="h-4 w-4" /> Router playground
      </h3>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        Type a query to see which model the router picks and why. This is the real
        routing logic, run locally, no model call.
      </p>
      <Card className="shadow-soft">
        <CardContent className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="router-query">
            Query to route
          </label>
          <input
            id="router-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a tax query"
            className="min-h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setQuery(e)}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:brightness-95"
              >
                {e}
              </button>
            ))}
          </div>
          <div
            data-testid="route-result"
            className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs text-muted-foreground">Routes to</p>
              <p className="font-medium text-navy">{route.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-accent font-mono text-accent-foreground hover:bg-accent">
                {route.reason}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {ROUTE_REASON_TEXT[route.reason]}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
