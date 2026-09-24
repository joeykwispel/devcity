'use client'

import type { Building as BuildingData, District } from '@devcity/city-layout'
import { Html, MapControls } from '@react-three/drei'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BoxGeometry, Color, MathUtils, type Mesh } from 'three'
import { formatYears, t } from '@/lib/locale'
import { useTheme, type Theme } from '@/lib/theme'
import { categoryCss, type SkillsCity } from './skills-city'
import { useSkillsStore } from './store'

const palette = {
  dark: { background: '#0a0e17', ground: '#111726', plate: 0.1, ambient: 0.55, sun: 1.6 },
  light: { background: '#f4f6fb', ground: '#e3e8f3', plate: 0.16, ambient: 0.9, sun: 1.9 },
} satisfies Record<Theme, unknown>

function buildingColor(hue: number, theme: Theme, used: boolean): Color {
  const saturation = used ? 0.55 : 0.12
  const lightness = theme === 'dark' ? (used ? 0.6 : 0.42) : used ? 0.5 : 0.72
  return new Color().setHSL(hue / 360, saturation, lightness)
}

// One unit cube shared by every building; each mesh scales it to its lot and height.
const box = new BoxGeometry(1, 1, 1)

// This module is only ever loaded in the browser (see skills-view.tsx), so window is safe here.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Portrait screens need the camera further back to fit the square city in the narrow width.
const cameraDistance = window.innerWidth < window.innerHeight ? 1.9 : 1
const cameraPosition: [number, number, number] = [110, 100, 110].map((v) => v * cameraDistance) as [
  number,
  number,
  number,
]

function Building({ data, color, dimmed }: { data: BuildingData; color: Color; dimmed: boolean }) {
  const ref = useRef<Mesh>(null)
  const active = useSkillsStore((s) => s.hovered === data.id || s.selected === data.id)
  const hover = useSkillsStore((s) => s.hover)
  const select = useSkillsStore((s) => s.select)

  // Buildings rise out of the ground on load.
  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const next = reducedMotion ? data.height : MathUtils.damp(mesh.scale.y, data.height, 4, delta)
    mesh.scale.y = next
    mesh.position.y = next / 2
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hover(data.id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    hover(null)
    document.body.style.cursor = ''
  }

  return (
    <mesh
      ref={ref}
      geometry={box}
      position={[data.x, 0, data.z]}
      scale={[data.width, 0.001, data.depth]}
      castShadow
      receiveShadow
      onPointerOver={onOver}
      onPointerOut={onOut}
      onClick={(e) => {
        e.stopPropagation()
        select(data.id)
      }}
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={active ? 0.55 : 0.04}
        roughness={0.55}
        metalness={0.1}
        transparent
        opacity={dimmed ? 0.15 : 1}
        depthWrite={!dimmed}
      />
    </mesh>
  )
}

function DistrictPlate({
  district,
  color,
  label,
  opacity,
}: {
  district: District
  color: string
  label: string
  opacity: number
}) {
  return (
    <group position={[district.x, 0, district.z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
        <planeGeometry args={[district.width, district.depth]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {/* Front edge, facing the default camera, so labels are not hidden behind buildings. */}
      <Html
        position={[0, 0.1, district.depth / 2]}
        center
        style={{ pointerEvents: 'none' }}
        zIndexRange={[10, 0]}
      >
        <span className="tag panel whitespace-nowrap" style={{ color }}>
          {label}
        </span>
      </Html>
    </group>
  )
}

/**
 * Stays mounted and is only hidden: drei <Html> creates its own React root, and mounting and
 * unmounting one on every hover makes React warn about unmounting a root mid-render.
 */
function HoverLabel({ city }: { city: SkillsCity }) {
  const hovered = useSkillsStore((s) => s.hovered)
  const building = hovered ? city.layout.buildings.find((b) => b.id === hovered) : undefined
  const skill = building ? city.skills.get(building.id) : undefined
  return (
    <Html
      position={building ? [building.x, building.height + 1.2, building.z] : [0, -100, 0]}
      center
      style={{ pointerEvents: 'none', visibility: building ? 'visible' : 'hidden' }}
      zIndexRange={[20, 10]}
    >
      <div className="glass panel whitespace-nowrap rounded-[var(--radius-sm)] px-2.5 py-1 font-mono text-xs text-text">
        {skill?.label ? t(skill.label) : building?.id}
        <span className="ml-2 text-accent-text">
          {building && building.months > 0 ? `${formatYears(building.months)}y` : 'listed'}
        </span>
      </div>
    </Html>
  )
}

export default function SkillsCityScene({ city }: { city: SkillsCity }) {
  const theme = useTheme()
  const colors = palette[theme]
  const focused = useSkillsStore((s) => s.focusedCategory)
  const select = useSkillsStore((s) => s.select)

  const buildingColors = useMemo(
    () =>
      new Map(
        city.layout.buildings.map((b) => [
          b.id,
          buildingColor(city.categories.get(b.district)?.hue ?? 0, theme, b.months > 0),
        ]),
      ),
    [city, theme],
  )

  const half = city.layout.width / 2

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: cameraPosition, fov: 35, near: 1, far: 800 }}
      onPointerMissed={() => select(null)}
      aria-hidden="true"
    >
      <color attach="background" args={[colors.background]} />
      <fog attach="fog" args={[colors.background, 180 * cameraDistance, 420 * cameraDistance]} />

      <hemisphereLight args={['#ffffff', colors.ground, colors.ambient]} />
      <directionalLight
        position={[60, 110, 40]}
        intensity={colors.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-half - 10}
        shadow-camera-right={half + 10}
        shadow-camera-top={half + 10}
        shadow-camera-bottom={-half - 10}
        shadow-camera-far={300}
        shadow-bias={-0.0005}
      />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color={colors.ground} />
      </mesh>

      {city.layout.districts.map((d) => {
        const category = city.categories.get(d.id)
        return (
          <DistrictPlate
            key={d.id}
            district={d}
            color={categoryCss(category?.hue ?? 0, theme)}
            label={category ? t(category.label) : d.id}
            opacity={focused && focused !== d.id ? colors.plate / 3 : colors.plate}
          />
        )
      })}

      {city.layout.buildings.map((b) => (
        <Building
          key={b.id}
          data={b}
          color={buildingColors.get(b.id)!}
          dimmed={focused !== null && focused !== b.district}
        />
      ))}

      <HoverLabel city={city} />

      <MapControls
        makeDefault
        enableDamping
        target={[0, 0, 0]}
        minDistance={30}
        maxDistance={320 * cameraDistance}
        maxPolarAngle={Math.PI / 2.4}
      />
    </Canvas>
  )
}
