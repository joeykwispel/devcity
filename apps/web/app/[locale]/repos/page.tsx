import { ReposView } from '@/features/repos/repos-view'
import { layerMetadata, pageLocale } from '@/i18n/page-locale'
import { today } from '@/lib/time'

export const generateMetadata = ({ params }: PageProps<'/[locale]/repos'>) =>
  layerMetadata(params, 'repos')

export default async function ReposPage({ params }: PageProps<'/[locale]/repos'>) {
  await pageLocale(params)
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <ReposView buildDay={today()} />
    </div>
  )
}
