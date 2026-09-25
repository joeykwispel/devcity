'use client'

import type { ReactNode, RefObject } from 'react'

export interface SceneLabel {
  id: string
  content: ReactNode
}

/**
 * DOM labels over the canvas. They live in the normal React tree (so translations and theme work)
 * and the <LabelProjector> inside the canvas moves them every frame. This replaces drei's <Html>,
 * which creates a separate React root per label.
 */
export function SceneLabels({
  labels,
  containerRef,
}: {
  labels: SceneLabel[]
  containerRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {labels.map((label) => (
        <div
          key={label.id}
          data-label={label.id}
          className="absolute top-0 left-0 will-change-transform"
          style={{ visibility: 'hidden' }}
        >
          {label.content}
        </div>
      ))}
    </div>
  )
}
