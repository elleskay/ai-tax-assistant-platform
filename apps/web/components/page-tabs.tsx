"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface PageTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

/**
 * In-page tabs: a sticky bar of tab buttons over content panels. Inactive
 * panels stay mounted (hidden) so server-rendered tables and in-progress edits
 * survive switching. Styling matches the tools page tab bar (pill tabs that
 * stick under the mobile top bar, or to the top on desktop). Content is passed
 * in as already-rendered nodes, so this works for both client and server pages.
 */
export function PageTabs({
  tabs,
  ariaLabel,
}: {
  tabs: PageTab[];
  ariaLabel: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  // Support deep-linking and in-page links to a tab via the URL hash (e.g.
  // #audit). Activates the matching tab on load and on any hash change.
  // Depend on the id list, not the tabs array: callers pass inline array
  // literals, which would tear down and re-add the listener every render.
  const idKey = tabs.map((t) => t.id).join(",");
  useEffect(() => {
    const ids = new Set(idKey.split(","));
    const apply = () => {
      const id = window.location.hash.slice(1);
      if (id && ids.has(id)) setActive(id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [idKey]);

  return (
    <>
      <div className="sticky top-14 z-20 -mx-5 mt-8 bg-background/85 px-5 py-3 backdrop-blur-md md:top-0 md:-mx-10 md:px-10">
        <nav className="inline-flex flex-wrap gap-1 rounded-full bg-card p-1" aria-label={ariaLabel}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActive(t.id);
                window.history.replaceState(null, "", `#${t.id}`);
              }}
              aria-current={active === t.id ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active === t.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      {tabs.map((t) => (
        <div key={t.id} className={active === t.id ? "mt-6" : "hidden"}>
          {t.content}
        </div>
      ))}
    </>
  );
}
