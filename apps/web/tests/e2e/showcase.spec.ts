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
