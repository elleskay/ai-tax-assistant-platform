"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { Check, ChevronsUpDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { popoverItemClass, popoverListClass } from "@/components/ui/select";
import {
  readWorkspaceCookie,
  setWorkspaceCookie,
} from "@/lib/workspace-cookie";

interface Ws {
  id: string;
  name: string;
}

/**
 * Active-workspace switcher (one workspace per tax type). No auth: selecting a
 * workspace sets the `workspace` cookie, which is sent with every request, so
 * server pages and /api/chat scope to it, then reloads. Mirrors to localStorage
 * for client code that reads the active workspace directly. A styled menu
 * rather than a native <select>, whose popup the browser draws in OS style.
 */
export function WorkspaceSwitcher() {
  const [list, setList] = useState<Ws[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((d: { workspaces?: Ws[] }) => {
        if (!alive) return;
        const ws = d.workspaces ?? [];
        setList(ws);
        // No cookie yet: show the server's default workspace (lib/workspaces
        // DEFAULT_WORKSPACE = "individual-income"), not the first in the list,
        // so the switcher matches the workspace the backend actually uses.
        const fallback = ws.some((w) => w.id === "individual-income")
          ? "individual-income"
          : (ws[0]?.id ?? "");
        setActive(readWorkspaceCookie() ?? fallback);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function change(id: string) {
    if (id === active) return;
    setWorkspaceCookie(id);
    setActive(id);
    location.reload();
  }

  if (list.length === 0) return null;
  const current = list.find((w) => w.id === active);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Active department workspace: ${current?.name ?? "none"}`}
        className="group flex h-9 w-full items-center gap-2 rounded-full bg-secondary px-3.5 text-[13px] font-medium text-foreground outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring/60 data-[state=open]:bg-secondary/70"
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {current?.name ?? "Select a workspace"}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className={cn(popoverListClass, "min-w-(--radix-dropdown-menu-trigger-width)")}
        >
          <DropdownMenu.Label className="px-3 pb-1 pt-2 text-xs text-muted-foreground">
            Workspaces
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={active} onValueChange={change}>
            {list.map((w) => (
              <DropdownMenu.RadioItem key={w.id} value={w.id} className={popoverItemClass}>
                <span className="truncate">{w.name}</span>
                <DropdownMenu.ItemIndicator className="absolute right-2.5 flex items-center">
                  <Check className="size-4" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-border" />
          <DropdownMenu.Item asChild className={cn(popoverItemClass, "text-muted-foreground data-[highlighted]:text-foreground")}>
            <Link href="/workspaces">
              <Settings2 className="size-4" strokeWidth={1.75} />
              Manage workspaces
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
