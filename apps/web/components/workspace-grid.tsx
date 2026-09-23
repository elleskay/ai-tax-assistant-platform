"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { SERIES, Tag, fillClass } from "@/components/tone";

/** First and last initials: "Individual Income Tax" -> "IT". */
const monogram = (name: string) => {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};
import {
  readWorkspaceCookie,
  setWorkspaceCookie,
} from "@/lib/workspace-cookie";

interface Ws {
  id: string;
  name: string;
  seed?: boolean;
}

/**
 * Workspaces-page list. Opening a workspace sets the active
 * cookie and navigates into the assistant. Custom workspaces can be deleted;
 * the seeded example workspaces (seed: true) cannot.
 */
export function WorkspaceGrid() {
  const [list, setList] = useState<Ws[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    // Mirror the switcher: no cookie yet means the server default workspace.
    setActiveId(readWorkspaceCookie() ?? "individual-income");
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((d: { workspaces?: Ws[] }) => setList(d.workspaces ?? []))
      .catch(() => {});
  }, []);

  function open(id: string) {
    setWorkspaceCookie(id);
    // Full navigation so the cookie is re-read server-side and the layout
    // (workspace switcher, etc.) remounts on the chosen workspace. ?new=1 opens
    // a fresh chat rather than resuming this workspace's last conversation.
    window.location.assign("/assistant?new=1");
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete the "${name}" workspace? This cannot be undone.`))
      return;
    try {
      const res = await fetch("/api/workspaces", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        // Do not remove the card optimistically: a failed delete would
        // resurrect it on the next refresh with no feedback.
        window.alert("Could not delete the workspace. Please try again.");
        return;
      }
    } catch {
      window.alert("Could not delete the workspace. Check your connection.");
      return;
    }
    setList((l) => l.filter((w) => w.id !== id));
    // If the deleted workspace was active, fall back to the flagship.
    if (readWorkspaceCookie() === id) setWorkspaceCookie("individual-income");
  }

  if (list.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {list.map((w, i) => (
        <li key={w.id} className="relative flex items-center overflow-hidden rounded-lg bg-card">
          <button
            onClick={() => open(w.id)}
            className="group flex min-h-36 min-w-0 flex-1 flex-col justify-between gap-6 p-6 text-left transition-colors hover:bg-card/70"
          >
            <span className="min-w-0">
              {/* Monogram in the workspace's series color. */}
              <span
                aria-hidden
                className={`mb-4 flex size-9 items-center justify-center rounded-full text-sm font-semibold text-background ${fillClass(SERIES[i % SERIES.length])}`}
              >
                {monogram(w.name)}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-xl tracking-tight">{w.name}</span>
                {w.id === activeId ? <Tag tone="sunset">Current</Tag> : null}
              </span>
              <span className="mt-1 block font-mono text-xs text-muted-foreground">
                {w.id}
                {w.seed ? " · example" : ""}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground">
              Open
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
          {w.seed ? null : (
            <button
              type="button"
              onClick={() => remove(w.id, w.name)}
              aria-label={`Delete ${w.name} workspace`}
              title="Delete workspace"
              className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
