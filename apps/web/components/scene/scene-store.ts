import { create } from 'zustand'

interface SceneState {
  /** The WebGL canvas, for the PNG export. */
  canvas: HTMLCanvasElement | null
  /** Where the camera looks (orbit target) and where it is, on the ground plane. */
  target: { x: number; z: number }
  camera: { x: number; z: number }
  /** A pan requested from outside the canvas (minimap click); the scene consumes it. */
  flyTo: { x: number; z: number; at: number } | null
  showMinimap: boolean
  setCanvas: (canvas: HTMLCanvasElement | null) => void
  setView: (target: { x: number; z: number }, camera: { x: number; z: number }) => void
  requestFlyTo: (x: number, z: number) => void
  toggleMinimap: () => void
}

/** State shared between the 3D scene and the DOM around it (toolbar, minimap). */
export const useSceneStore = create<SceneState>((set) => ({
  canvas: null,
  target: { x: 0, z: 0 },
  camera: { x: 0, z: 0 },
  flyTo: null,
  showMinimap: true,
  setCanvas: (canvas) => set({ canvas }),
  setView: (target, camera) => set({ target, camera }),
  requestFlyTo: (x, z) => set({ flyTo: { x, z, at: Date.now() } }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
}))

/**
 * 0 = day, 1 = night. Animated by the scene when the theme changes and read by shaders (lit
 * windows) and materials (headlights) every frame, so it lives outside React.
 */
export const nightUniform = { value: 1 }
