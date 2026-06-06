import { specTest, expect } from "@platform/spec-test/vitest";
import { applyRoutingRules, DEFAULT_CONFIG } from "../../lib/routing-rules";

specTest(
  "IRAS-ROUTER-001",
  "The deterministic routing rules pick the right model per query",
  () => {
    // Factual lookups route to the cheaper OpenAI model.
    const factual = applyRoutingRules(DEFAULT_CONFIG, "What is the GST threshold?");
    expect(factual.modelId).toBe("gpt-4o-mini");
    expect(factual.reason).toBe("factual-lookup");

    // Personalised intent routes to Anthropic.
    const personal = applyRoutingRules(DEFAULT_CONFIG, "Should I contribute to SRS?");
    expect(personal.modelId).toBe("claude-haiku-4-5-20251001");
    expect(personal.reason).toBe("personalised-advice");

    // PII (NRIC/UEN) routes to Anthropic.
    const pii = applyRoutingRules(DEFAULT_CONFIG, "My NRIC is on the form");
    expect(pii.reason).toBe("pii-sensitive");

    // No signal falls back.
    const fallback = applyRoutingRules(DEFAULT_CONFIG, "tell me about taxes");
    expect(fallback.reason).toBe("default");
  },
  { category: "data" },
);
