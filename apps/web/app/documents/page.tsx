"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  Search,
  Trash2,
  Upload,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  Notice,
  PAGE_CLASS,
  PageHeader,
  SectionHeading,
} from "@/components/page-header";

interface Doc {
  doc_id: string;
  filename: string;
  chunk_count: number;
}
interface Chunk {
  text: string;
  score: number;
  source: { doc_id: string; filename: string; location: string };
}

export default function DocumentsPage() {
  const [enabled, setEnabled] = useState(true);
  const [reachable, setReachable] = useState(true);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Chunk[] | null>(null);
  const [searching, setSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      const data = await res.json();
      setEnabled(Boolean(data.enabled));
      setReachable(Boolean(data.reachable));
      setDocs(data.documents ?? []);
    } catch {
      // Treat a failed fetch like an unreachable service instead of surfacing
      // an unhandled rejection.
      setReachable(false);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const documents = await Promise.all(
        Array.from(files).map(async (f) => ({
          doc_id: f.name,
          filename: f.name,
          text: await f.text(),
        })),
      );
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents }),
      });
      await load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(docId: string) {
    await fetch("/api/knowledge", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id: docId }),
    });
    await load();
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/knowledge?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  const usable = enabled && reachable;

  return (
    <main id="main" className={PAGE_CLASS}>
      <PageHeader
        eyebrow="Workspace"
        title="Documents"
        description="The guidance every answer is grounded in."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".txt,.md,.markdown"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={!usable || uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Indexing..." : "Upload .txt or .md"}
            </Button>
          </>
        }
      />

      {!enabled ? (
        <Notice className="mt-10">
          Retrieval is off. Set RAG_SERVICE_URL to enable uploads and search.
        </Notice>
      ) : !reachable ? (
        <Notice tone="warning" className="mt-10">
          Retrieval service not responding. Your documents are safe; start it and
          refresh.
        </Notice>
      ) : null}

      <section className="mt-12">
        <SectionHeading title="Indexed" />
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </p>
        ) : docs.length === 0 ? (
          usable ? (
            <EmptyState title="No documents yet">Upload guidance to ground answers.</EmptyState>
          ) : (
            <EmptyState title="Unavailable">Retrieval is offline.</EmptyState>
          )
        ) : (
          <div className="overflow-x-auto rounded-lg bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">File</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Chunks</th>
                  <th scope="col" className="w-24 px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.doc_id} className="border-b last:border-0">
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-2.5 text-foreground">
                        <FileText
                          aria-hidden
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          strokeWidth={1.75}
                        />
                        <span className="truncate">{d.filename}</span>
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-[13px] tabular-nums text-muted-foreground">
                      {d.chunk_count}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <a
                          href={`/api/knowledge/download?doc_id=${encodeURIComponent(d.doc_id)}&filename=${encodeURIComponent(d.filename)}`}
                          download={d.filename}
                          aria-label={`Download ${d.filename}`}
                          title="Download"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Download className="h-4 w-4" strokeWidth={1.75} />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => remove(d.doc_id)}
                          aria-label={`Remove ${d.filename}`}
                          title="Remove"
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-14">
        <SectionHeading title="Search" description="See what retrieval would hand the assistant." />
        <form onSubmit={search} className="flex max-w-2xl gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the indexed documents"
            placeholder="Search the indexed documents"
            className="rounded-full px-4"
            disabled={!usable}
          />
          <Button type="submit" variant="secondary" className="h-10" disabled={!usable || searching}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </form>
        {results ? (
          results.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">No matches.</p>
          ) : (
            <ol className="mt-5 flex flex-col gap-2">
              {results.map((c, i) => (
                <li key={i} className="rounded-lg bg-card px-5 py-4">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      <span className="text-foreground">{c.source.filename}</span> &middot;{" "}
                      {c.source.location}
                    </span>
                    <span className="font-mono tabular-nums">{c.score.toFixed(3)}</span>
                  </div>
                  <p className="max-w-3xl text-sm leading-relaxed text-foreground/85">{c.text}</p>
                </li>
              ))}
            </ol>
          )
        ) : null}
      </section>
    </main>
  );
}
