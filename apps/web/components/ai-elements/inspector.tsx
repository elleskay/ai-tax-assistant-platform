"use client";

import { isToolUIPart, type UIMessage } from "ai";
import { BookOpenIcon, ListOrderedIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StepList } from "./step-trace";
import { SourceList, collectSources } from "./citations";
import type { ToolPart } from "./step-trace";

/*
 * Inspector panel beside the chat: the agent's tool steps for the active answer
 * on top, the cited document sources below. Clicking a [n] in the answer flashes
 * the matching source row here (see flashCite / makeCiteComponents). Reuses the
 * same StepList and SourceList the inline (mobile) rendering uses.
 */

function PanelSection({
  title,
  icon,
  count,
  className,
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <h2 className="flex shrink-0 items-center gap-2 px-5 pb-2 pt-3 text-xs font-medium text-muted-foreground">
        {icon}
        {title}
        {count > 0 ? (
          <span className="ml-auto font-mono text-[11px] tabular-nums">{count}</span>
        ) : null}
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
    </section>
  );
}

function PanelEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="py-1 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

export function Inspector({ message }: { message: UIMessage | null }) {
  const toolParts = (message?.parts ?? []).filter(isToolUIPart) as ToolPart[];
  const sources = message ? collectSources(message.parts) : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <p className="text-sm font-medium">Details</p>
      </div>
      <PanelSection
        title="Agent steps"
        icon={<ListOrderedIcon className="size-3.5" />}
        count={toolParts.length}
      >
        {toolParts.length ? (
          <StepList parts={toolParts} />
        ) : (
          <PanelEmpty>Tool calls for the selected answer.</PanelEmpty>
        )}
      </PanelSection>
      <PanelSection
        title="Sources"
        icon={<BookOpenIcon className="size-3.5" />}
        count={sources.length}
        className="border-t"
      >
        {sources.length && message ? (
          <SourceList sources={sources} messageId={message.id} />
        ) : (
          <PanelEmpty>Passages the selected answer cites.</PanelEmpty>
        )}
      </PanelSection>
    </div>
  );
}
