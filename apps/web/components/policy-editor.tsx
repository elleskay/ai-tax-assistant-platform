"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { SectionHeading } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GovernancePolicy } from "@/lib/governance";

/*
 * Editor for the platform governance policy. The policy ships as code; this lets
 * an admin override the tunable guardrail values and text. It is platform-wide
 * (one policy for every workspace), so it is not scoped to the workspace
 * switcher. On save it refreshes the server view so the dashboard stats, the
 * over-ceiling audit flags, and the downloaded report reflect the new values.
 */
export function PolicyEditor({ policy }: { policy: GovernancePolicy }) {
  const g = policy.guardrails;
  const router = useRouter();
  const [ceiling, setCeiling] = useState(String(g.costCeiling.usdPerCall));
  const [threshold, setThreshold] = useState(String(g.evalGate.threshold));
  const [triggers, setTriggers] = useState(g.piiEscalation.triggers.join(", "));
  const [piiAction, setPiiAction] = useState(g.piiEscalation.action);
  const [grounding, setGrounding] = useState(g.grounding.rule);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/governance/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costCeilingUsd: Number(ceiling),
          evalGateThreshold: Number(threshold),
          piiTriggers: triggers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          piiAction,
          groundingRule: grounding,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  const labelCls = "flex flex-col gap-1.5 text-sm font-medium text-foreground";
  // A colored dot per guardrail, matching its category across the app.
  const mark = (className: string) => (
    <span aria-hidden className={`mr-2 inline-block size-1.5 -translate-y-px rounded-full ${className}`} />
  );

  return (
    <section>
      <SectionHeading
        title="Guardrails"
        description="Applies to every workspace."
      />
      <div className="flex flex-col gap-5 rounded-lg bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>
            <span>{mark("bg-cat-orange")}Cost ceiling (USD per call)</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={ceiling}
              onChange={(e) => setCeiling(e.target.value)}
            />
          </label>
          <label className={labelCls}>
            <span>{mark("bg-cat-emerald")}Eval gate (% pass rate)</span>
            <Input
              type="number"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
        </div>
        <label className={labelCls}>
          <span>{mark("bg-cat-pink")}PII triggers</span>
          <Input
            value={triggers}
            onChange={(e) => setTriggers(e.target.value)}
          />
        </label>
        <label className={labelCls}>
          <span>{mark("bg-cat-pink")}PII handling rule</span>
          <Textarea
            rows={3}
            value={piiAction}
            onChange={(e) => setPiiAction(e.target.value)}
          />
        </label>
        <label className={labelCls}>
          <span>{mark("bg-cat-yellow")}Grounding rule</span>
          <Textarea
            rows={3}
            value={grounding}
            onChange={(e) => setGrounding(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3">
          <Button
            onClick={save}
            disabled={state === "saving"}
            className="self-start"
          >
            {state === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {state === "saving" ? "Saving..." : "Save policy"}
          </Button>
          {state === "saved" ? (
            <span role="status" className="text-sm text-success">
              Saved.
            </span>
          ) : null}
          {state === "error" ? (
            <span role="alert" className="text-sm text-destructive">
              Couldn&apos;t save. Try again.
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
