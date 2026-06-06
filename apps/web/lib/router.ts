/*
 * Model router, ported verbatim from llm-eval-iras/router.mjs. Deterministic and
 * free to run, so the Evals page can show routing decisions live with no model
 * call. Privacy-sensitive and personalised queries go to Anthropic; plain
 * factual lookups go to the cheaper OpenAI model.
 */

const NRIC_RE = /\b[ST]\d{7}[A-Z]\b/i;
const UEN_RE = /\b(\d{8,9}[A-Z]|[TSR]\d{2}[A-Z]{2}\d{4}[A-Z])\b/i;
const PERSONALISED_RE = /\b(should\s+i|will\s+i|how\s+much\s+will\s+i\s+pay|my\s+income)\b/i;
const FACTUAL_RE = /\b(what\s+is|what\s+are|deadline|rate|threshold)\b/i;

export type RouteReason =
  | "pii-sensitive"
  | "personalised-advice"
  | "factual-lookup"
  | "default";

export interface Route {
  provider: "anthropic" | "openai";
  model: string;
  label: string;
  reason: RouteReason;
}

export function routeQuery(query: string): Route {
  if (NRIC_RE.test(query) || UEN_RE.test(query)) {
    return {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      label: "Anthropic Claude Haiku 4.5",
      reason: "pii-sensitive",
    };
  }
  if (PERSONALISED_RE.test(query)) {
    return {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      label: "Anthropic Claude Haiku 4.5",
      reason: "personalised-advice",
    };
  }
  if (FACTUAL_RE.test(query)) {
    return {
      provider: "openai",
      model: "gpt-4o-mini",
      label: "OpenAI GPT-4o mini",
      reason: "factual-lookup",
    };
  }
  return {
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    label: "Anthropic Claude Haiku 4.5",
    reason: "default",
  };
}

export const ROUTE_REASON_TEXT: Record<RouteReason, string> = {
  "pii-sensitive": "Contains an NRIC or UEN, kept on Anthropic for privacy.",
  "personalised-advice": "Personalised intent (should I, will I, my income).",
  "factual-lookup": "Plain factual lookup, routed to the cheaper model.",
  default: "No specific signal, uses the default model.",
};
