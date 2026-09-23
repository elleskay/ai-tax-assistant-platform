import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Page furniture shared by every console page: a scope line, a large title,
 * one short line of purpose, and actions on the right. Say less.
 */

/** Page container: the same measure and gutters on every console page. */
export const PAGE_CLASS =
  "mx-auto w-full max-w-6xl px-5 pb-24 pt-10 md:px-10 md:pt-14";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            {/* Scope color: the workspace is indigo, the platform orange. */}
            {typeof eyebrow === "string" ? (
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  eyebrow.startsWith("Platform") ? "bg-sunset" : "bg-cat-indigo",
                )}
              />
            ) : null}
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl leading-[1.05] tracking-tight sm:text-[44px]">
          {title}
        </h1>
        <span aria-hidden className="spectrum-bar mt-4 block h-[3px] w-14 rounded-full" />
        {description ? (
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-xl tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** An inline notice: neutral information or a warning the officer should read. */
export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "warning";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "warning" ? TriangleAlert : Info;
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm leading-relaxed",
        tone === "warning"
          ? "bg-warning text-warning-foreground"
          : "bg-card text-muted-foreground",
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Empty state: what is missing, and what to do about it. */
export function EmptyState({
  title,
  children,
  className,
  ...props
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-foreground/10 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          {children}
        </p>
      ) : null}
    </div>
  );
}
