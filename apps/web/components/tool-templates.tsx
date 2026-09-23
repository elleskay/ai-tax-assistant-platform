"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Plus, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIND_TONE, Tag } from "@/components/tone";
import {
  loadCustomTools,
  saveCustomTools,
  CUSTOM_TOOLS_CHANGED,
  MAX_CUSTOM_TOOLS,
  type CustomTool,
} from "@/lib/custom-tools";
import { TOOL_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/tool-templates";

function genId() {
  return `t_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

const kindLabel: Record<CustomTool["kind"], string> = {
  lookup: "Lookup table",
  template: "Message template",
  code: "Calculator (sandboxed)",
};

export function ToolTemplates() {
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);

  useEffect(() => {
    const reload = () => setAddedNames(new Set(loadCustomTools().map((t) => t.name)));
    reload();
    // Stay in sync when tools change elsewhere (the "Your tools" tab, another add).
    window.addEventListener(CUSTOM_TOOLS_CHANGED, reload);
    return () => window.removeEventListener(CUSTOM_TOOLS_CHANGED, reload);
  }, []);

  function remove(tool: CustomTool) {
    const next = loadCustomTools().filter((t) => t.name !== tool.name);
    saveCustomTools(next);
    setAddedNames(new Set(next.map((t) => t.name)));
    if (justAdded === tool.name) setJustAdded(null);
    setLimitHit(false);
  }

  function use(tool: CustomTool) {
    const current = loadCustomTools();
    if (current.some((t) => t.name === tool.name)) {
      setAddedNames(new Set(current.map((t) => t.name)));
      setJustAdded(tool.name);
      return;
    }
    if (current.length >= MAX_CUSTOM_TOOLS) {
      setLimitHit(true);
      return;
    }
    const next = [...current, { ...tool, id: genId() }];
    saveCustomTools(next);
    setAddedNames(new Set(next.map((t) => t.name)));
    setJustAdded(tool.name);
    setLimitHit(false);
  }

  return (
    <section className="mt-8" data-testid="tool-templates">
      <p className="mb-5 text-sm text-muted-foreground">
        One click to add. Governed by default.{" "}
        <Link
          href="/governance"
          className="text-foreground underline underline-offset-4"
        >
          See governance
        </Link>
      </p>

      {justAdded ? (
        <div
          role="status"
          className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-success/10 px-4 py-3 text-sm text-foreground"
        >
          <Check className="h-4 w-4 text-success" />
          <span>
            <span className="font-mono font-medium">{justAdded}</span> is live.
          </span>
          <Link
            href="/assistant"
            className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
          >
            Try it <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      {limitHit ? (
        <p role="alert" className="mb-5 text-sm text-destructive">
          Limit of {MAX_CUSTOM_TOOLS} tools reached. Delete one to add another.
        </p>
      ) : null}

      <div className="flex flex-col gap-10">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const items = TOOL_TEMPLATES.filter((t) => t.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="mb-3 text-base">{cat}</h2>
              <ul className="overflow-hidden rounded-lg bg-card">
                {items.map(({ tool, blurb }) => {
                  const added = addedNames.has(tool.name);
                  return (
                    <li
                      key={tool.id}
                      className="flex flex-col gap-3 border-b px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                          <span className="font-mono text-sm font-medium text-[var(--syn-fn)]">
                            {tool.name}
                          </span>
                          <Tag tone={KIND_TONE[tool.kind]}>{kindLabel[tool.kind]}</Tag>
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{blurb}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={added ? "ghost" : "secondary"}
                        onClick={() => (added ? remove(tool) : use(tool))}
                        className={
                          added
                            ? "group/tpl w-32 shrink-0 text-success hover:bg-destructive/10 hover:text-destructive"
                            : "w-32 shrink-0"
                        }
                        aria-label={
                          added ? `Remove template ${tool.name}` : `Use template ${tool.name}`
                        }
                        title={added ? "Added to your tools. Click to remove." : undefined}
                      >
                        {added ? (
                          <>
                            <Check className="h-4 w-4 group-hover/tpl:hidden" />
                            <X className="hidden h-4 w-4 group-hover/tpl:block" />
                            <span className="group-hover/tpl:hidden">Added</span>
                            <span className="hidden group-hover/tpl:inline">Remove</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" /> Add
                          </>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
