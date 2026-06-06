import { generateText, Output, type LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { anthropic } from "./agent";
import {
  MODELS,
  CLASSIFIER_ID,
  DEFAULT_MODEL_ID,
  findModel,
  type ModelEntry,
} from "./model-registry";

/*
 * The router. The cheapest model (CLASSIFIER_ID) reads the query and picks the
 * cheapest model from the registry that can answer it well. Deterministic
 * fallback to a safe cheap model if the classifier is unavailable or returns
 * something unexpected (e.g. no OpenAI key locally).
 */

export interface RouteDecision {
  entry: ModelEntry;
  reason: string;
}

const schema = z.object({
  modelId: z.string(),
  reason: z.string(),
});

export async function chooseModel(query: string): Promise<RouteDecision> {
  const fallback: RouteDecision = {
    entry: findModel(DEFAULT_MODEL_ID)!,
    reason: "Default cheap model (router unavailable).",
  };
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const catalog = MODELS.map(
      (m) => `- ${m.id} (${m.tier}, cost ${m.costRank}): ${m.use}`,
    ).join("\n");
    const result = await generateText({
      model: openai(CLASSIFIER_ID),
      temperature: 0,
      maxOutputTokens: 200,
      output: Output.object({ schema }),
      prompt:
        `You route queries for a Singapore tax FAQ assistant to the cheapest capable model.\n` +
        `Prefer the cheapest models for simple or factual questions. Choose a balanced or ` +
        `premium model only when the query is genuinely complex, ambiguous, or high-stakes.\n\n` +
        `Models (cheaper = lower cost):\n${catalog}\n\n` +
        `Query: """${query}"""\n\n` +
        `Reply with the exact modelId to use and a one-sentence reason.`,
    });
    const out = result.output as z.infer<typeof schema>;
    const entry = findModel(out.modelId);
    if (!entry) return fallback;
    return { entry, reason: out.reason || "Routed." };
  } catch {
    return fallback;
  }
}

/** Resolve a registry entry to an AI SDK model instance. */
export function resolveModel(entry: ModelEntry): LanguageModel {
  return entry.provider === "openai" ? openai(entry.id) : anthropic(entry.id);
}
