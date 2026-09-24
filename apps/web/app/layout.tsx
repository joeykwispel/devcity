import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { env } from '@/lib/env'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: 'DevCity',
  description: 'A CV and GitHub activity rendered as a 3D city.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
