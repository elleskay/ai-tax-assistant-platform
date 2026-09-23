"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  Boxes,
  MessageSquare,
  Files,
  Scale,
  LayoutDashboard,
  ScrollText,
  Lightbulb,
  Wrench,
  BarChart3,
  ArrowRightLeft,
  FileText,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { ThemeToggle } from "./theme-toggle";

type NavLink = { href: string; label: string; icon: typeof Home };

// Two scopes: the selected department's workspace, then the platform-wide
// governance layer over every workspace.
const GROUPS: { label: string; workspace?: boolean; links: NavLink[] }[] = [
  {
    label: "Workspace",
    workspace: true,
    links: [
      { href: "/assistant", label: "Assistant", icon: MessageSquare },
      { href: "/documents", label: "Documents", icon: Files },
      { href: "/tools", label: "AI Tools", icon: Wrench },
      { href: "/prompts", label: "AI Instructions", icon: FileText },
      { href: "/insights", label: "Usage analytics", icon: Lightbulb },
      { href: "/gateway", label: "AI Gateway", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Platform",
    links: [
      { href: "/governance", label: "AI Dashboard", icon: LayoutDashboard },
      { href: "/governance/policy", label: "AI Policy", icon: Scale },
      { href: "/governance/audit", label: "AI Audit Trail", icon: ScrollText },
      { href: "/evals", label: "AI Evaluation", icon: BarChart3 },
      { href: "/workspaces", label: "Workspaces", icon: Boxes },
    ],
  },
];

/** The platform mark: a section sign, as in a cited clause of guidance. */
export function Mark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[15px] font-semibold leading-none text-background",
        className,
      )}
    >
      §
    </span>
  );
}

function Wordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      <Mark />
      <span
        className={cn(
          "min-w-0 truncate text-[15px] font-medium tracking-tight text-foreground transition-[opacity,width] duration-200 ease-out",
          collapsed ? "w-0 opacity-0" : "opacity-100",
        )}
      >
        Tax Assistant
      </span>
    </Link>
  );
}

function NavLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (pathname !== href && !pathname.startsWith(href + "/")) return false;
    // A parent link (e.g. /governance) must not stay active on a child route
    // that has its own nav entry (e.g. /governance/policy or /governance/audit).
    return !GROUPS.some((group) =>
      group.links.some(
        (l) =>
          l.href !== href &&
          l.href.startsWith(href + "/") &&
          (pathname === l.href || pathname.startsWith(l.href + "/")),
      ),
    );
  };

  const itemClass = (active: boolean) =>
    cn(
      "flex h-8 items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-md px-2.5 text-[13.5px] transition-colors duration-150",
      active
        ? "bg-secondary text-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  // Labels stay in the DOM when the rail collapses (so accessible names and
  // the width tween survive); they fade and give up their width instead of
  // popping out.
  const labelClass = cn(
    "min-w-0 truncate transition-[opacity,width] duration-200 ease-out",
    collapsed ? "w-0 opacity-0" : "opacity-100",
  );

  const renderLink = ({ href, label, icon: Icon }: NavLink) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => {
          onNavigate?.();
          // Clicking Assistant always opens a fresh chat, not the last one.
          // Already on the page: tell it to start a new chat now (no remount).
          // Arriving from elsewhere: flag it so the page loads a fresh chat.
          if (href === "/assistant") {
            if (window.location.pathname === "/assistant") {
              window.dispatchEvent(new Event("iras:new-chat"));
            } else {
              try {
                sessionStorage.setItem("iras-new-chat", "1");
              } catch {
                // ignore (private mode, etc.)
              }
            }
          }
        }}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={itemClass(active)}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className={labelClass}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-6 px-3 py-4">
      <nav aria-label="Overview" className="flex flex-col">
        {renderLink({ href: "/", label: "Overview", icon: Home })}
      </nav>

      {GROUPS.map((group) => (
        <nav key={group.label} aria-label={group.label} className="flex flex-col gap-0.5">
          {/* One fixed-height row: the caption and the divider rule crossfade
              as the rail collapses, so nothing pops. */}
          <p className="flex h-6 items-center overflow-hidden whitespace-nowrap px-2.5">
            <span
              className={cn(
                "min-w-0 truncate text-xs font-medium text-muted-foreground transition-[opacity,width] duration-200 ease-out",
                collapsed ? "w-0 opacity-0" : "opacity-100",
              )}
            >
              {group.label}
            </span>
            <span
              aria-hidden
              className={cn(
                "border-t transition-[opacity,width] duration-200 ease-out",
                collapsed ? "w-full opacity-100" : "w-0 opacity-0",
              )}
            />
          </p>
          {group.workspace ? (
            collapsed ? (
              <Link
                href="/workspaces"
                onClick={onNavigate}
                title="Switch workspace"
                aria-label="Switch workspace"
                className="mb-1.5 flex h-8 items-center rounded-md bg-secondary px-2.5 text-foreground transition-colors hover:bg-secondary/70"
              >
                <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              </Link>
            ) : (
              <div className="mb-1.5">
                <WorkspaceSwitcher />
              </div>
            )
          ) : null}
          {group.links.map(renderLink)}
        </nav>
      ))}
    </div>
  );
}

/**
 * App shell: a full-height left sidebar (mark, workspace selector, and the
 * two nav scopes) beside the scrolling content. The sidebar collapses to an
 * icon rail from its footer. Below md it becomes a top bar and a drawer.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop rail
  // The width transition is enabled only after mount, so restoring a saved
  // collapsed state does not play the collapse animation on page load.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebarCollapsed") === "1");
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  // Escape closes the mobile drawer (the backdrop is click-only otherwise).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggleCollapsed() {
    // Persist outside the setter: updaters must stay pure (StrictMode
    // double-invokes them).
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="-ml-1 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Wordmark />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col overflow-x-hidden border-r bg-sidebar md:flex",
          mounted && "transition-[width] duration-200 ease-out",
          collapsed ? "w-[64px]" : "w-60",
        )}
      >
        <div className="flex h-16 shrink-0 items-center px-[18px]">
          <Wordmark collapsed={collapsed} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks collapsed={collapsed} />
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center gap-1 px-3 py-3",
            collapsed && "flex-col",
          )}
        >
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            title={collapsed ? "Expand menu" : "Collapse menu"}
            className="flex h-8 min-w-0 flex-1 items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-md px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            )}
            <span
              className={cn(
                "min-w-0 truncate transition-[opacity,width] duration-200 ease-out",
                collapsed ? "w-0 opacity-0" : "opacity-100",
              )}
            >
              Collapse
            </span>
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile drawer (always full) */}
      {open ? (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 top-14 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed bottom-0 left-0 top-14 z-40 w-72 overflow-y-auto border-r bg-sidebar md:hidden">
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </>
      ) : null}

      {/* Content. Each page renders its own <main id="main">. */}
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
