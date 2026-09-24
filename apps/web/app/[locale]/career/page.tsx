import { monthIndexOf } from '@devcity/city-layout'
import { CareerView } from '@/features/career/career-view'
import { pageLocale } from '@/i18n/page-locale'

export default async function CareerPage({ params }: PageProps<'/[locale]/career'>) {
  await pageLocale(params)
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <CareerView buildMonth={monthIndexOf(new Date())} />
    </main>
  )
}
