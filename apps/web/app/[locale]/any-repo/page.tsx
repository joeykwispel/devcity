import { Suspense } from 'react'
import { AnyRepoView } from '@/features/any-repo/any-repo-view'
import { layerMetadata, pageLocale } from '@/i18n/page-locale'

export const generateMetadata = ({ params }: PageProps<'/[locale]/any-repo'>) =>
  layerMetadata(params, 'anyRepo')

export default async function AnyRepoPage({ params }: PageProps<'/[locale]/any-repo'>) {
  await pageLocale(params)
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* The repo comes from ?repo=, which only exists in the browser on a static export. */}
      <Suspense>
        <AnyRepoView />
      </Suspense>
    </div>
  )
}
