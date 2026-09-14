/**
 * The animals' rig, on the GPU.
 *
 * The fauna were rigid shapes slid around a circle: a bird with its wings held
 * out, a deer gliding on four still legs. Motion is what makes a creature read
 * as alive, and it has to cost nothing per animal on the CPU.
 *
 * Every vertex carries `aRig` — the pivot it turns about (xyz) and which part of
 * the animal it is (w, see `RIG` in `geometry/fauna.ts`). Every instance carries
 * `aGait` — its phase, its rate in hertz and its amplitude. From those the shader
 * rotates each part about its own joint:
 *
 *   wings    flap about the body's long axis, both together
 *   legs     swing about the hip, in diagonal pairs — a real walk
 *   tail     sways side to side at half the gait
 *   head     nods at twice the gait
 *
 * The rotation is applied to the normal too, so a wing lights like a wing
 * through the whole stroke. No backticks in here: these strings are template
 * literals, and one would end them.
 */

export const FAUNA_VERT_HEAD = /* glsl */ `
  #ifdef BH_FAUNA
    attribute vec4 aRig;
    attribute vec3 aGait;
    mat3 bhRotX(float a) { float c = cos(a); float s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
    mat3 bhRotY(float a) { float c = cos(a); float s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
    mat3 bhRotZ(float a) { float c = cos(a); float s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
    mat3 bhFaunaRot() {
      float part = aRig.w;
      float ph = uTime * aGait.y * 6.2831853 + aGait.x;
      if (part > 0.5 && part < 2.5) return bhRotZ(sin(ph) * aGait.z * (part < 1.5 ? -1.0 : 1.0));
      if (part > 2.5 && part < 6.5) {
        float pair = (part < 3.5 || part > 5.5) ? 0.0 : 3.14159265;
        return bhRotX(sin(ph + pair) * aGait.z * 0.6);
      }
      if (part > 6.5 && part < 7.5) return bhRotY(sin(ph * 0.5) * 0.35);
      if (part > 7.5) return bhRotX(sin(ph * 2.0) * 0.07);
      return mat3(1.0);
    }
  #endif
`;

/** At `beginnormal_vertex`, which runs before `begin_vertex`: the rotation, and the normal turned by it. */
export const FAUNA_NORMAL_VERT = /* glsl */ `
  #ifdef BH_FAUNA
    mat3 bhFaunaR = bhFaunaRot();
    objectNormal = bhFaunaR * objectNormal;
  #endif
`;

/** Right after `begin_vertex`: the vertex turned about its part's joint. */
export const FAUNA_POSITION_VERT = /* glsl */ `
  #ifdef BH_FAUNA
    transformed = aRig.xyz + bhFaunaR * (transformed - aRig.xyz);
  #endif
`;
