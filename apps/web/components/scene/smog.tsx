'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { IcosahedronGeometry, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'
import type { SceneBuilding } from './types'

const puff = new IcosahedronGeometry(1, 1)
const matrix = new Matrix4()
const position = new Vector3()
const scale = new Vector3()
const rotation = new Quaternion()

// This module is only loaded in the browser.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Deterministic pseudo-random numbers, so the clouds look the same on every visit. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Hazy clouds over buildings with a `smog` value (stale or archived repositories). Puffs stay
 * small; big footprints get more of them rather than bigger ones, so a large stale repo gets a
 * layer of haze instead of one blob. They drift slowly.
 */
export function Smog({ buildings }: { buildings: SceneBuilding[] }) {
  const mesh = useRef<InstancedMesh>(null)

  const puffs = useMemo(
    () =>
      buildings
        .filter((b) => (b.smog ?? 0) > 0.15)
        .flatMap((b, i) => {
          const smog = b.smog ?? 0
          const count = Math.min(14, Math.max(2, Math.round((b.width * b.depth) / 30)))
          const size = Math.min(Math.min(b.width, b.depth) * 0.45, 0.9 + smog * 1.6)
          return Array.from({ length: count }, (_, j) => {
            const seed = i * 31 + j + 1
            return {
              x: b.x + (rand(seed) - 0.5) * b.width * 0.8,
              y: b.height + 0.9 + rand(seed + 7) * 1.4,
              z: b.z + (rand(seed + 13) - 0.5) * b.depth * 0.8,
              size: size * (0.7 + rand(seed + 21) * 0.5),
              phase: rand(seed + 31) * Math.PI * 2,
            }
          })
        }),
    [buildings],
  )

  const write = (time: number) => {
    const m = mesh.current
    if (!m) return
    puffs.forEach((p, i) => {
      const drift = reducedMotion ? 0 : Math.sin(time * 0.4 + p.phase)
      position.set(p.x + drift * 0.4, p.y + drift * 0.25, p.z)
      scale.set(p.size * 1.3, p.size * 0.7, p.size)
      m.setMatrixAt(i, matrix.compose(position, rotation, scale))
    })
    m.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => write(0))
  useFrame(({ clock }) => {
    if (!reducedMotion) write(clock.elapsedTime)
  })

  if (puffs.length === 0) return null
  return (
    <instancedMesh
      key={puffs.length}
      ref={mesh}
      args={[puff, undefined, puffs.length]}
      raycast={() => null}
    >
      <meshStandardMaterial
        color="#aab0ba"
        transparent
        opacity={0.3}
        depthWrite={false}
        roughness={1}
      />
    </instancedMesh>
  )
}
