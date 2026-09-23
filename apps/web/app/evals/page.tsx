import { EvalsWorkbench } from "@/components/evals-workbench";
import { PAGE_CLASS, PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Evaluation - AI Tax Assistant Platform",
};

export default function EvalsPage() {
  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow="Platform"
        title="AI Evaluation"
        description="Graded test cases behind a pass-rate gate."
      />
      <div className="mt-12">
        <EvalsWorkbench />
      </div>
    </main>
  );
}
