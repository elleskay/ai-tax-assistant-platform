import { PolicyEditor } from "@/components/policy-editor";
import { PolicyCode } from "@/components/policy-code";
import { RoutingRules } from "@/components/routing-rules";
import { PAGE_CLASS, PageHeader } from "@/components/page-header";
import { getEffectivePolicy } from "@/lib/governance";

// Reads the live policy at request time, never at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Policy - AI Tax Assistant Platform",
};

export default async function PolicyPage() {
  const policy = await getEffectivePolicy();

  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow={`Platform · v${policy.version}`}
        title="AI Policy"
        description="Guardrails and routing, as code. One standard for every workspace."
      />

      <div className="mt-12 flex flex-col gap-14">
        <PolicyEditor policy={policy} />
        <RoutingRules />
        <PolicyCode policy={policy} />
      </div>
    </main>
  );
}
