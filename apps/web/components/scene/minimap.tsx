'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useRef, type MouseEvent } from 'react'
import { useCityStore } from '@/lib/city-store'
import { useSceneStore } from './scene-store'
import type { SceneBuilding, SceneDistrict } from './types'

/** Beyond this many buildings the minimap shows districts only; it is an overview, not a copy. */
const MAX_BUILDINGS = 1500

/**
 * Top-down overview of the city with the camera's position and viewing direction. Clicking pans
 * the camera there. It is a pointer convenience only (hidden from assistive technology); the list
 * view is the accessible way to reach every building.
 */
export function Minimap({
  districts,
  buildings,
}: {
  districts: SceneDistrict[]
  buildings: SceneBuilding[]
}) {
  const t = useTranslations('toolbar')
  const show = useSceneStore((s) => s.showMinimap)
  const target = useSceneStore((s) => s.target)
  const camera = useSceneStore((s) => s.camera)
  const requestFlyTo = useSceneStore((s) => s.requestFlyTo)
  const selected = useCityStore((s) => s.selected)
  const svg = useRef<SVGSVGElement>(null)

  const bounds = useMemo(() => {
    const rects = [...districts, ...buildings]
    if (rects.length === 0) return { x: -50, z: -50, w: 100, d: 100 }
    const minX = Math.min(...rects.map((r) => r.x - r.width / 2))
    const maxX = Math.max(...rects.map((r) => r.x + r.width / 2))
    const minZ = Math.min(...rects.map((r) => r.z - r.depth / 2))
    const maxZ = Math.max(...rects.map((r) => r.z + r.depth / 2))
    const pad = Math.max(maxX - minX, maxZ - minZ) * 0.06
    return { x: minX - pad, z: minZ - pad, w: maxX - minX + pad * 2, d: maxZ - minZ + pad * 2 }
  }, [districts, buildings])

  if (!show || districts.length === 0) return null

  const onClick = (e: MouseEvent<SVGSVGElement>) => {
    const el = svg.current
    const matrix = el?.getScreenCTM()?.inverse()
    if (!el || !matrix) return
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix)
    requestFlyTo(point.x, point.y)
  }

  // Direction from the target towards the camera, drawn as a short line: "you are looking from here".
  const dx = camera.x - target.x
  const dz = camera.z - target.z
  const len = Math.hypot(dx, dz) || 1
  const reach = Math.max(bounds.w, bounds.d) * 0.12
  const unit = Math.max(bounds.w, bounds.d) / 100

  return (
    <div
      className="glass panel pointer-events-auto w-48 overflow-hidden p-1.5"
      aria-hidden="true"
      title={t('minimapHint')}
    >
      <svg
        ref={svg}
        viewBox={`${bounds.x} ${bounds.z} ${bounds.w} ${bounds.d}`}
        className="block max-h-48 w-full cursor-crosshair"
        preserveAspectRatio="xMidYMid meet"
        onClick={onClick}
      >
        {districts.map((d) => (
          <rect
            key={d.id}
            x={d.x - d.width / 2}
            y={d.z - d.depth / 2}
            width={d.width}
            height={d.depth}
            fill={d.color}
            opacity={d.elevation ? 0.12 : 0.22}
            rx={unit * 0.6}
          />
        ))}
        {buildings.length <= MAX_BUILDINGS &&
          buildings.map((b) => (
            <rect
              key={b.id}
              x={b.x - b.width / 2}
              y={b.z - b.depth / 2}
              width={b.width}
              height={b.depth}
              fill={b.id === selected ? 'var(--text)' : b.color}
            />
          ))}
        <line
          x1={target.x}
          y1={target.z}
          x2={target.x + (dx / len) * reach}
          y2={target.z + (dz / len) * reach}
          stroke="var(--text)"
          strokeWidth={unit * 0.8}
          strokeLinecap="round"
        />
        <circle
          cx={target.x}
          cy={target.z}
          r={unit * 2.2}
          fill="var(--accent)"
          stroke="var(--bg)"
          strokeWidth={unit * 0.6}
        />
      </svg>
    </div>
  )
}
