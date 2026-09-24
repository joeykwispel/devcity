import { z } from 'zod'

/**
 * Public, build-time configuration. Every value here ends up in the static bundle,
 * so this schema must only ever contain NEXT_PUBLIC_* variables — never secrets.
 * Next.js only inlines env vars that are referenced literally, hence the explicit object.
 */
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_BASE_PATH: z.string().default(''),
  NEXT_PUBLIC_GITHUB_USERNAME: z.string().min(1).default('joeykwispel'),
  NEXT_PUBLIC_GITHUB_PROXY_URL: z.union([z.url(), z.literal('')]).default(''),
})

const emptyToUndefined = (v: string | undefined) => (v === '' ? undefined : v)

export const env = schema.parse({
  NEXT_PUBLIC_SITE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  NEXT_PUBLIC_GITHUB_USERNAME: emptyToUndefined(process.env.NEXT_PUBLIC_GITHUB_USERNAME),
  NEXT_PUBLIC_GITHUB_PROXY_URL: process.env.NEXT_PUBLIC_GITHUB_PROXY_URL,
})
