/**
 * Bursts: the world answering what you just did.
 *
 * The playtest found that doing a chore changed nothing on screen. Every action
 * now throws something into the air where it happened — sparkles for a job
 * done, leaves for planting, droplets for water, a puff of dust when Pip lands —
 * and the reward card says what it was.
 *
 * One draw call for every particle in the game. Each is a billboard quad whose
 * whole flight — launch, arc, fade, shrink — is computed in the vertex shader
 * from the moment it was born, so the CPU writes a handful of numbers when a
 * burst starts and nothing at all per frame after that.
 */
import * as THREE from 'three';

export type FxKind = 'sparkle' | 'leaves' | 'water' | 'dust' | 'berries' | 'stars' | 'petals';

interface Spec {
  count: number;
  /** Horizontal launch speed, m/s. */
  speed: number;
  /** Upward launch speed, m/s. */
  up: number;
  /** m/s² downward; negative drifts up. */
  gravity: number;
  lifeS: number;
  sizeM: number;
  /** How far past full white the colour goes, so bloom can catch it. */
  glow: number;
  colors: readonly string[];
}

const SPECS: Record<FxKind, Spec> = {
  sparkle: { count: 22, speed: 1.3, up: 1.7, gravity: 1.4, lifeS: 0.95, sizeM: 0.09, glow: 2.2, colors: ['#FFE29A', '#FFB23E', '#FFFFFF'] },
  leaves: { count: 18, speed: 1.1, up: 1.9, gravity: 2.2, lifeS: 1.25, sizeM: 0.11, glow: 1, colors: ['#5E9A45', '#7FB356', '#2F6B37'] },
  water: { count: 26, speed: 1.2, up: 2.3, gravity: 6.5, lifeS: 0.8, sizeM: 0.07, glow: 1.4, colors: ['#9BE3F0', '#57CFC4', '#FFFFFF'] },
  dust: { count: 10, speed: 0.8, up: 0.45, gravity: -0.25, lifeS: 0.65, sizeM: 0.17, glow: 1, colors: ['#C9A27A', '#B08A63', '#D9C9A8'] },
  berries: { count: 14, speed: 1.0, up: 2.4, gravity: 6.5, lifeS: 0.9, sizeM: 0.08, glow: 1.2, colors: ['#D7263D', '#8E3FB0', '#F2C230'] },
  stars: { count: 26, speed: 0.7, up: 1.1, gravity: -0.45, lifeS: 1.6, sizeM: 0.08, glow: 2.4, colors: ['#FFF6D0', '#AFCBE0', '#FFFFFF'] },
  // El Ceibo's: slow red and gold petals drifting down out of the crown.
  petals: { count: 30, speed: 0.9, up: 0.35, gravity: 0.7, lifeS: 2.6, sizeM: 0.075, glow: 1.3, colors: ['#D7263D', '#F2C230', '#E8574B'] },
};

/** Particles alive at once across every burst. The oldest are reused first. */
const MAX_PARTICLES = 420;

const vertexShader = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aVel;
  attribute vec4 aLife;   // birth, lifetime, size, gravity
  attribute vec3 aColor;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float t = uTime - aLife.x;
    float k = clamp(t / aLife.y, 0.0, 1.0);
    float alive = step(0.0, t) * step(t, aLife.y);
    vec3 p = aStart + aVel * t;
    p.y -= 0.5 * aLife.w * t * t;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    mv.xy += position.xy * aLife.z * (1.0 - k * 0.55) * alive;
    gl_Position = projectionMatrix * mv;
    vUv = position.xy + 0.5;
    vColor = aColor;
    vAlpha = (1.0 - k * k) * alive;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.25, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export class FxPool {
  readonly mesh: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>;
  private head = 0;
  private seed = 1;
  private readonly start: THREE.InstancedBufferAttribute;
  private readonly vel: THREE.InstancedBufferAttribute;
  private readonly life: THREE.InstancedBufferAttribute;
  private readonly color: THREE.InstancedBufferAttribute;
  private readonly scratch = new THREE.Color();

  constructor() {
    const quad = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = quad.index;
    geo.setAttribute('position', quad.getAttribute('position'));
    this.start = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
    this.vel = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
    // Born in the past and already dead, so an unused slot draws nothing.
    this.life = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 4).fill(-1000), 4);
    this.color = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3);
    for (const a of [this.start, this.vel, this.life, this.color]) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aStart', this.start);
    geo.setAttribute('aVel', this.vel);
    geo.setAttribute('aLife', this.life);
    geo.setAttribute('aColor', this.color);
    geo.instanceCount = MAX_PARTICLES;
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.name = 'fx';
    this.mesh.frustumCulled = false;
    this.mesh.userData.cullingDisabledBecause = 'particle positions are computed in the vertex shader';
    this.mesh.renderOrder = 5;
  }

  /** A small deterministic stream: the bursts need variety, not true randomness. */
  private rand(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  emit(kind: FxKind, x: number, y: number, z: number, now: number): void {
    const spec = SPECS[kind];
    for (let n = 0; n < spec.count; n++) {
      const i = this.head;
      this.head = (this.head + 1) % MAX_PARTICLES;
      const a = this.rand() * Math.PI * 2;
      const s = spec.speed * (0.4 + this.rand() * 0.8);
      this.start.setXYZ(i, x + (this.rand() - 0.5) * 0.2, y + this.rand() * 0.15, z + (this.rand() - 0.5) * 0.2);
      this.vel.setXYZ(i, Math.cos(a) * s, spec.up * (0.5 + this.rand() * 0.7), Math.sin(a) * s);
      this.life.setXYZW(i, now + this.rand() * 0.06, spec.lifeS * (0.7 + this.rand() * 0.6), spec.sizeM * (0.7 + this.rand() * 0.6), spec.gravity);
      this.scratch.set(spec.colors[Math.floor(this.rand() * spec.colors.length)]!).multiplyScalar(spec.glow);
      this.color.setXYZ(i, this.scratch.r, this.scratch.g, this.scratch.b);
    }
    this.start.needsUpdate = this.vel.needsUpdate = this.life.needsUpdate = this.color.needsUpdate = true;
  }

  setTime(timeS: number): void {
    this.mesh.material.uniforms.uTime!.value = timeS;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
