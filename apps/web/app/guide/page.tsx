import Link from "next/link";
import {
  MessageSquare,
  Wrench,
  BarChart3,
  Gauge,
  FileText,
  ShieldCheck,
  Plug,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "IRAS Tax Assistant - guide",
};

/*
 * Step-by-step instructions for every page, with what to expect at each step.
 * Server component, pure content; the e2e asserts one section per page.
 */

interface Section {
  id: string;
  href: string;
  icon: typeof MessageSquare;
  title: string;
  intro: string;
  steps: string[];
}

const SECTIONS: Section[] = [
  {
    id: "assistant",
    href: "/assistant",
    icon: MessageSquare,
    title: "Assistant",
    intro:
      "A multi-step tax agent. Every reply shows which model answered, the tokens and cost, and (when tools ran) a numbered step trace.",
    steps: [
      "Click a chip or ask a question, e.g. \"What is the GST registration threshold?\". The reply cites SGD 1,000,000 and the badge under it reads \"Routed to GPT-4o mini\" with tokens and cost.",
      "Try the Multi-step chip (GST threshold plus your estimate in one question). The reply shows \"Agent steps (2)\": expand it to see lookup_tax_info then calculate_tax_estimate with each input and output.",
      "Ask \"Should I contribute to SRS this year?\". Personalised questions route to Claude Sonnet 4.6 and escalate to the advisor queue with a case number.",
      "Ask a question containing an NRIC (the PII chip). It routes to Claude Haiku 4.5 under the pii-sensitive rule.",
      "Use New chat to start over; the previous conversation stays in the history sidebar (stored in this browser only).",
    ],
  },
  {
    id: "tools",
    href: "/tools",
    icon: Wrench,
    title: "MCP tools",
    intro:
      "The tools the assistant calls, plus a builder for your own. Three example tools are preloaded so you can run one immediately.",
    steps: [
      "Run the built-in lookup with topic GST: the deterministic fact appears, including the SGD 1,000,000 threshold.",
      "Edit a built-in tool: toggle it off, change its description, or edit the lookup facts. Your config rides along with every chat request, so the assistant honours it.",
      "Under Your tools, run the example gst_calculator with amount 100: it executes server-side in the QuickJS sandbox and returns the GST and total.",
      "Try the other examples: filing_deadlines (a lookup table) and filing_reminder (a response template). Edit or delete them freely; they are ordinary tools.",
      "Build your own with New tool. The Code (sandboxed) kind runs run(input) under a 1 second deadline and 32MB cap with no network, filesystem, or host access. Paste while(true){} to see the deadline stop it safely.",
      "Ask the assistant to use your tool by name, then expand the reply's step trace to watch it being called.",
    ],
  },
  {
    id: "evals",
    href: "/evals",
    icon: BarChart3,
    title: "Evals",
    intro:
      "A workbench for the routing rules and a graded test suite, with a persisted run history.",
    steps: [
      "Type a query into the route preview to see which model the rules would pick and why.",
      "Edit the routing rules (keywords, model, reason) and the test cases (query plus expected keywords). Both are stored in this browser.",
      "Click Run with the keyword grader: each case routes, answers, and is graded. Failed cases name the missed keywords; Show response reveals the answer.",
      "Switch the grader to LLM judge and run again: each case gets a score and a rationale, shown on the case when it fails.",
      "Pin a prompt version to evaluate an older or newer system prompt against the same cases.",
      "Every run lands in the history with a pass-rate trend bar, persisted server-side.",
    ],
  },
  {
    id: "gateway",
    href: "/gateway",
    icon: Gauge,
    title: "Gateway",
    intro:
      "Every model call in the app (chat, evals, the judge) flows through one gateway that observes and logs it.",
    steps: [
      "Send a chat message or run an eval, then open this page.",
      "Each call lists the model, latency, input and output tokens, and the USD cost computed from list prices, newest first.",
      "If a provider call fails, the gateway retries on the other provider and the entry is flagged fallbackUsed.",
    ],
  },
  {
    id: "prompts",
    href: "/prompts",
    icon: FileText,
    title: "Prompts",
    intro:
      "The assistant's system prompt is versioned: immutable versions behind an activation pointer.",
    steps: [
      "Save a new version with a visible change, e.g. \"Always answer in exactly one sentence.\"",
      "Select a version to see a line diff against its predecessor, additions and removals highlighted.",
      "Click Activate. The live assistant resolves the active version within about a minute; ask anything to see the new behaviour, then re-activate the old version to undo.",
    ],
  },
  {
    id: "admin",
    href: "/admin",
    icon: ShieldCheck,
    title: "Advisor queue",
    intro:
      "Escalations from the assistant land here for a human to resolve: the human-in-the-loop half of the agent.",
    steps: [
      "Ask the assistant a personalised question first (the SRS chip) so a case exists.",
      "The escalation is listed as pending with its reason and the original question.",
      "Click Resolve: the case flips to resolved end to end.",
    ],
  },
  {
    id: "mcp",
    href: "/tools",
    icon: Plug,
    title: "Connect over MCP",
    intro:
      "The same four tools are a real MCP server over Streamable HTTP, so any MCP client can call them without this UI.",
    steps: [
      "On the Tools page, copy the config from the Connect via MCP section (the endpoint is /api/mcp).",
      "Add it to .mcp.json in Claude Code or any MCP client, then call lookup_tax_info with topic GST.",
      "lookup and calculate are public (rate limited). escalate_to_human requires a bearer token only when the server is configured with MCP_API_KEY.",
      "Running locally? npm run mcp:stdio serves the same tools over stdio.",
    ],
  },
];

export default function GuidePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-10 pb-20">
      <header className="flex flex-col gap-3">
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from to-brand-to text-white shadow-soft"
        >
          <BookOpen className="h-6 w-6" />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-navy">
          How to use everything
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          A walkthrough of every page, in the order worth trying them. Each step
          says what to do and what you should see.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-5">
        {SECTIONS.map(({ id, href, icon: Icon, title, intro, steps }) => (
          <Card key={id} id={id} className="shadow-soft">
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold text-navy">{title}</h3>
                </div>
                <Link
                  href={href}
                  className="text-sm font-medium text-primary underline underline-offset-2"
                >
                  Open
                </Link>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{intro}</p>
              <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-foreground">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
