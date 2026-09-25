import type { RefObject } from 'react'

export type Vec3 = [number, number, number]

/** A building as the scene draws it: layers map their own data onto this shape. */
export interface SceneBuilding {
  id: string
  /** District id, used for dimming when a district is focused. */
  group: string
  x: number
  z: number
  width: number
  depth: number
  height: number
  /** Any CSS colour three.js can parse (hex, rgb(), hsl() with commas). */
  color: string
  /** Stale or low-signal buildings get a hazy cloud above them (phase 8 smog). */
  smog?: number
}

export interface SceneDistrict {
  id: string
  /** Lift above the ground, so nested plates (folders in folders) do not z-fight. */
  elevation?: number
  x: number
  z: number
  width: number
  depth: number
  color: string
}

export interface CitySceneProps {
  /** Size of the city footprint; the camera, shadows and fog scale with it. */
  size: number
  districts: SceneDistrict[]
  buildings: SceneBuilding[]
  /** Positions of DOM labels (see scene-labels.tsx), keyed by label id. */
  anchors: Record<string, Vec3>
  labelContainer: RefObject<HTMLDivElement | null>
  /** Direction the camera looks from, before scaling to the city size. Defaults to isometric. */
  cameraFrom?: Vec3
}
