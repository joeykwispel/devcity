'use client'

import { MapControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useCityStore } from '@/lib/city-store'
import { useTheme } from '@/lib/theme'
import { tokens } from '@/lib/tokens'
import { Atmosphere } from './atmosphere'
import { CameraSync } from './camera-sync'
import { InstancedBuildings } from './instanced-buildings'
import { LabelProjector } from './label-projector'
import { Smog } from './smog'
import { useSceneStore } from './scene-store'
import { Traffic } from './traffic'
import type { CitySceneProps, SceneDistrict } from './types'

// Portrait screens need the camera further back to fit a square city into the narrow width.
const portrait = window.innerWidth < window.innerHeight ? 1.9 : 1

function DistrictPlate({ district, opacity }: { district: SceneDistrict; opacity: number }) {
  return (
    <mesh
      position={[district.x, 0.02 + (district.elevation ?? 0), district.z]}
      rotation-x={-Math.PI / 2}
      receiveShadow
    >
      <planeGeometry args={[district.width, district.depth]} />
      <meshStandardMaterial color={district.color} transparent opacity={opacity} />
    </mesh>
  )
}

/**
 * On wide screens the intro card covers the left ~400px. Shifting the projection centre moves the
 * city into the free area without changing the camera or the controls.
 */
function ViewOffset() {
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  useEffect(() => {
    if (!('setViewOffset' in camera)) return
    if (width >= 1024) camera.setViewOffset(width, height, -190, 0, width, height)
    else camera.clearViewOffset()
  }, [camera, width, height])
  return null
}

/**
 * The shared 3D city: day/night atmosphere, districts, instanced buildings with lit windows,
 * smog, traffic, labels and controls.
 */
export default function CityScene({
  size,
  districts,
  buildings,
  anchors,
  labelContainer,
  cameraFrom = [110, 100, 110],
}: CitySceneProps) {
  const theme = useTheme()
  const focused = useCityStore((s) => s.focused)
  const select = useCityStore((s) => s.select)
  const setCanvas = useSceneStore((s) => s.setCanvas)
  const plate = theme === 'dark' ? 0.1 : 0.16

  useEffect(() => () => setCanvas(null), [setCanvas])

  // The camera was tuned for a 110-unit city; everything scales from there.
  const k = Math.max(size, 40) / 110
  const distance = k * portrait
  // Nested plates (folders inside folders) are drawn but get no traffic.
  const streets = districts.filter((d) => !d.elevation)

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      // preserveDrawingBuffer lets the PNG export read the canvas after a frame is drawn.
      gl={{ preserveDrawingBuffer: true }}
      camera={{
        position: [cameraFrom[0] * distance, cameraFrom[1] * distance, cameraFrom[2] * distance],
        fov: 35,
        near: 1,
        far: 2000 * k,
      }}
      onCreated={({ gl }) => setCanvas(gl.domElement)}
      onPointerMissed={() => select(null)}
      aria-hidden="true"
    >
      <Atmosphere theme={theme} scale={k} fogNear={180 * distance} fogFar={420 * distance} />

      {districts.map((d) => (
        <DistrictPlate
          key={d.id}
          district={d}
          opacity={focused && focused !== d.id ? plate / 3 : plate}
        />
      ))}

      <InstancedBuildings buildings={buildings} ground={tokens[theme].bg2} />
      <Smog buildings={buildings} />
      <Traffic districts={streets} />

      <LabelProjector container={labelContainer} anchors={anchors} />
      <ViewOffset />
      <CameraSync />

      <MapControls
        makeDefault
        enableDamping
        target={[0, 0, 0]}
        // Capped, not scaled up: in a big city you still want to get close to a single house.
        minDistance={Math.min(20 * k, 20)}
        maxDistance={320 * distance}
        maxPolarAngle={Math.PI / 2.4}
      />
    </Canvas>
  )
}
