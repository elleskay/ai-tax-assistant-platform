import { specTest, expect } from "@platform/spec-test/vitest";
import { routeQuery } from "../../lib/router";

specTest(
  "IRAS-ROUTER-001",
  "The model router picks the right model per query",
  () => {
    // PII (NRIC / UEN) stays on Anthropic.
    expect(routeQuery("My NRIC is S1234567A").reason).toBe("pii-sensitive");
    expect(routeQuery("My NRIC is S1234567A").provider).toBe("anthropic");
    expect(routeQuery("UEN 200312345A query").reason).toBe("pii-sensitive");

    // Personalised intent goes to Anthropic.
    expect(routeQuery("Should I contribute to SRS?").reason).toBe("personalised-advice");
    expect(routeQuery("Should I contribute to SRS?").provider).toBe("anthropic");

    // Plain factual lookups go to the cheaper OpenAI model.
    expect(routeQuery("What is the GST threshold?").reason).toBe("factual-lookup");
    expect(routeQuery("What is the GST threshold?").provider).toBe("openai");

    // Otherwise default to Anthropic.
    expect(routeQuery("Tell me about Singapore taxes").reason).toBe("default");
  },
  { category: "data" },
);
