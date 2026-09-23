"use client";

import { useCallback, useEffect, useState } from "react";
import { diffLines } from "diff";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyState,
  PAGE_CLASS,
  PageHeader,
  SectionHeading,
} from "@/components/page-header";
import { cn } from "@/lib/utils";

interface PromptVersion {
  version: number;
  content: string;
  note?: string;
  createdAt: string;
}

interface PromptRecord {
  name: string;
  activeVersion: number;
  versions: PromptVersion[];
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Singapore",
    });
  } catch {
    return iso;
  }
}

/*
 * Line diff of a selected version against the one before it (the first
 * version diffs against empty, so every line shows as added).
 */
function VersionDiff({
  prompt,
  version,
}: {
  prompt: PromptRecord;
  version: number;
}) {
  const sorted = [...prompt.versions].sort((a, b) => a.version - b.version);
  const idx = sorted.findIndex((v) => v.version === version);
  if (idx === -1) return null;
  const current = sorted[idx];
  const previous = idx > 0 ? sorted[idx - 1] : null;
  const parts = diffLines(previous?.content ?? "", current.content);

  return (
    <div
      data-testid="prompt-diff"
      className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-card"
    >
      <p className="border-b px-5 py-3 font-mono text-xs text-muted-foreground">
        {previous
          ? `Diff: v${previous.version} to v${current.version}`
          : `v${current.version} (first version)`}
      </p>
      <pre className="max-h-96 overflow-auto py-3 font-mono text-xs leading-5">
        {parts.flatMap((part, i) => {
          const op = part.added ? "add" : part.removed ? "del" : "same";
          const lines = part.value.replace(/\n$/, "").split("\n");
          return lines.map((line, j) => (
            <div
              key={`${i}-${j}`}
              data-testid="diff-line"
              data-op={op}
              className={cn(
                "whitespace-pre-wrap px-5",
                op === "add"
                  ? "bg-success/10 text-foreground"
                  : op === "del"
                    ? "bg-destructive/8 text-muted-foreground line-through"
                    : "text-muted-foreground",
              )}
            >
              <span className="mr-2 inline-block w-2 select-none font-semibold">
                {op === "add" ? "+" : op === "del" ? "-" : " "}
              </span>
              {line}
            </div>
          ));
        })}
      </pre>
    </div>
  );
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [activating, setActivating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("assistant-system");
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/prompts", { cache: "no-store" });
      const data = await res.json();
      setPrompts(data.prompts ?? []);
    } catch {
      setPrompts([]);
    } finally {
      // Without this a failed fetch left the page on "Loading instructions..."
      // forever.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveVersion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          content,
          ...(note ? { note } : {}),
        }),
      });
      if (!res.ok) {
        setFormError(
          "Could not save. Use a lowercase, hyphenated name (like assistant-system) and some content.",
        );
        return;
      }
      setContent("");
      setNote("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function activate(promptName: string, version: number) {
    setActivating(`${promptName}:${version}`);
    try {
      const res = await fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: promptName, version }),
      });
      if (!res.ok) {
        setFormError("Could not activate that version. Please try again.");
        return;
      }
      await load();
    } catch {
      setFormError("Could not activate that version. Check your connection.");
    } finally {
      setActivating(null);
    }
  }

  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow="Workspace"
        title="AI Instructions"
        description="The system prompt behind every answer. Versioned, one active."
      />

      <div className="mt-8 flex flex-col gap-12">
        {/* Existing prompts */}
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading instructions...
          </p>
        ) : prompts.length === 0 ? (
          <EmptyState data-testid="empty-prompts" title="Using the built-in default">
            Save a version below to manage it here.
          </EmptyState>
        ) : (
          prompts.map((p) => {
            const sorted = [...p.versions].sort((a, b) => b.version - a.version);
            const selectedVersion = selected[p.name] ?? p.activeVersion;
            return (
              <section key={p.name} data-testid="prompt" data-name={p.name}>
                <SectionHeading
                  title={<span className="font-mono text-[14px]">{p.name}</span>}
                  description={`${p.versions.length} version${p.versions.length === 1 ? "" : "s"}`}
                />
                <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                  <ul className="flex flex-col self-start overflow-hidden rounded-lg bg-card">
                    {sorted.map((v) => {
                      const isActive = v.version === p.activeVersion;
                      const isSelected = v.version === selectedVersion;
                      const key = `${p.name}:${v.version}`;
                      return (
                        <li
                          key={v.version}
                          data-testid="prompt-version"
                          data-version={v.version}
                          data-active={isActive}
                          className={cn(
                            "relative flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-5 py-3 last:border-0",
                            isSelected &&
                              "bg-accent before:absolute before:inset-y-2 before:left-0 before:w-[2px] before:rounded-full before:bg-foreground",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelected((s) => ({ ...s, [p.name]: v.version }))
                            }
                            aria-pressed={isSelected}
                            className="font-mono text-sm font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            v{v.version}
                          </button>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => activate(p.name, v.version)}
                              disabled={activating === key}
                            >
                              {activating === key ? "Activating..." : "Activate"}
                            </Button>
                          )}
                          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                            {formatTime(v.createdAt)}
                          </span>
                          {v.note ? (
                            <span className="w-full text-xs text-muted-foreground">
                              {v.note}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>

                  <VersionDiff prompt={p} version={selectedVersion} />
                </div>
              </section>
            );
          })
        )}

        {/* New version form */}
        <section>
          <SectionHeading
            title="New version"
            description="Save, then activate to go live."
          />
          <form
            onSubmit={saveVersion}
            className="flex flex-col gap-5 rounded-lg bg-card p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Prompt name
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="assistant-system"
                  className="font-mono"
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Note
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What changed (optional)"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              Prompt content
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="You are an AI assistant for a tax officer..."
                rows={6}
                className="font-mono text-[13px] leading-relaxed md:text-[13px]"
                required
              />
            </label>
            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            ) : null}
            <Button type="submit" disabled={saving} className="self-start">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save version"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
