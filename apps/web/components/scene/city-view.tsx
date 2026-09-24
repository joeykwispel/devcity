'use client'

import dynamic from 'next/dynamic'
import { useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { SceneLoading } from '@/components/scene-loading'
import { useCityStore } from '@/lib/city-store'
import { SceneLabels, type SceneLabel } from './scene-labels'
import type { SceneBuilding, SceneDistrict, Vec3 } from './types'

// three.js only runs in the browser and is heavy, so it is split out and loaded client-side.
const CityScene = dynamic(() => import('./city-scene'), { ssr: false, loading: SceneLoading })

const NO_MARKERS: { id: string; position: Vec3; label: string }[] = []

export interface LabelledDistrict extends SceneDistrict {
  label: string
}

/**
 * Scene plus its DOM overlay: district name tags on the front edge of each district and a tooltip
 * above the hovered building. Layers only describe their data; this does the rest.
 */
export function CityView({
  size,
  districts,
  buildings,
  tooltip,
  markers = NO_MARKERS,
  cameraFrom,
  canvasRef,
}: {
  size: number
  districts: LabelledDistrict[]
  buildings: SceneBuilding[]
  /** Tooltip content for a building id, or null for no tooltip. */
  tooltip: (id: string) => { title: string; detail?: string } | null
  /** Small text labels on the ground, e.g. years along the career boulevard. */
  markers?: { id: string; position: Vec3; label: string }[]
  cameraFrom?: Vec3
  canvasRef?: RefObject<HTMLCanvasElement | null>
}) {
  const labelContainer = useRef<HTMLDivElement>(null)
  const hovered = useCityStore((s) => s.hovered)
  const byId = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings])
  const hoveredBuilding = hovered ? byId.get(hovered) : undefined
  const tip = hoveredBuilding ? tooltip(hoveredBuilding.id) : null

  const anchors = useMemo(() => {
    const result: Record<string, Vec3> = {}
    // Front edge faces the default camera, so labels are not hidden behind buildings.
    for (const d of districts) result[`district:${d.id}`] = [d.x, 0.1, d.z + d.depth / 2]
    for (const m of markers) result[`marker:${m.id}`] = m.position
    if (hoveredBuilding)
      result.tooltip = [hoveredBuilding.x, hoveredBuilding.height + 1.5, hoveredBuilding.z]
    return result
  }, [districts, markers, hoveredBuilding])

  const labels: SceneLabel[] = [
    ...districts.map((d) => ({
      id: `district:${d.id}`,
      content: (
        <span className="tag panel whitespace-nowrap" style={{ color: d.color }}>
          {d.label}
        </span>
      ),
    })),
    ...markers.map((m) => ({
      id: `marker:${m.id}`,
      content: <span className="font-mono text-[0.7rem] text-muted">{m.label}</span>,
    })),
    {
      id: 'tooltip',
      content: tip && <Tooltip title={tip.title} detail={tip.detail} />,
    },
  ]

  return (
    <>
      <CityScene
        size={size}
        districts={districts}
        buildings={buildings}
        anchors={anchors}
        labelContainer={labelContainer}
        cameraFrom={cameraFrom}
        canvasRef={canvasRef}
      />
      <SceneLabels labels={labels} containerRef={labelContainer} />
    </>
  )
}

function Tooltip({ title, detail }: { title: string; detail?: ReactNode }) {
  return (
    <div className="glass panel -translate-y-1/2 rounded-[var(--radius-sm)] px-2.5 py-1 font-mono text-xs whitespace-nowrap text-text">
      {title}
      {detail && <span className="ml-2 text-accent-text">{detail}</span>}
    </div>
  )
}
