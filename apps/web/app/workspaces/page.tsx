import { WorkspaceGrid } from "@/components/workspace-grid";
import { AddWorkspace } from "@/components/add-workspace";
import { PAGE_CLASS, PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Workspaces - AI Tax Assistant Platform",
};

export default function WorkspacesPage() {
  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow="Platform"
        title="Workspaces"
        description="One per department. Same policy for all."
      />
      <div className="mt-12 flex flex-col gap-4">
        <WorkspaceGrid />
        <AddWorkspace />
      </div>
    </main>
  );
}
