/**
 * The controls half of `lib/world/config.ts`: movement, the verbs that own
 * movement, the camera, the joystick and interaction.
 *
 * Split out for the 400-line rule. **Import through `./config`**, never
 * directly — there is one place to look for a tunable.
 */

// ── Movement (`10-CONTROLS-AND-CAMERA.md` §2) ───────────────────────────────

export const MOVE = {
  walkSpeed: 2.4, // m/s
  runSpeed: 4.0, // m/s, past the joystick run threshold
  accel: 14, // m/s² toward the desired direction
  friction: 10, // per second, ground drag once input is released
  turnLambda: 10, // yaw damping rate; never snap
  slopeLimitDeg: 38, // above this the up-slope component is zeroed
  slopeWallDeg: 55, // above this it is a wall unless `scale` is unlocked
  coastPushback: 1.2, // m/s of soft radial push at the coastline — never a wall
  coastMarginM: 0.8, // how far inside the radius the push begins
  coastEdgeM: 0.15, // and the hard stop, this far inside the drawn sand
  // ── The jump. Space was bound to nothing a player could see; every game
  //    they have played puts a jump there, and a jump is also the universal
  //    way out of a spot the ground has boxed you into.
  jumpSpeed: 4.6, // m/s up at take-off: an apex of about 0.75 m, over a knee-high bump
  gravity: 14, // m/s², a touch heavier than Earth so a hop lands crisply
  airControl: 0.45, // fraction of ground acceleration while airborne
  airWallM: 0.05, // mid-air, only ground this far above Pip's feet stops them
  coyoteS: 0.12, // a jump still counts this long after walking off an edge…
  jumpBufferS: 0.14, // …and a press this long before landing is kept
  stepDownM: 0.35, // ground falling away further than this in one step is a fall, not a stair
  // ── Never stuck. A position the ground refuses in every direction is a bug
  //    in the island, and the player is not the one who should pay for it.
  safeEveryS: 0.2, // how often the last good standing spot is recorded
  trapCheckS: 1.2, // pushing with no progress this long runs the enclosed test…
  trapProgressM: 0.12, // …where "no progress" is less than this much ground covered
  trapProbeM: 0.3, // how far each of the eight escape probes looks
  trapWanderS: 3, // pushing several different ways for this long with nothing gained…
  trapWanderOctants: 3, // …across at least this many of eight directions, also counts
} as const;

/** Speeds and limits owned by individual verbs (`10-CONTROLS-AND-CAMERA.md` §3). */
export const VERB_MOTION = {
  swimSpeed: 1.6, // m/s
  climbSpeed: 1.2, // m/s vertical on a marked face
  mantleMaxHeightM: 2, // ledges below this auto-mantle on contact
  glideMinLedgeM: 4, // gliding needs a drop of at least this
  glideFallSpeed: 1.8, // m/s, clamped
  glideHorizontalSpeed: 3.2, // m/s of air control
  sailSpeed: 3, // m/s in the boat
  caveLanternRadiusM: 6, // lit radius inside the cave
} as const;

// ── Camera (`10-CONTROLS-AND-CAMERA.md` §4) ─────────────────────────────────

export const CAMERA = {
  // 50°, not the diorama's 38: the playtest asked for a world you are *in*, and
  // a telephoto lens holds everything at arm's length. Still never varied per device.
  fov: 50,
  pitchDeg: -18, // the resting tilt at the default zoom, before the ground and the player move it
  distanceM: 6, // default follow distance
  posLambda: 6, // a ceremony shot's settle rate, before `ceremonyLambdaScale`
  // ── The follow rig (2026-09-16 playtest: "when I'm walking and moving the
  //    camera it feels too bad"). The lens used to *chase* its spot in a straight
  //    line: 27° behind the mouse at p95, cutting 10% inside its own orbit. Now it
  //    orbits a pivot — the turn answers the hand at once, only the pivot trails Pip.
  turnLambda: 30, // yaw and a dragged tilt toward where the hand put them: smooth, never elastic
  followLambda: 10, // the pivot after Pip, across the ground — a little give, so a run reads as speed
  followYLambda: 6, // …and up and down, so a jump or a step never jolts the frame
  zoomLambda: 9, // the boom toward the zoom asked for
  leadLambda: 3, // the look-ahead along Pip's travel eases in, so a turn never whips the frame
  releaseLambda: 3.5, // after a cutscene the lens eases back to Pip instead of cutting
  floorLiftOutLambda: 4, // lifted over a bump at once, let down slowly
  snapPivotM: 6, // Pip further than this from the pivot was moved, not walked: follow at once
  runFovKickDeg: 4, // a little wider at a run; never under reduced motion
  fovLambda: 3,
  targetAspect: 390 / 844, // the reference portrait phone (`18-DECISIONS.md` D5)
  aspectDistanceMin: 1.0, // distance multiplier clamp, low end
  aspectDistanceMax: 1.6, // distance multiplier clamp, high end
  portraitLookLiftM: 0.35, // raise the look-at in portrait so the joystick misses Pip
  /**
   * How much slower the ceremony's camera moves than the follow rig.
   * OURS: the spec gives 2 s for the lift, not a damping rate. A shot
   * that settles as fast as a follow camera reads as a snap, not a lift.
   */
  ceremonyLambdaScale: 0.45,
  /**
   * The ceremony's pitch. Higher than the follow camera's -28 degrees:
   * a shot looking DOWN at a mountain does not read as a mountain.
   * OURS.
   */
  ceremonyPitchDeg: 14,
  lookAheadM: 0.6, // the look-at sits this far ahead of Pip, along their facing
  lookHeightFrac: 1.1, // …and a little over their head, so the horizon stays in frame
  occlusionMarginM: 0.4, // pull in to the hit point minus this
  occlusionInLambda: 14, // fast in…
  occlusionOutLambda: 3, // …slow out
  occlusionSamples: 6, // height probes along the boom; 6 is enough for a hillside
  occlusionClearanceM: 0.5, // keep the boom this far above the ground it passes over
  // Never pull closer than this, however steep the slope or dense the wood. Low:
  // 2.2 m was longer than the gap beside Pip in La Arboleda, so the boom stayed
  // outside a trunk that was already between the lens and him.
  occlusionMinM: 1.3,
  /**
   * How solid a tree stays when it is standing between the lens and Pip, and
   * how fast it gets there. `10-CONTROLS-AND-CAMERA.md` §4 asks for a dithered
   * fade *first* and the distance pull-in only for the hard cases; this is the
   * fade. It never reaches zero — a tree you cannot see at all is a tree you
   * walk into.
   */
  // Not lower: an ordered dither at 0.28 discards seven fragments in ten and a
  // trunk stops reading as see-through and starts reading as broken geometry.
  fadeMin: 0.45,
  fadeInLambda: 12, // fast to fade…
  fadeOutLambda: 4, // …slow to come back, like the pull-in
  /** Widen the tested corridor a little, so a trunk fades before it clips. */
  fadeMarginM: 0.25,
  pinchMinM: 2.2, // zoom clamp, near: over the shoulder
  pinchMaxM: 20, // zoom clamp, far: most of the island in frame (the playtest asked for more of both)
  // ── The adaptive rig (2026-09-12 playtest: "the camera angle should be
  //    adaptive, like the rotation"). Pitch is a second axis the player owns,
  //    and when they are not steering it, it follows the zoom and the ground.
  pitchNearDeg: -9, // at the nearest zoom the lens sits low, behind Pip's shoulder…
  pitchFarDeg: -45, // …and at the farthest it looks down over the region
  pitchMinDeg: -72, // the steepest a drag may take it
  pitchMaxDeg: 6, // the flattest: a touch under Pip, to look up a mountain
  pitchLambda: 6, // how fast the pitch eases to where it is going
  slopePitchGain: 0.45, // degrees of tilt per degree of ground rising ahead of Pip
  slopeProbeM: 3, // how far ahead that ground is measured
  slopePitchMaxDeg: 14, // and the most the ground may tilt the lens
  dragYawPerPx: 0.0065, // radians of orbit per pixel dragged sideways
  dragPitchPerPx: 0.0045, // radians of tilt per pixel dragged vertically
  // Zoom is a factor, not metres: a notch is the same step beside Pip and far out.
  wheelZoomPerPx: 0.0015, // e^(delta × this): one 120 px notch is ×1.2
  trackpadZoomPerPx: 0.01, // a trackpad pinch arrives as small ctrl+wheel deltas
  stepZoom: 1.3, // the + / − keys and buttons, per press
  /**
   * **A leash, not a recentre.** The old rig swung itself behind Pip after
   * 2.5 s, and camera-relative input meant every swing changed what W did —
   * which is the "W sometimes goes anywhere" the playtest found. A leash
   * turns the lens only as far as Pip actually moves across it, so walking
   * forward never rotates the world and strafing circles smoothly.
   */
  leashGain: 0.8,
  leashDelayS: 0.6, // after a manual drag the leash waits this long before pulling
} as const;

/** Reduced motion halves every camera damping rate and kills auto-recentring (`16` §3). */
export const REDUCED_MOTION_DAMPING_SCALE = 0.5;

// ── Input (`10-CONTROLS-AND-CAMERA.md` §1) ──────────────────────────────────

export const JOYSTICK = {
  deadZone: 0.1, // below 0.08 you get thumb tremor; above 0.15 the first mm feels dead
  maxRadiusPx: 48, // beyond this needs wrist movement
  runThreshold: 0.85, // fraction of max radius that switches walk to run
  zoneWidthPct: 0.45, // activation zone: the bottom-left 45% of viewport width…
  zoneHeightPct: 0.55, // …and the bottom 55% of its height
  releaseDampMs: 150, // damp input to zero on release; no return animation
  safeAreaMinPx: 16, // floor for the `env(safe-area-inset-bottom)` padding
} as const;

/** Every verb completion fires sound + motion + this haptic (`10` §6). */
export const HAPTIC_MS = 12;

// ── Interaction (`10-CONTROLS-AND-CAMERA.md` §5) ────────────────────────────

export const INTERACT = {
  scanEveryNFrames: 3, // proximity scan cadence; one active interactable at a time
  defaultRadiusM: 2.4, // OURS — the spec says "generous" and gives no figure
  facingWeight: 0.6, // 0 = nearest wins, 1 = facing angle wins; ties break by angle
  buttonMinPx: 48, // touch-target floor (`16-UI-AUDIO-A11Y.md` §3)
  cueBobAmplitudeM: 0.06, // world-space affordance bob; disabled under reduced motion
  cueBobHz: 0.6, // and its rate
} as const;

/** Hold and timing windows per verb (`10-CONTROLS-AND-CAMERA.md` §3). */
export const VERB_TIMING = {
  plantHoldMs: 800, // hold to plant, then the sapling scales up
  logHoldMs: 600, // the census framing reticle converge time
  forageSquashMs: 400, // the node empties and starts its respawn timer
  waterCanUses: 3, // capacity, shown as a small world-space pip on Pip
  fishWaitMinS: 3, // cast, then wait…
  fishWaitMaxS: 10, // …up to this long for the tug
  fishTugWindowMs: 900, // tap inside this to land it
  restAdvanceS: 6, // resting advances time of day one preset over this
  poseCrossfadeMs: 250, // verb pose blend (`09-PIP.md` §3)
} as const;
