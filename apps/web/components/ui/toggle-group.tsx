'use client'

import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Shadcn ToggleGroup (Radix): a segmented control with roving focus, arrow-key navigation and
 * correct pressed/checked semantics for free.
 */
export function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-border bg-surface p-0.5',
        className,
      )}
      {...props}
    />
  )
}

export function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 font-mono text-xs text-muted transition-colors hover:text-text data-[state=on]:bg-accent data-[state=on]:font-bold data-[state=on]:text-accent-ink [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}
