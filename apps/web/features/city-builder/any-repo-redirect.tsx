'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'

/** /any-repo/?repo=a/b becomes /city-builder/?repos=a/b; other parameters are kept. */
export function AnyRepoRedirect() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const query = Object.fromEntries(params)
    if (query.repo) {
      query.repos = query.repo
      delete query.repo
    }
    router.replace({ pathname: '/city-builder', query })
  }, [router, params])

  return null
}
