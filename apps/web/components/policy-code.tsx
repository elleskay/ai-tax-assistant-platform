"use client";

import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/page-header";
import { JsonCode } from "@/components/tone";
import {
  DEFAULT_CONFIG,
  ROUTING_CONFIG_CHANGED,
  loadConfig,
  type RoutingConfig,
} from "@/lib/routing-rules";
import type { GovernancePolicy } from "@/lib/governance";

/*
 * The full effective policy as code: the closing "governance-as-code" artifact
 * for the Policy tab. Guardrails come from the server (the saved platform
 * policy, passed in); routing is read live from the browser so it reflects edits
 * made in the routing table above. It re-reads on the routing-changed event so
 * the JSON stays in sync as rules are edited.
 */
export function PolicyCode({ policy }: { policy: GovernancePolicy }) {
  // Start from DEFAULT_CONFIG so SSR and first client render match; the real
  // (possibly edited) config is read from localStorage after mount.
  const [routing, setRouting] = useState<RoutingConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const sync = () => setRouting(loadConfig());
    sync();
    window.addEventListener(ROUTING_CONFIG_CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ROUTING_CONFIG_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const effective = {
    version: policy.version,
    updated: policy.updated,
    guardrails: policy.guardrails,
    routing,
  };

  return (
    <section>
      <SectionHeading
        title="Policy as code"
        description="Saved guardrails plus this browser's routing."
      />
      <pre className="dark max-h-96 overflow-auto rounded-xl bg-background p-5 font-mono text-xs leading-relaxed text-foreground ring-1 ring-border">
        <JsonCode value={JSON.stringify(effective, null, 2)} />
      </pre>
    </section>
  );
}
