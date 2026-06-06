import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * HITL (human-in-the-loop) escalation store.
 *
 * Prototype implementation backed by a JSON file on disk, mirroring the
 * hitl-queue.json approach from the original iras-mcp-server. Fine for local
 * development and demos. For production on serverless (the Lambda filesystem is
 * ephemeral and read-only outside /tmp), swap this module for a real database
 * (Postgres / Neon, the platform default). The exported API can stay the same.
 */

export type EscalationStatus = "pending" | "resolved";

export interface Escalation {
  id: number;
  timestamp: string;
  reason: string;
  original_query: string;
  status: EscalationStatus;
}

// Resolved per call (not cached) so unit tests can point at an isolated temp
// file via HITL_QUEUE_PATH without import-order gymnastics.
function queuePath(): string {
  return (
    process.env.HITL_QUEUE_PATH ??
    join(/* turbopackIgnore: true */ process.cwd(), "hitl-queue.json")
  );
}

async function readQueue(): Promise<Escalation[]> {
  try {
    const raw = await readFile(queuePath(), "utf8");
    return JSON.parse(raw) as Escalation[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: Escalation[]): Promise<void> {
  await writeFile(queuePath(), JSON.stringify(queue, null, 2), "utf8");
}

export async function addEscalation(
  reason: string,
  originalQuery: string,
): Promise<Escalation> {
  const queue = await readQueue();
  const entry: Escalation = {
    id: Date.now() + queue.length, // monotonic even within the same millisecond
    timestamp: new Date().toISOString(),
    reason,
    original_query: originalQuery,
    status: "pending",
  };
  queue.push(entry);
  await writeQueue(queue);
  return entry;
}

export async function listEscalations(): Promise<Escalation[]> {
  const queue = await readQueue();
  return queue.sort((a, b) => b.id - a.id); // most recent first
}

export async function resolveEscalation(id: number): Promise<Escalation | null> {
  const queue = await readQueue();
  const entry = queue.find((e) => e.id === id);
  if (!entry) return null;
  entry.status = "resolved";
  await writeQueue(queue);
  return entry;
}
