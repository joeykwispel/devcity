import { getTranslations } from 'next-intl/server'
import { ComingSoon } from '@/components/coming-soon'
import { pageLocale } from '@/i18n/page-locale'

export default async function Page({ params }: PageProps<'/[locale]/any-repo'>) {
  await pageLocale(params)
  const t = await getTranslations('layers')
  return <ComingSoon num="04" slug="any-repo" title={t('anyRepo')} />
}
