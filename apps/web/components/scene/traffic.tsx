'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  Color,
  Matrix4,
  Quaternion,
  Vector3,
  type InstancedMesh,
  type MeshStandardMaterial,
} from 'three'
import { nightUniform } from './scene-store'
import type { SceneDistrict } from './types'

const carGeometry = new BoxGeometry(1.1, 0.5, 0.55)
const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3(1, 1, 1)
const rotation = new Quaternion()
const up = new Vector3(0, 1, 0)
const palette = ['#7dd3c0', '#b49cff', '#f1f5f9', '#fca5a5', '#fcd34d', '#93c5fd'].map(
  (c) => new Color(c),
)

// This module is only loaded in the browser.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Loop {
  x: number
  z: number
  w: number
  d: number
  perimeter: number
}

/** Point and heading at distance t along the rectangle's perimeter (clockwise from top-left). */
function along(loop: Loop, t: number): [number, number, number] {
  const { x, z, w, d } = loop
  const left = x - w / 2
  const top = z - d / 2
  let s = ((t % loop.perimeter) + loop.perimeter) % loop.perimeter
  if (s < w) return [left + s, top, 0]
  s -= w
  if (s < d) return [left + w, top + s, -Math.PI / 2]
  s -= d
  if (s < w) return [left + w - s, top + d, Math.PI]
  s -= w
  return [left, top + d - s, Math.PI / 2]
}

/**
 * Small cars driving around the district blocks, on the streets between districts. Headlights
 * glow at night. Hidden when the visitor prefers reduced motion.
 */
export function Traffic({
  districts,
  offset = 1,
}: {
  districts: SceneDistrict[]
  offset?: number
}) {
  const mesh = useRef<InstancedMesh>(null)
  const material = useRef<MeshStandardMaterial>(null)

  const { loops, cars } = useMemo(() => {
    const loops: Loop[] = districts
      .filter((d) => d.width > 6 && d.depth > 6)
      .map((d) => {
        const w = d.width + offset * 2
        const dd = d.depth + offset * 2
        return { x: d.x, z: d.z, w, d: dd, perimeter: 2 * (w + dd) }
      })
    const cars = loops.flatMap((loop, i) => {
      const count = Math.min(6, Math.max(1, Math.round(loop.perimeter / 40)))
      return Array.from({ length: count }, (_, j) => ({
        loop,
        start: (loop.perimeter / count) * j + i * 7,
        speed: 3 + ((i * 5 + j * 3) % 4),
        color: palette[(i + j) % palette.length]!,
      }))
    })
    return { loops, cars: cars.slice(0, 80) }
  }, [districts, offset])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    cars.forEach((car, i) => m.setColorAt(i, car.color))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [cars])

  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m) return
    const time = clock.elapsedTime
    cars.forEach((car, i) => {
      const [x, z, heading] = along(car.loop, car.start + time * car.speed)
      position.set(x, 0.3, z)
      rotation.setFromAxisAngle(up, heading)
      m.setMatrixAt(i, matrix.compose(position, rotation, scale))
    })
    m.instanceMatrix.needsUpdate = true
    if (material.current) material.current.emissiveIntensity = nightUniform.value * 0.9
  })

  if (reducedMotion || loops.length === 0 || cars.length === 0) return null
  return (
    <instancedMesh
      key={cars.length}
      ref={mesh}
      args={[carGeometry, undefined, cars.length]}
      castShadow
      raycast={() => null}
    >
      <meshStandardMaterial ref={material} emissive="#fff2c7" roughness={0.4} />
    </instancedMesh>
  )
}
