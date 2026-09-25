'use client'

import { useLocale, useTranslations } from 'next-intl'
import { DetailPanel, PanelHeading, Stat } from '@/components/layer-ui'
import { Link } from '@/i18n/routing'
import { useCityStore } from '@/lib/city-store'
import type { Education, Role } from '@/lib/cv'
import { useFormatters, useLocalized } from '@/lib/locale'
import type { CareerCity } from './career-city'

export function CareerPanel({ city }: { city: CareerCity }) {
  const selected = useCityStore((s) => s.selected)
  const select = useCityStore((s) => s.select)
  const close = () => select(null)

  const role = selected ? city.roles.get(selected) : undefined
  if (role) {
    const building = city.layout.buildings.find((b) => b.id === role.id)
    const months = building ? building.end - building.start + 1 : 0
    return <RolePanel role={role} months={months} onClose={close} />
  }
  const education = selected ? city.education.get(selected) : undefined
  if (education) return <EducationPanel education={education} onClose={close} />
  return null
}

function RolePanel({ role, months, onClose }: { role: Role; months: number; onClose: () => void }) {
  const t = useTranslations()
  const locale = useLocale()
  const l = useLocalized()
  const format = useFormatters()
  const title = l(role.title)

  return (
    <DetailPanel
      path={`career/${role.id}`}
      title={
        <>
          {title}
          <span className="block text-sm font-medium text-accent-text">
            {role.company}
            {role.via && (
              <span className="text-muted"> · {t('career.via', { company: role.via })}</span>
            )}
          </span>
        </>
      }
      label={t('career.details', { name: role.company })}
      onClose={onClose}
    >
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <Stat label={t('career.period')}>
          {format.month(role.start)} &ndash; {role.end ? format.month(role.end) : t('common.now')}
        </Stat>
        <Stat label={t('career.duration')}>
          <span className="font-bold text-accent-text">{format.duration(months)}</span>
        </Stat>
      </dl>

      <p className="text-sm text-muted">{l(role.summary)}</p>

      {role.bullets[locale].length > 0 && (
        <div className="grid gap-1.5">
          <PanelHeading>{t('career.whatIDid')}</PanelHeading>
          <ul className="grid list-disc gap-1 pl-4 text-sm marker:text-accent-text">
            {role.bullets[locale].map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {role.stack.length > 0 && (
        <div className="grid gap-1.5">
          <PanelHeading>{t('career.stack')}</PanelHeading>
          <ul className="flex flex-wrap gap-1">
            {role.stack.map((skill) => (
              <li key={skill}>
                <Link
                  href={{ pathname: '/', query: { select: skill } }}
                  className="tag no-underline hover:text-accent-text"
                  title={t('career.openInSkills', { skill })}
                >
                  {skill}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DetailPanel>
  )
}

function EducationPanel({ education, onClose }: { education: Education; onClose: () => void }) {
  const t = useTranslations('career')
  const l = useLocalized()
  const years =
    education.startYear === education.endYear
      ? `${education.endYear}`
      : `${education.startYear} – ${education.endYear}`

  return (
    <DetailPanel
      path={`career/${education.id}`}
      title={
        <>
          {l(education.title)}
          {education.institution && (
            <span className="block text-sm font-medium text-accent-text">
              {education.institution}
            </span>
          )}
        </>
      }
      label={t('details', { name: l(education.title) })}
      onClose={onClose}
    >
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <Stat label={t('period')}>{years}</Stat>
        <Stat label={t(`kinds.${education.kind}`)}>
          {education.detail ? l(education.detail) : (education.courses?.length ?? 0)}
        </Stat>
      </dl>
      {education.courses && education.courses.length > 0 && (
        <div className="grid gap-1.5">
          <PanelHeading>{t('courses')}</PanelHeading>
          <ul className="flex flex-wrap gap-1">
            {education.courses.map((course) => (
              <li key={course} className="tag">
                {course}
              </li>
            ))}
          </ul>
        </div>
      )}
    </DetailPanel>
  )
}
