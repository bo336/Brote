/**
 * The sky: one dome that follows the camera, painted in a shader.
 *
 * **v2 (`23-ART-DIRECTION-V2.md`).** A two-stop vertex gradient read as a
 * backdrop — nothing moved in it and nothing lit it. Now the dome carries a
 * gradient the biome tints, a sun with a disc and the haze around it, a horizon
 * that warms on the sun's side, clouds that drift and catch the light, and at
 * night a field of stars. All of it is one full-screen-ish draw with no texture.
 */
import * as THREE from 'three';

import type { TimeOfDay } from '@/lib/world/types';
import type { WorldPalette } from './palette';

const SKY_RADIUS = 400;
const SKY_SEGMENTS = 32;
const SKY_RINGS = 16;

/** How much of the sky is cloud, by time of day. Lower is more. */
const CLOUD_COVER: Record<TimeOfDay, number> = { amanecer: 0.5, dia: 0.56, atardecer: 0.5, noche: 0.6 };

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // Pinned to the far plane, so the dome never clips anything in front of it.
    gl_Position.z = gl_Position.w;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uCloudLit;
  uniform vec3 uCloudShade;
  uniform float uCloudCover;
  uniform float uNight;
  uniform float uTime;
  varying vec3 vDir;

  float bhHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bhNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(bhHash(i), bhHash(i + vec2(1.0, 0.0)), u.x), mix(bhHash(i + vec2(0.0, 1.0)), bhHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float bhFbm(vec2 p) {
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * bhNoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return s;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float sd = max(dot(d, uSunDir), 0.0);

    // The gradient: deep overhead, pale at the horizon, a little darker below it.
    vec3 sky = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
    sky = h < 0.0 ? mix(uHorizon, uHorizon * 0.82, clamp(-h * 5.0, 0.0, 1.0)) : sky;
    // The tone curve drains saturation from bright values; give the blue back before it does.
    sky = mix(vec3(dot(sky, vec3(0.2126, 0.7152, 0.0722))), sky, 1.3);

    // The horizon warms on the sun's side; the sun has a disc and a haze.
    float day = 1.0 - uNight;
    sky += uSunColor * pow(1.0 - abs(h), 5.0) * pow(sd, 3.0) * 0.35 * day;
    sky += uSunColor * (pow(sd, 1200.0) * 24.0 + pow(sd, 48.0) * 0.5 + pow(sd, 6.0) * 0.12) * day;

    // Clouds: a layer overhead, projected, drifting, lit from the sun's side.
    if (h > 0.0) {
      vec2 uv = d.xz / (h + 0.12) * 0.55 + uTime * vec2(0.006, 0.0022);
      float n = bhFbm(uv * 1.6);
      float cover = smoothstep(uCloudCover, uCloudCover + 0.22, n);
      float ahead = bhFbm(uv * 1.6 + uSunDir.xz * 0.12);
      float lit = clamp(0.6 + (n - ahead) * 3.5, 0.0, 1.0);
      vec3 cloud = mix(uCloudShade, uCloudLit, lit) + uSunColor * pow(sd, 6.0) * 0.6 * day;
      sky = mix(sky, cloud, cover * smoothstep(0.0, 0.2, h) * 0.92);
    }

    // Stars, only at night, twinkling.
    if (uNight > 0.01 && h > 0.0) {
      vec2 cell = floor(vec2(atan(d.z, d.x) * 180.0, h * 360.0));
      float s = bhHash(cell);
      float star = step(0.996, s) * smoothstep(0.0, 0.3, h) * (0.6 + 0.4 * sin(uTime * 2.3 + s * 91.0));
      sky += vec3(star) * uNight * 1.6;
    }

    gl_FragColor = vec4(sky, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface Sky {
  dome: THREE.Mesh;
  material: THREE.ShaderMaterial;
  /** 0 = day, 1 = full night. */
  nightness: number;
}

const scratch = new THREE.Color();

export function buildSky(): Sky {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color('#5A9BD8') },
      uHorizon: { value: new THREE.Color('#DCEBF2') },
      uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
      uSunColor: { value: new THREE.Color(1, 0.9, 0.75) },
      uCloudLit: { value: new THREE.Color('#FFF8EE') },
      uCloudShade: { value: new THREE.Color('#B9C6D6') },
      uCloudCover: { value: CLOUD_COVER.dia },
      uNight: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, SKY_SEGMENTS, SKY_RINGS), material);
  dome.name = 'sky';
  dome.renderOrder = -2;
  dome.frustumCulled = false;
  return { dome, material, nightness: 0 };
}

/** The biome's sky at a time of day. Called when the palette changes, never per frame. */
export function paintSky(sky: Sky, palette: WorldPalette, tod: TimeOfDay): void {
  const u = sky.material.uniforms;
  (u.uZenith!.value as THREE.Color).set(palette.skyTop);
  (u.uHorizon!.value as THREE.Color).set(palette.skyHorizon);
  // Clouds lit by the horizon's warmth, shaded toward the zenith's blue.
  (u.uCloudLit!.value as THREE.Color).set(palette.skyHorizon).lerp(scratch.set('#FFFFFF'), 0.6);
  (u.uCloudShade!.value as THREE.Color).set(palette.skyTop).lerp(scratch.set(palette.skyHorizon), 0.55);
  u.uCloudCover!.value = CLOUD_COVER[tod];
}

/** One frame: follow the lens, advance the clouds, fade the night, take the sun. */
export function tickSky(
  sky: Sky, cameraPosition: THREE.Vector3, timeS: number, tod: TimeOfDay, fade: number,
  sunDir: THREE.Vector3, sunColor: THREE.Color,
): void {
  sky.dome.position.copy(cameraPosition);
  sky.nightness += ((tod === 'noche' ? 1 : 0) - sky.nightness) * Math.min(1, Math.max(0, fade));
  const u = sky.material.uniforms;
  u.uTime!.value = timeS;
  u.uNight!.value = sky.nightness;
  (u.uSunDir!.value as THREE.Vector3).copy(sunDir);
  (u.uSunColor!.value as THREE.Color).copy(sunColor);
}

export function disposeSky(sky: Sky): void {
  sky.dome.geometry.dispose();
  sky.material.dispose();
}
