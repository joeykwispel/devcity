import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Shadcn's class helper: conditional classes, with later Tailwind classes winning conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
