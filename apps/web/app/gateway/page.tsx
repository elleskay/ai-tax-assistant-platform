import { EmptyState, PAGE_CLASS, PageHeader } from "@/components/page-header";
import { listGatewayCalls } from "@/lib/gateway-store";
import { activeWorkspace } from "@/lib/tenant";

// Reads the request log at request time, never at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gateway - AI Tax Assistant Platform",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-SG", {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: "Asia/Singapore",
    });
  } catch {
    return iso;
  }
}

function formatCost(usd: number) {
  if (usd === 0) return "$0";
  if (usd < 0.0001) return "<$0.0001";
  return `$${usd.toFixed(4)}`;
}

export default async function GatewayPage() {
  const calls = await listGatewayCalls(50, await activeWorkspace());

  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow="Workspace"
        title="AI Gateway"
        description="Every model call: latency, tokens, cost, fallback. Last 50."
      />

      <div className="mt-12">
        {calls.length === 0 ? (
          <EmptyState data-testid="empty-gateway" title="No calls yet">
            Ask the assistant something, then refresh.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-card">
            <table data-testid="gateway-calls" className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">Time</th>
                  <th scope="col" className="px-5 py-3 font-medium">Model</th>
                  <th scope="col" className="px-5 py-3 font-medium">Kind</th>
                  <th scope="col" className="px-5 py-3 font-medium">Route</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Tokens in/out</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Latency</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr
                    key={c.id}
                    data-testid="gateway-call"
                    className="border-b transition-colors last:border-0 hover:bg-accent"
                  >
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-foreground">
                      {formatTime(c.timestamp)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {c.modelLabel}
                      {c.fallbackUsed ? (
                        <span className="ml-2 rounded-full bg-warning px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
                          fallback
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.kind}</td>
                    <td className="max-w-48 truncate px-5 py-3 font-mono text-xs text-muted-foreground">
                      {c.route ?? ""}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-[13px] tabular-nums">
                      {c.inputTokens.toLocaleString()} / {c.outputTokens.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-[13px] tabular-nums">
                      {c.latencyMs.toLocaleString()} ms
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-[13px] tabular-nums">
                      {formatCost(c.costUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
