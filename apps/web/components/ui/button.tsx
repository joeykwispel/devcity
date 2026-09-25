import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Shadcn Button, restyled with the portfolio tokens: mono label, glass surface, teal glow on hover
 * (the `.btn` from joeyoosenbrug.nl).
 */
export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border font-mono text-xs whitespace-nowrap no-underline transition-[color,background,border-color,box-shadow,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border-border bg-surface text-muted hover:border-[color-mix(in_srgb,var(--accent)_55%,var(--border))] hover:text-text hover:shadow-[0_0_0_4px_var(--glow)]',
        primary: 'border-transparent bg-accent font-bold text-accent-ink hover:brightness-105',
        ghost: 'border-transparent text-muted hover:bg-surface hover:text-text',
      },
      size: {
        default: 'h-9 px-3',
        sm: 'h-8 px-2.5',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
