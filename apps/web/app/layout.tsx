import type { ReactNode } from 'react'

// The real root layout (with <html lang>) lives in app/[locale]/layout.tsx. This one only exists
// so app/page.tsx (the language redirect) and app/not-found.tsx can render outside a locale.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
