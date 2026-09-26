'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { GAME } from '@/lib/world/game/config';
import type { GameSpots } from '@/lib/world/game/spots';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { CameraShot, FollowCamera } from '../../control/FollowCamera';
import { hasHeldInput } from '../../control/useInput';
import { playerTransform } from '../../state/usePlayerStore';
import { useGameUi } from '../useGameUi';
import { castPositions } from './MissionGuide';

/**
 * The camera, when a game screen opens over the world.
 *
 * A station's panel is a bottom sheet over two thirds of the screen, and the
 * follow camera — aimed at Pip, who is standing on the station — put the sea
 * in the third that was left. Now the station is framed in that third: the lens
 * looks at a point under it, so it sits high in the frame, above the sheet.
 *
 * A conversation frames the two of them side by side, over the shoulder, with
 * the dialogue card underneath. Closing the screen gives the camera back, and
 * so does walking: pushing a direction while one is open closes it, the way
 * stepping away from a counter ends the conversation.
 */
export function Framing({
  cameraRef,
  spots,
  heightfield,
  reducedMotion,
}: {
  cameraRef: React.MutableRefObject<FollowCamera | null>;
  spots: GameSpots;
  heightfield: Heightfield;
  reducedMotion: boolean;
}) {
  const screen = useGameUi((s) => s.screen);
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = performance.now();
    const follow = cameraRef.current;
    // A ceremony owns the camera while it runs; a game screen never takes it from one.
    if (!follow || !screen || follow.inShot) return;
    const p = playerTransform;
    const f = GAME.framing;
    if (screen.kind === 'estacion') {
      const spot = spots.stations[screen.station];
      if (!spot) return;
      const y = sampleHeight(heightfield, spot.x, spot.z);
      // From where Pip stands, looking at the station.
      const yaw = Math.atan2(spot.x - p.x, spot.z - p.z) || spot.rotY + Math.PI;
      follow.takeOver({ x: spot.x, y: y - f.stationDropM, z: spot.z, distance: f.stationDistanceM, yaw, pitchDeg: f.stationPitchDeg, orbit: 0 }, reducedMotion);
    } else if (screen.kind === 'dialogo') {
      const who = castPositions.get(screen.dialog.who);
      if (!who) return;
      const mx = (who.x + p.x) / 2;
      const mz = (who.z + p.z) / 2;
      // Side-on to the line between them, so both faces are in the shot.
      const yaw = Math.atan2(who.x - p.x, who.z - p.z) + f.talkSideRad;
      follow.takeOver({ x: mx, y: p.y + f.talkLookUpM, z: mz, distance: f.talkDistanceM, yaw, pitchDeg: f.talkPitchDeg, orbit: 0 }, reducedMotion);
    } else {
      return;
    }
    return () => follow.release();
  }, [screen, cameraRef, spots, heightfield, reducedMotion]);

  // The account-less preview can aim the lens anywhere, for close-up reviews.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.pathname.startsWith('/offline')) return;
    const w = window as unknown as { __frame?: (s: CameraShot | null) => void };
    w.__frame = (s) => (s ? cameraRef.current?.takeOver(s, true) : cameraRef.current?.release());
    return () => {
      delete w.__frame;
    };
  }, [cameraRef]);

  useFrame(() => {
    const kind = useGameUi.getState().screen?.kind;
    if (kind !== 'estacion' && kind !== 'dialogo') return;
    // A key still held from walking up to it must not close it on the first frame.
    if (performance.now() - openedAt.current < GAME.framing.walkAwayGraceMs) return;
    if (hasHeldInput()) useGameUi.getState().close();
  });

  return null;
}
