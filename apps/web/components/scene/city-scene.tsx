'use client'

import { MapControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useCityStore } from '@/lib/city-store'
import { useTheme, type Theme } from '@/lib/theme'
import { InstancedBuildings } from './instanced-buildings'
import { LabelProjector } from './label-projector'
import type { CitySceneProps, SceneDistrict } from './types'

export const scenePalette = {
  dark: { background: '#0a0e17', ground: '#111726', plate: 0.1, ambient: 0.55, sun: 1.6 },
  light: { background: '#f4f6fb', ground: '#e3e8f3', plate: 0.16, ambient: 0.9, sun: 1.9 },
} satisfies Record<Theme, unknown>

// Portrait screens need the camera further back to fit a square city into the narrow width.
const portrait = window.innerWidth < window.innerHeight ? 1.9 : 1

function DistrictPlate({ district, opacity }: { district: SceneDistrict; opacity: number }) {
  return (
    <mesh position={[district.x, 0.02, district.z]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[district.width, district.depth]} />
      <meshStandardMaterial color={district.color} transparent opacity={opacity} />
    </mesh>
  )
}

/** The shared 3D city: lights, ground, districts, instanced buildings, labels and controls. */
export default function CityScene({
  size,
  districts,
  buildings,
  anchors,
  labelContainer,
  canvasRef,
}: CitySceneProps) {
  const theme = useTheme()
  const colors = scenePalette[theme]
  const focused = useCityStore((s) => s.focused)
  const select = useCityStore((s) => s.select)

  // The camera was tuned for a 110-unit city; everything scales from there.
  const k = Math.max(size, 40) / 110
  const distance = k * portrait
  const half = size / 2

  return (
    <Canvas
      ref={canvasRef}
      shadows="percentage"
      dpr={[1, 2]}
      // preserveDrawingBuffer lets the PNG export read the canvas after a frame is drawn.
      gl={{ preserveDrawingBuffer: true }}
      camera={{
        position: [110 * distance, 100 * distance, 110 * distance],
        fov: 35,
        near: 1,
        far: 2000 * k,
      }}
      onPointerMissed={() => select(null)}
      aria-hidden="true"
    >
      <color attach="background" args={[colors.background]} />
      <fog attach="fog" args={[colors.background, 180 * distance, 420 * distance]} />

      <hemisphereLight args={['#ffffff', colors.ground, colors.ambient]} />
      <directionalLight
        position={[60 * k, 110 * k, 40 * k]}
        intensity={colors.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-half - 10}
        shadow-camera-right={half + 10}
        shadow-camera-top={half + 10}
        shadow-camera-bottom={-half - 10}
        shadow-camera-far={300 * k}
        shadow-bias={-0.0005}
      />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[900 * k, 900 * k]} />
        <meshStandardMaterial color={colors.ground} />
      </mesh>

      {districts.map((d) => (
        <DistrictPlate
          key={d.id}
          district={d}
          opacity={focused && focused !== d.id ? colors.plate / 3 : colors.plate}
        />
      ))}

      <InstancedBuildings buildings={buildings} ground={colors.ground} />

      <LabelProjector container={labelContainer} anchors={anchors} />

      <MapControls
        makeDefault
        enableDamping
        target={[0, 0, 0]}
        minDistance={20 * k}
        maxDistance={320 * distance}
        maxPolarAngle={Math.PI / 2.4}
      />
    </Canvas>
  )
}
