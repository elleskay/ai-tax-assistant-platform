"use client";

import { useState, type ReactNode } from "react";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  ListOrderedIcon,
  XCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Numbered trace of the agent's tool steps inside one assistant reply.
 * Collapsed by default (the answer is the point; the trace is the proof).
 * Each step shows the tool name, its input, and its output, in the order
 * the agent ran them.
 */

export type ToolPart = ToolUIPart | DynamicToolUIPart;

const statusLabels: Record<ToolPart["state"], string> = {
  "approval-requested": "Awaiting Approval",
  "approval-responded": "Responded",
  "input-available": "Running",
  "input-streaming": "Pending",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

const statusIcons: Record<ToolPart["state"], ReactNode> = {
  "approval-requested": <ClockIcon className="size-3.5 text-warning-foreground" />,
  "approval-responded": <CheckCircleIcon className="size-3.5 text-primary" />,
  "input-available": <ClockIcon className="size-3.5 animate-pulse" />,
  "input-streaming": <CircleIcon className="size-3.5" />,
  "output-available": <CheckCircleIcon className="size-3.5 text-success" />,
  "output-denied": <XCircleIcon className="size-3.5 text-warning-foreground" />,
  "output-error": <XCircleIcon className="size-3.5 text-destructive" />,
};

export const getStatusBadge = (status: ToolPart["state"]) => (
  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
    {statusIcons[status]}
    {statusLabels[status]}
  </span>
);

function toolName(part: ToolPart): string {
  if (part.type === "dynamic-tool") return part.toolName;
  return part.type.split("-").slice(1).join("-");
}

function asText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

/** The numbered list of tool steps. Reused inline (collapsible) and in the
 *  inspector panel (always shown). */
export function StepList({
  parts,
  className,
}: {
  parts: ToolPart[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {parts.map((part, i) => (
        <li key={part.toolCallId ?? i} data-testid="step" className="flex gap-2.5">
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[11px] text-muted-foreground">
            {i + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[13px] font-medium text-heading">
                {toolName(part)}
              </span>
              {getStatusBadge(part.state)}
            </span>
            {part.input !== undefined ? (
              <pre
                data-testid="step-input"
                className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted px-2.5 py-2 font-mono text-[11.5px] leading-relaxed text-muted-foreground"
              >
                {asText(part.input)}
              </pre>
            ) : null}
            {part.state === "output-available" ? (
              <pre
                data-testid="step-output"
                className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted px-2.5 py-2 font-mono text-[11.5px] leading-relaxed text-foreground"
              >
                {asText(part.output)}
              </pre>
            ) : null}
            {part.state === "output-error" ? (
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-destructive/10 px-2.5 py-2 font-mono text-[11.5px] text-destructive">
                {part.errorText}
              </pre>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function StepTrace({
  parts,
  className,
}: {
  parts: ToolPart[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (parts.length === 0) return null;

  return (
    <div
      data-testid="step-trace"
      className={cn("not-prose my-1 w-full rounded-lg bg-card text-sm", className)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 rounded-lg px-3.5 py-2.5 transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <ListOrderedIcon className="size-3.5 text-muted-foreground" />
          Agent steps ({parts.length})
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <StepList parts={parts} className="border-t px-3.5 py-3" /> : null}
    </div>
  );
}
