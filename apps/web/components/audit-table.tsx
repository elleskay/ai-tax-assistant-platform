"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/page-header";
import type { AuditEntry } from "@/lib/governance";

/*
 * Paginated view of the full platform audit trail. The complete event list is
 * computed server-side and passed in; this only controls how much is shown at
 * once, so every event stays reachable without rendering thousands of rows.
 */

const PAGE_SIZE = 25;

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

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [page, setPage] = useState(0);

  if (entries.length === 0) {
    return (
      <EmptyState title="Nothing recorded yet">
        Ask the assistant or run an eval, then refresh.
      </EmptyState>
    );
  }

  const pageCount = Math.ceil(entries.length / PAGE_SIZE);
  const current = Math.min(page, pageCount - 1);
  const start = current * PAGE_SIZE;
  const rows = entries.slice(start, start + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-lg bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-medium">Time</th>
              <th scope="col" className="px-5 py-3 font-medium">Workspace</th>
              <th scope="col" className="px-5 py-3 font-medium">Event</th>
              <th scope="col" className="px-5 py-3 font-medium">Detail</th>
              <th scope="col" className="px-5 py-3 font-medium">Flag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr
                key={start + i}
                className="border-b transition-colors last:border-0 hover:bg-accent"
              >
                <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-foreground">
                  {formatTime(a.ts)}
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">
                  {a.workspace ?? "n/a"}
                </td>
                <td className="px-5 py-3 text-foreground">{a.summary}</td>
                <td className="px-5 py-3 text-muted-foreground">{a.detail}</td>
                <td className="px-5 py-3">
                  {a.flag ? (
                    <span className="whitespace-nowrap rounded-full bg-warning px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
                      {a.flag}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">none</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-[13px] text-muted-foreground">
        <span className="tabular-nums">
          {start + 1}-{Math.min(start + PAGE_SIZE, entries.length)} of{" "}
          {entries.length.toLocaleString()} events
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(current - 1)}
            disabled={current === 0}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="tabular-nums">
            Page {current + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(current + 1)}
            disabled={current >= pageCount - 1}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
