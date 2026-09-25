import { monthIndexOf } from '@devcity/city-layout'
import { SkillsView } from '@/features/skills/skills-view'
import { layerMetadata, pageLocale } from '@/i18n/page-locale'

export const generateMetadata = ({ params }: PageProps<'/[locale]'>) =>
  layerMetadata(params, 'skills')

export default async function SkillsPage({ params }: PageProps<'/[locale]'>) {
  await pageLocale(params)
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <SkillsView buildMonth={monthIndexOf(new Date())} />
    </main>
  )
}
