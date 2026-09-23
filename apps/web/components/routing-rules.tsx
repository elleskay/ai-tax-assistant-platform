"use client";

import { useEffect, useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import { SectionHeading } from "@/components/page-header";
import { Select } from "@/components/ui/select";
import { MODELS, modelOptionLabel } from "@/lib/model-registry";
import {
  type RoutingConfig,
  DEFAULT_CONFIG,
  applyRoutingRules,
  loadConfig,
  saveConfig,
} from "@/lib/routing-rules";

/*
 * The deterministic model router, editable and persisted per browser. The
 * assistant and the Evals workbench both read this saved config (loadConfig) to
 * route each query, so changes here change how everything routes.
 */

const modelLabel = (id: string) => MODELS.find((m) => m.id === id)?.label ?? id;
const MODEL_OPTIONS = MODELS.map((m) => ({ value: m.id, label: modelOptionLabel(m) }));

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e5).toString(36)}`;
}

export function RoutingRules() {
  const [config, setConfig] = useState<RoutingConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const [testQuery, setTestQuery] = useState("What is the GST registration threshold?");

  useEffect(() => {
    setConfig(loadConfig());
    setHydrated(true);
  }, []);

  function updateConfig(next: RoutingConfig) {
    setConfig(next);
    if (hydrated) saveConfig(next);
  }

  const preview = applyRoutingRules(config, testQuery);

  return (
    <section>
      <SectionHeading
        title="Model routing rules"
        description="First matching keyword wins. Otherwise, the fallback."
        actions={
          <button
            type="button"
            onClick={() => updateConfig(DEFAULT_CONFIG)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        }
      />
      <div className="flex flex-col gap-3 rounded-lg bg-card p-6">
          <div className="hidden grid-cols-[minmax(0,1fr)_14rem_8rem_2rem] gap-2 px-0.5 text-xs text-muted-foreground sm:grid">
            <span>Keywords</span>
            <span>Model</span>
            <span>Reason</span>
            <span />
          </div>
          {config.rules.map((rule, i) => (
            <div key={rule.id} className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_14rem_8rem_2rem] sm:items-center">
              <input
                aria-label={`Rule ${i + 1} keywords`}
                value={rule.keywords.join(", ")}
                onChange={(e) =>
                  updateConfig({
                    ...config,
                    rules: config.rules.map((r, j) =>
                      j === i ? { ...r, keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : r,
                    ),
                  })
                }
                placeholder="keywords, comma separated"
                className="min-h-10 rounded-md border bg-muted px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/15"
              />
              <Select
                aria-label={`Rule ${i + 1} model`}
                value={rule.modelId}
                onValueChange={(v) =>
                  updateConfig({
                    ...config,
                    rules: config.rules.map((r, j) => (j === i ? { ...r, modelId: v } : r)),
                  })
                }
                options={MODEL_OPTIONS}
                className="w-full"
              />
              <input
                aria-label={`Rule ${i + 1} reason`}
                value={rule.reason}
                onChange={(e) =>
                  updateConfig({
                    ...config,
                    rules: config.rules.map((r, j) => (j === i ? { ...r, reason: e.target.value } : r)),
                  })
                }
                placeholder="reason"
                className="min-h-10 rounded-md border bg-muted px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/15 min-w-0 font-mono text-xs"
              />
              <button
                type="button"
                aria-label={`Remove rule ${i + 1}`}
                onClick={() => updateConfig({ ...config, rules: config.rules.filter((_, j) => j !== i) })}
                className="flex h-9 w-9 items-center justify-center self-end rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-destructive sm:self-auto"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          ))}
          <div className="mt-1 flex flex-wrap items-center gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() =>
                updateConfig({
                  ...config,
                  rules: [...config.rules, { id: genId("r"), keywords: [], modelId: MODELS[0].id, reason: "custom" }],
                })
              }
              className="rounded-full px-1 text-sm font-medium text-foreground hover:underline"
            >
              + Add rule
            </button>
            <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              Fallback
              <Select
                aria-label="Fallback model"
                value={config.fallbackModelId}
                onValueChange={(v) => updateConfig({ ...config, fallbackModelId: v })}
                options={MODEL_OPTIONS}
                className="w-64"
              />
            </span>
          </div>

      </div>

      {/* Live route preview (free) */}
      <div className="mt-3 flex flex-col gap-2 rounded-lg bg-card px-6 py-5 sm:flex-row sm:items-center sm:gap-4">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs text-muted-foreground">
          Try a query
          <input
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Type a question"
            className="min-h-10 rounded-md border bg-muted px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/15"
          />
        </label>
        <span data-testid="route-preview" className="text-sm sm:pt-5">
          routes to <b className="font-medium text-foreground">{modelLabel(preview.modelId)}</b>{" "}
          <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {preview.reason}
          </span>
        </span>
      </div>
    </section>
  );
}
