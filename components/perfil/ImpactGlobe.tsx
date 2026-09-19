'use client';

import { useId, useMemo } from 'react';

/**
 * The header globe on `/perfil` — **an SVG, not a second WebGL context.**
 *
 * `01-RULES.md` §3.1 is absolute: one `WebGLRenderer`, one `<Canvas>`, in the
 * entire app, ever. This component used to be the second one. It spun a
 * 48×48-segment sphere with a `MeshStandardMaterial` — which the art direction
 * also forbids (`18-DECISIONS.md` T4) — on a route that sits one tap away from
 * `/mundo`, on devices that cap how many live GL contexts they will keep.
 * Losing that race silently drops the older context, and the older context is
 * the game.
 *
 * It is a decorative header graphic. It never needed a renderer, and the
 * arithmetic it was doing — points spread evenly over a sphere — is the same
 * whether a GPU or a `<circle>` draws the result.
 *
 * The markers are projected orthographically and the back hemisphere is drawn
 * dimmer instead of being culled, so the globe still reads as a ball rather
 * than as a disc.
 *
 * **It no longer spins**, and that is a deliberate trade rather than an
 * oversight: SVG has no third axis, so the only honest way to turn this ball
 * is to recompute forty projected points every frame — which is a render loop
 * again, for a decorative header. A wrong-looking rotation (a mirror flip, a
 * wheel spin) would read worse than stillness.
 */
const MARKERS_MAX = 40;
const R = 100;

/** Evenly spread points on a sphere. Unchanged from the version that spun. */
function fibSphere(n: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return pts;
}

export default function ImpactGlobe({ markerCount = 8 }: { markerCount?: number }) {
  const id = useId();
  const markers = useMemo(() => fibSphere(Math.min(MARKERS_MAX, Math.max(1, markerCount))), [markerCount]);

  // The graticule: a handful of meridians as ellipses, which is exactly what a
  // circle of longitude is under an orthographic projection.
  const meridians = [0.28, 0.62, 0.92];

  return (
    <svg
      viewBox="-120 -120 240 240"
      className="h-full w-full"
      role="img"
      aria-label="Tu huella positiva, en el mundo"
    >
      <defs>
        <radialGradient id={`${id}-ball`} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#4FC3DE" />
          <stop offset="65%" stopColor="#1E88A8" />
          <stop offset="100%" stopColor="#12556B" />
        </radialGradient>
        {/* Everything on the far side of the ball is drawn through this, so the
            markers read as sitting on a surface that curves away. */}
        <clipPath id={`${id}-disc`}>
          <circle cx="0" cy="0" r={R} />
        </clipPath>
      </defs>

      <circle cx="0" cy="0" r={R} fill={`url(#${id}-ball)`} />

      <g clipPath={`url(#${id}-disc)`}>
        <g>
          {meridians.map((k) => (
            <ellipse
              key={k}
              cx="0"
              cy="0"
              rx={R * k}
              ry={R}
              fill="none"
              stroke="#1FB57A"
              strokeOpacity="0.28"
              strokeWidth="1.5"
            />
          ))}
          <line x1={-R} y1="0" x2={R} y2="0" stroke="#1FB57A" strokeOpacity="0.28" strokeWidth="1.5" />

          {markers.map(([x, y, z], i) => (
            <circle
              key={i}
              cx={x * R * 0.96}
              cy={-y * R * 0.96}
              r={z >= 0 ? 4.2 : 3.2}
              fill="#FFB23E"
              // The far hemisphere is dimmed rather than hidden: a marker that
              // vanished at the halfway point would read as a bug.
              opacity={z >= 0 ? 0.95 : 0.3}
            />
          ))}
        </g>
      </g>

      {/* The terminator, so the ball has a lit side. */}
      <circle cx="0" cy="0" r={R} fill="none" stroke="#0B3D4C" strokeOpacity="0.35" strokeWidth="2" />

    </svg>
  );
}
