import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Shadcn Input with the portfolio tokens. */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-9 min-w-0 rounded-[var(--radius-sm)] border border-border bg-surface px-3 font-mono text-sm text-text transition-[border-color,box-shadow] outline-none placeholder:text-muted focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--glow)] aria-invalid:border-accent-2',
        className,
      )}
      {...props}
    />
  )
}
