import { z } from "zod";

/*
 * Deterministic, configurable model routing. The original approach (router.mjs):
 * cheap keyword/pattern rules pick a model, no LLM call. Free and instant. The
 * assistant uses DEFAULT_CONFIG; the Evals workbench lets a visitor edit rules
 * and test cases (stored per-browser) to experiment.
 */

export interface RoutingRule {
  id: string;
  keywords: string[];
  modelId: string;
  reason: string;
}

export interface RoutingConfig {
  rules: RoutingRule[];
  fallbackModelId: string;
  fallbackReason: string;
}

export interface TestCase {
  id: string;
  query: string;
  expects: string[];
}

export const DEFAULT_CONFIG: RoutingConfig = {
  rules: [
    {
      id: "r-pii",
      keywords: ["nric", "uen"],
      modelId: "claude-haiku-4-5-20251001",
      reason: "pii-sensitive",
    },
    {
      id: "r-personal",
      keywords: ["should i", "will i", "my income", "my salary", "my company", "my business"],
      modelId: "claude-haiku-4-5-20251001",
      reason: "personalised-advice",
    },
    {
      id: "r-factual",
      keywords: ["what is", "what are", "deadline", "rate", "threshold", "cap"],
      modelId: "gpt-4o-mini",
      reason: "factual-lookup",
    },
  ],
  fallbackModelId: "claude-haiku-4-5-20251001",
  fallbackReason: "default",
};

export const DEFAULT_CASES: TestCase[] = [
  { id: "c1", query: "What is the GST registration threshold?", expects: ["1,000,000", "turnover"] },
  { id: "c2", query: "What is the corporate income tax rate?", expects: ["17%"] },
  { id: "c3", query: "When is the income tax filing deadline?", expects: ["18 April"] },
  { id: "c4", query: "What is the SRS contribution cap?", expects: ["15,300"] },
];

export interface RouteResult {
  modelId: string;
  reason: string;
}

/** First rule whose any keyword appears in the query wins; else the fallback. */
export function applyRoutingRules(cfg: RoutingConfig, query: string): RouteResult {
  const q = query.toLowerCase();
  for (const rule of cfg.rules) {
    if (rule.keywords.some((k) => k.trim() && q.includes(k.toLowerCase().trim()))) {
      return { modelId: rule.modelId, reason: rule.reason };
    }
  }
  return { modelId: cfg.fallbackModelId, reason: cfg.fallbackReason };
}

// ---- validation + storage ----

export const RoutingConfigSchema = z.object({
  rules: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        keywords: z.array(z.string().max(60)).max(12),
        modelId: z.string().min(1).max(80),
        reason: z.string().min(1).max(60),
      }),
    )
    .max(12),
  fallbackModelId: z.string().min(1).max(80),
  fallbackReason: z.string().min(1).max(60),
});

export const TestCasesSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      query: z.string().min(1).max(500),
      expects: z.array(z.string().min(1).max(80)).max(8),
    }),
  )
  .max(8);

const CONFIG_KEY = "iras-routing-config";
const CASES_KEY = "iras-eval-cases";

export function loadConfig(): RoutingConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const parsed = RoutingConfigSchema.safeParse(
      JSON.parse(localStorage.getItem(CONFIG_KEY) ?? "null"),
    );
    return parsed.success ? parsed.data : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(cfg: RoutingConfig): void {
  if (typeof window !== "undefined") localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function loadCases(): TestCase[] {
  if (typeof window === "undefined") return DEFAULT_CASES;
  try {
    const parsed = TestCasesSchema.safeParse(
      JSON.parse(localStorage.getItem(CASES_KEY) ?? "null"),
    );
    return parsed.success ? parsed.data : DEFAULT_CASES;
  } catch {
    return DEFAULT_CASES;
  }
}

export function saveCases(cases: TestCase[]): void {
  if (typeof window !== "undefined") localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}
