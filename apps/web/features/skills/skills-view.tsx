'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { cv } from '@/lib/cv'
import { SkillPanel } from './skill-panel'
import { buildSkillsCity } from './skills-city'
import { SkillsLegend } from './skills-legend'
import { SkillsList } from './skills-list'

// three.js only runs in the browser and is heavy, so it is split out and loaded client-side.
const SkillsCityScene = dynamic(() => import('./skills-city-scene'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center font-mono text-sm text-muted">
      <span className="animate-pulse">building city...</span>
    </div>
  ),
})

export function SkillsView() {
  // Experience is derived from "now", so it stays current without redeploying.
  const city = useMemo(() => buildSkillsCity(cv), [])

  return (
    <>
      <div className="absolute inset-0">
        <SkillsCityScene city={city} />
      </div>

      <div className="pointer-events-none absolute top-[calc(var(--nav-h)+0.5rem)] left-4 grid w-[min(380px,calc(100%-2rem))] sm:left-6">
        <SkillsLegend />
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 grid w-[min(360px,calc(100%-2rem))] sm:right-6">
        <SkillPanel city={city} />
      </div>

      <p className="pointer-events-none absolute bottom-4 left-6 hidden font-mono text-[0.72rem] text-muted lg:block">
        <span aria-hidden="true">{'// '}</span>drag to pan · right-drag to rotate · scroll to zoom ·
        click a building
      </p>

      <SkillsList city={city} />
    </>
  )
}
