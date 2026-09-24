'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Camera, Vector3 } from 'three'
import { useSceneStore } from './scene-store'

interface OrbitLike {
  target: Vector3
  update: () => void
}

/** Moves target and camera together, so the angle and distance stay the same. */
function panTo(controls: OrbitLike, camera: Camera, x: number, z: number) {
  const dx = x - controls.target.x
  const dz = z - controls.target.z
  controls.target.x += dx
  controls.target.z += dz
  camera.position.x += dx
  camera.position.z += dz
  controls.update()
}

/**
 * Reports the camera to the minimap (a few times per second, only when it moved) and applies pans
 * requested from outside the canvas, keeping the current viewing angle and distance.
 */
export function CameraSync() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null
  const last = useRef({ x: NaN, z: NaN, cx: NaN, cz: NaN, at: 0 })
  const flyTo = useSceneStore((s) => s.flyTo)

  useEffect(() => {
    if (flyTo && controls) panTo(controls, camera, flyTo.x, flyTo.z)
  }, [flyTo, controls, camera])

  useFrame(({ clock }) => {
    if (!controls) return
    const now = clock.elapsedTime
    const l = last.current
    if (now - l.at < 0.15) return
    const { x, z } = controls.target
    const moved =
      Math.abs(x - l.x) > 0.2 ||
      Math.abs(z - l.z) > 0.2 ||
      Math.abs(camera.position.x - l.cx) > 0.2 ||
      Math.abs(camera.position.z - l.cz) > 0.2
    if (!moved && !Number.isNaN(l.x)) return
    last.current = { x, z, cx: camera.position.x, cz: camera.position.z, at: now }
    useSceneStore.getState().setView({ x, z }, { x: camera.position.x, z: camera.position.z })
  })

  return null
}
