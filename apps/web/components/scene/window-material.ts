import { MeshStandardMaterial } from 'three'
import { nightUniform } from './scene-store'

/**
 * Building material with lit windows at night. The window grid is computed from world-space
 * position in the shader, so windows stay the same size however each instance is scaled, and
 * every window is randomly on or off. Only walls get windows, and not at street level.
 */
export function createWindowMaterial() {
  const material = new MeshStandardMaterial({ roughness: 0.55, metalness: 0.1 })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = nightUniform
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vDcWorld;\nvarying vec3 vDcNormal;',
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          mat4 dcModel = modelMatrix * instanceMatrix;
        #else
          mat4 dcModel = modelMatrix;
        #endif
        vDcWorld = (dcModel * vec4(transformed, 1.0)).xyz;
        vDcNormal = normalize(mat3(dcModel) * objectNormal);`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uNight;\nvarying vec3 vDcWorld;\nvarying vec3 vDcNormal;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        if (uNight > 0.01) {
          vec3 n = normalize(vDcNormal);
          float wall = 1.0 - step(0.5, abs(n.y));
          // Horizontal coordinate along the wall, whichever way it faces.
          vec2 cell = vec2(vDcWorld.x * abs(n.z) + vDcWorld.z * abs(n.x), vDcWorld.y) / vec2(0.9, 1.1);
          vec2 f = fract(cell);
          float pane = step(0.28, f.x) * step(f.x, 0.72) * step(0.3, f.y) * step(f.y, 0.72);
          float lit = step(0.55, fract(sin(dot(floor(cell), vec2(12.9898, 78.233))) * 43758.5453));
          float aboveStreet = step(0.9, vDcWorld.y);
          totalEmissiveRadiance += vec3(1.0, 0.8, 0.5) * pane * lit * wall * aboveStreet * uNight * 0.85;
        }`,
      )
  }
  material.customProgramCacheKey = () => 'devcity-windows'
  return material
}
