'use client'

import { useTranslations } from 'next-intl'

export function SceneLoading() {
  const t = useTranslations('common')
  return (
    <div className="grid h-full place-items-center font-mono text-sm text-muted">
      <span className="animate-pulse">{t('loading')}</span>
    </div>
  )
}
