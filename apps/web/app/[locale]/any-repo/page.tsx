import { Suspense } from 'react'
import { AnyRepoRedirect } from '@/features/city-builder/any-repo-redirect'
import { pageLocale } from '@/i18n/page-locale'

export const metadata = { robots: { index: false } }

/** The old "Any repo" layer, kept so shared links still land in the city builder. */
export default async function AnyRepoPage({ params }: PageProps<'/[locale]/any-repo'>) {
  await pageLocale(params)
  return (
    <Suspense>
      <AnyRepoRedirect />
    </Suspense>
  )
}
