/*
 * The models the router can pick from: current chat models across Anthropic and
 * OpenAI that these keys can use. The router picks the cheapest model that can
 * answer a query well, so cheaper models are listed with lower costRank. Legacy
 * and non-chat models (gpt-3.5, embeddings, tts, o-series reasoning, etc.) are
 * intentionally excluded.
 */

export type Provider = "openai" | "anthropic";

export interface ModelEntry {
  id: string;
  provider: Provider;
  label: string;
  tier: "cheap" | "balanced" | "premium";
  costRank: number; // relative, lower is cheaper
  use: string;
}

export const MODELS: ModelEntry[] = [
  {
    id: "gpt-4.1-nano",
    provider: "openai",
    label: "GPT-4.1 nano",
    tier: "cheap",
    costRank: 1,
    use: "very simple factual lookups, short definitions, one-line answers",
  },
  {
    id: "claude-haiku-4-5-20251001",
    provider: "anthropic",
    label: "Claude Haiku 4.5",
    tier: "cheap",
    costRank: 2,
    use: "simple or factual tax questions, and privacy-sensitive queries that mention an NRIC or UEN",
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    label: "GPT-4o mini",
    tier: "cheap",
    costRank: 2,
    use: "cheap general factual lookups",
  },
  {
    id: "gpt-4.1",
    provider: "openai",
    label: "GPT-4.1",
    tier: "balanced",
    costRank: 4,
    use: "general questions that need solid quality but not deep reasoning",
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    label: "Claude Sonnet 4.6",
    tier: "balanced",
    costRank: 5,
    use: "nuanced or multi-part explanations, and deciding whether to escalate a personal scenario",
  },
  {
    id: "claude-opus-4-8",
    provider: "anthropic",
    label: "Claude Opus 4.8",
    tier: "premium",
    costRank: 9,
    use: "the most complex, ambiguous, or high-stakes questions only",
  },
];

// The cheapest model is used as the router/classifier itself.
export const CLASSIFIER_ID = "gpt-4.1-nano";

// Safe, cheap, tool-capable fallback when the router cannot decide.
export const DEFAULT_MODEL_ID = "claude-haiku-4-5-20251001";

export function findModel(id: string): ModelEntry | undefined {
  return MODELS.find((m) => m.id === id);
}
