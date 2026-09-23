"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: React.ReactNode
}

// Shared by Select and the workspace menu, so every popover list matches.
export const popoverListClass =
  "z-50 overflow-hidden rounded-xl border border-foreground/[0.08] bg-popover p-1 text-popover-foreground shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"

export const popoverItemClass =
  "relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-8 pl-3 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent"

/**
 * A styled dropdown in place of a native <select>, whose popup the browser
 * draws in OS style. Keyboard, typeahead, and listbox semantics come from
 * Radix; the trigger is labelled by `aria-label`.
 */
function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  "aria-label"?: string
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "group inline-flex h-10 min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-muted px-3 text-sm font-normal text-foreground outline-none transition-colors hover:bg-accent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15 data-[state=open]:border-ring",
          className
        )}
      >
        <span className="min-w-0 truncate text-left">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            popoverListClass,
            "max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width)"
          )}
        >
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item key={o.value} value={o.value} className={popoverItemClass}>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
                  <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { Select }
