'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { Vector3, type Camera } from 'three'
import type { Vec3 } from './types'

const v = new Vector3()

/** Positions every label element in `root` at its anchor's screen position, or hides it. */
function placeLabels(
  root: HTMLDivElement,
  anchors: Record<string, Vec3>,
  camera: Camera,
  width: number,
  height: number,
) {
  for (const el of root.children as HTMLCollectionOf<HTMLElement>) {
    const anchor = anchors[el.dataset.label ?? '']
    if (anchor) v.set(anchor[0], anchor[1], anchor[2]).project(camera)
    // Missing, behind the camera or far outside the view.
    if (!anchor || v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) {
      el.style.visibility = 'hidden'
      continue
    }
    const x = ((v.x + 1) / 2) * width
    const y = ((1 - v.y) / 2) * height
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    el.style.visibility = 'visible'
  }
}

/** Moves the DOM labels rendered by <SceneLabels> to their projected screen positions. */
export function LabelProjector({
  container,
  anchors,
}: {
  container: RefObject<HTMLDivElement | null>
  anchors: Record<string, Vec3>
}) {
  const latest = useRef(anchors)
  useEffect(() => {
    latest.current = anchors
  }, [anchors])

  useFrame(({ camera, size }) => {
    if (container.current)
      placeLabels(container.current, latest.current, camera, size.width, size.height)
  })

  return null
}
