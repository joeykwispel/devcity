'use client'

import { useTranslations } from 'next-intl'
import { LayerIntro } from './layer-ui'

export function ComingSoon({ num, slug, title }: { num: string; slug: string; title: string }) {
  const t = useTranslations('common')
  return (
    <main className="relative grid h-dvh w-full place-items-center p-4">
      <div className="w-[min(420px,100%)]">
        <LayerIntro num={num} slug={slug} title={title} intro={t('comingSoon')} />
      </div>
    </main>
  )
}
