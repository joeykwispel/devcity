'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import {
  Color,
  Fog,
  MathUtils,
  type DirectionalLight,
  type HemisphereLight,
  type MeshStandardMaterial,
  type Scene,
} from 'three'
import type { Theme } from '@/lib/theme'
import { tokens } from '@/lib/tokens'
import { nightUniform } from './scene-store'

// Day is the light theme, night the dark theme; the kit's page backgrounds are the sky and ground.
const day = {
  sky: new Color(tokens.light.bg),
  ground: new Color(tokens.light.bg2),
  sun: new Color('#ffffff'),
  hemi: 0.9,
  intensity: 1.9,
}
const night = {
  sky: new Color(tokens.dark.bg),
  ground: new Color(tokens.dark.bg2),
  sun: new Color('#9db4ff'),
  hemi: 0.5,
  intensity: 1.1,
}

/** Gives the scene its own background colour and fog, which the fade then tints every frame. */
function initSky(scene: Scene, near: number, far: number) {
  scene.background = new Color()
  scene.fog = new Fog(new Color(), near, far)
}

// This module is only loaded in the browser.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Sky, fog, sun and ground, fading between day and night when the theme changes. The fade value
 * also drives the lit windows (see instanced-buildings.tsx) through nightUniform.
 */
export function Atmosphere({
  theme,
  scale,
  fogNear,
  fogFar,
}: {
  theme: Theme
  scale: number
  fogNear: number
  fogFar: number
}) {
  const scene = useThree((s) => s.scene)
  const hemi = useRef<HemisphereLight>(null)
  const sun = useRef<DirectionalLight>(null)
  const ground = useRef<MeshStandardMaterial>(null)
  const target = theme === 'dark' ? 1 : 0

  useLayoutEffect(() => initSky(scene, fogNear, fogFar), [scene, fogNear, fogFar])

  const apply = (n: number) => {
    nightUniform.value = n
    ;(scene.background as Color).lerpColors(day.sky, night.sky, n)
    scene.fog?.color.copy(scene.background as Color)
    if (hemi.current) {
      hemi.current.intensity = MathUtils.lerp(day.hemi, night.hemi, n)
      hemi.current.groundColor.lerpColors(day.ground, night.ground, n)
    }
    if (sun.current) {
      sun.current.intensity = MathUtils.lerp(day.intensity, night.intensity, n)
      sun.current.color.lerpColors(day.sun, night.sun, n)
    }
    ground.current?.color.lerpColors(day.ground, night.ground, n)
  }

  // First frame: jump straight to the current theme instead of fading in from the default.
  const started = useRef(false)
  useFrame((_, delta) => {
    const current = nightUniform.value
    const next =
      !started.current || reducedMotion ? target : MathUtils.damp(current, target, 3, delta)
    started.current = true
    if (Math.abs(next - current) > 1e-4 || next === target) apply(next)
  })

  const half = 55 * scale
  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffffff', night.ground, night.hemi]} />
      <directionalLight
        ref={sun}
        position={[60 * scale, 110 * scale, 40 * scale]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-half - 10}
        shadow-camera-right={half + 10}
        shadow-camera-top={half + 10}
        shadow-camera-bottom={-half - 10}
        shadow-camera-far={300 * scale}
        shadow-bias={-0.0005}
      />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[900 * scale, 900 * scale]} />
        <meshStandardMaterial ref={ground} />
      </mesh>
    </>
  )
}
