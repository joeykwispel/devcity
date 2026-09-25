import { monthIndexOf } from '@devcity/city-layout'
import { CareerView } from '@/features/career/career-view'
import { layerMetadata, pageLocale } from '@/i18n/page-locale'

export const generateMetadata = ({ params }: PageProps<'/[locale]/career'>) =>
  layerMetadata(params, 'career')

export default async function CareerPage({ params }: PageProps<'/[locale]/career'>) {
  await pageLocale(params)
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <CareerView buildMonth={monthIndexOf(new Date())} />
    </div>
  )
}
