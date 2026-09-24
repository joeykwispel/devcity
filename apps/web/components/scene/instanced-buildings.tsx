'use client'

import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  Color,
  MathUtils,
  Matrix4,
  Quaternion,
  Vector3,
  type InstancedMesh as InstancedMeshType,
} from 'three'
import { useCityStore } from '@/lib/city-store'
import type { SceneBuilding } from './types'
import { createWindowMaterial } from './window-material'

const box = new BoxGeometry(1, 1, 1)
const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3()
const rotation = new Quaternion()
const color = new Color()
const white = new Color('#ffffff')

// This module is only loaded in the browser (the scene is imported with ssr: false).
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Every building in one InstancedMesh: one draw call whether the city has 100 or 10,000
 * buildings. Hover, selection and district focus are shown by recolouring instances.
 */
export function InstancedBuildings({
  buildings,
  ground,
}: {
  buildings: SceneBuilding[]
  /** Colour dimmed buildings fade towards. */
  ground: string
}) {
  const mesh = useRef<InstancedMeshType>(null)
  const growth = useRef(reducedMotion ? 1 : 0)
  const hovered = useCityStore((s) => s.hovered)
  const selected = useCityStore((s) => s.selected)
  const focused = useCityStore((s) => s.focused)
  const hover = useCityStore((s) => s.hover)
  const select = useCityStore((s) => s.select)

  const material = useMemo(() => createWindowMaterial(), [])
  useEffect(() => () => material.dispose(), [material])

  const baseColors = useMemo(() => buildings.map((b) => new Color(b.color)), [buildings])

  const writeMatrices = (progress: number) => {
    const m = mesh.current
    if (!m) return
    buildings.forEach((b, i) => {
      const h = Math.max(0.001, b.height * progress)
      position.set(b.x, h / 2, b.z)
      scale.set(b.width, h, b.depth)
      m.setMatrixAt(i, matrix.compose(position, rotation, scale))
    })
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }

  // A new city (other layer, other repo) grows again from the ground.
  useLayoutEffect(() => {
    growth.current = reducedMotion ? 1 : 0
    writeMatrices(growth.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const fade = new Color(ground)
    buildings.forEach((b, i) => {
      color.copy(baseColors[i]!)
      if (focused && b.group !== focused) color.lerp(fade, 0.82)
      if (b.id === selected) color.lerp(white, 0.45)
      else if (b.id === hovered) color.lerp(white, 0.3)
      m.setColorAt(i, color)
    })
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [buildings, baseColors, hovered, selected, focused, ground])

  useFrame((_, delta) => {
    if (growth.current >= 0.999) return
    growth.current = MathUtils.damp(growth.current, 1, 3.5, delta)
    if (growth.current > 0.999) growth.current = 1
    writeMatrices(growth.current)
  })

  const idAt = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
    e.instanceId === undefined ? null : (buildings[e.instanceId]?.id ?? null)

  return (
    <instancedMesh
      // A different building count needs a new InstancedMesh (its capacity is fixed).
      key={buildings.length}
      ref={mesh}
      args={[box, material, buildings.length]}
      castShadow
      receiveShadow
      onPointerMove={(e) => {
        e.stopPropagation()
        const id = idAt(e)
        if (id !== useCityStore.getState().hovered) hover(id)
        document.body.style.cursor = id ? 'pointer' : ''
      }}
      onPointerOut={() => {
        hover(null)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        select(idAt(e))
      }}
    />
  )
}
