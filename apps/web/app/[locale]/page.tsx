import { monthIndexOf } from '@devcity/city-layout'
import { SkillsView } from '@/features/skills/skills-view'
import { pageLocale } from '@/i18n/page-locale'

export default async function SkillsPage({ params }: PageProps<'/[locale]'>) {
  await pageLocale(params)
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <SkillsView buildMonth={monthIndexOf(new Date())} />
    </main>
  )
}
