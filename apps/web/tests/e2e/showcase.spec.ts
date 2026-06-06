import { specTest, expect } from "@platform/spec-test/playwright";

specTest(
  "IRAS-NAV-001",
  "Primary navigation links to every showcase page",
  async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Assistant", "Tools", "Evals", "Advisor queue"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
  },
  { category: "functional" },
);

specTest(
  "IRAS-TOOLS-001",
  "Tools page lists the MCP server tools",
  async ({ page }) => {
    await page.goto("/tools");
    await expect(page.getByText("lookup_tax_info")).toBeVisible();
    await expect(page.getByText("calculate_tax_estimate")).toBeVisible();
    await expect(page.getByText("escalate_to_human")).toBeVisible();
  },
  { category: "ui" },
);

specTest(
  "IRAS-TOOLS-002",
  "A visitor can run the lookup tool and see a result",
  async ({ page }) => {
    await page.goto("/tools");
    // The lookup tool is the first tool, pre-filled with "GST".
    await page.getByRole("button", { name: "Run" }).first().click();
    await expect(page.getByTestId("tool-result").first()).toContainText("1,000,000");
  },
  { category: "functional" },
);

specTest(
  "IRAS-TOOLS-003",
  "A visitor can create a custom tool and run it",
  async ({ page }) => {
    await page.goto("/tools");
    await page.getByRole("button", { name: "New tool" }).click();
    await page.getByLabel("Tool name").fill("greeting_tool");
    await page.getByLabel("Tool description").fill("Greets by keyword");
    await page.getByLabel("Keyword 1").fill("hi");
    await page.getByLabel("Answer 1").fill("Hello there");
    await page.getByRole("button", { name: "Save tool" }).click();

    const card = page.locator('[data-testid="custom-tool"][data-name="greeting_tool"]');
    await expect(card).toBeVisible();
    await card.getByLabel("query").fill("hi");
    await card.getByRole("button", { name: "Run" }).click();
    await expect(card.getByTestId("custom-tool-result")).toContainText("Hello there");
  },
  { category: "functional" },
);

specTest(
  "IRAS-EVAL-002",
  "The router playground shows the routed model for a query",
  async ({ page }) => {
    // The router is a live model call, so stub /api/route with a fixed decision.
    await page.route("**/api/route", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          model: "Claude Haiku 4.5",
          modelId: "claude-haiku-4-5-20251001",
          provider: "anthropic",
          tier: "cheap",
          reason: "Simple factual query, cheapest capable model.",
        },
      });
    });
    await page.goto("/evals");
    await page.getByLabel("Query to route").fill("What is the GST threshold?");
    await page.getByRole("button", { name: "Route" }).click();
    const result = page.getByTestId("route-result");
    await expect(result).toContainText("Claude Haiku 4.5");
    await expect(result).toContainText("cheapest capable model");
  },
  { category: "functional" },
);

specTest(
  "IRAS-EVAL-003",
  "The eval runner reports PASS or FAIL for a check",
  async ({ page }) => {
    // Live model call, so stub the API with a fixed graded result.
    await page.route("**/api/eval", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          answer: "The GST registration threshold is SGD 1,000,000 in taxable turnover.",
          checks: [
            { keyword: "1,000,000", pass: true },
            { keyword: "turnover", pass: true },
          ],
          pass: true,
        },
      });
    });
    await page.goto("/evals");
    await page.getByLabel("Eval question").fill("What is the GST threshold?");
    await page.getByLabel("Expected keywords").fill("1,000,000, turnover");
    await page.getByRole("button", { name: "Run check" }).click();
    await expect(page.getByTestId("eval-verdict")).toHaveText(/PASS/);
  },
  { category: "functional" },
);

specTest(
  "IRAS-EVAL-001",
  "Evals page shows the pass rate and the models compared",
  async ({ page }) => {
    await page.goto("/evals");
    await expect(page.getByText("85%").first()).toBeVisible();
    await expect(page.getByText("Anthropic Claude Haiku 4.5").first()).toBeVisible();
    await expect(page.getByText("OpenAI GPT-4o mini").first()).toBeVisible();
  },
  { category: "ui" },
);
