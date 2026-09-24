import { SiteHeader } from '@/components/site-header'
import { SkillsView } from '@/features/skills/skills-view'

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="relative h-dvh w-full overflow-hidden">
        <SkillsView />
      </main>
    </>
  )
}
