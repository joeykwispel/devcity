import { Suspense } from 'react'
import { CityBuilderView } from '@/features/city-builder/city-builder-view'
import { layerMetadata, pageLocale } from '@/i18n/page-locale'

export const generateMetadata = ({ params }: PageProps<'/[locale]/city-builder'>) =>
  layerMetadata(params, 'cityBuilder')

export default async function CityBuilderPage({ params }: PageProps<'/[locale]/city-builder'>) {
  await pageLocale(params)
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* The repos come from ?repos=, which only exists in the browser on a static export. */}
      <Suspense>
        <CityBuilderView />
      </Suspense>
    </div>
  )
}
