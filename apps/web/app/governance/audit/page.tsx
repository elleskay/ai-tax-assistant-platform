import { AuditTable } from "@/components/audit-table";
import { PAGE_CLASS, PageHeader } from "@/components/page-header";
import {
  buildAuditTrail,
  getEffectivePolicy,
  loadPlatformActivity,
} from "@/lib/governance";

// Reads the live stores at request time, never at build time.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Audit Trail - AI Tax Assistant Platform",
};

export default async function AuditPage() {
  const { calls, runs, promptVersions } = await loadPlatformActivity();
  const policy = await getEffectivePolicy();
  const audit = buildAuditTrail(
    { calls, runs, promptVersions },
    policy.guardrails.costCeiling.usdPerCall,
  );

  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow="Platform"
        title="AI Audit Trail"
        description="Every call, run, and change. Newest first."
      />
      <div className="mt-12">
        <AuditTable entries={audit} />
      </div>
    </main>
  );
}
