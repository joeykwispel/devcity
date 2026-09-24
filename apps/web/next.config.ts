import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ['@devcity/city-layout', '@devcity/github-client'],
}

export default createNextIntlPlugin('./i18n/request.ts')(nextConfig)
