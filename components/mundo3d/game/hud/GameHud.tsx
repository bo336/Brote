'use client';

import { JOYSTICK } from '@/lib/world/config';
import { useSessionStore } from '../../state/useSessionStore';
import { useCeiboGreeting } from '../useCeiboGreeting';
import { useGameFeedback } from '../useGameFeedback';
import { DialogCard } from './DialogCard';
import { IslaSheet } from './IslaSheet';
import { MissionCard } from './MissionCard';
import { SortGame } from './SortGame';
import { StationSheet } from './StationSheet';
import { TagLayer } from './TagLayer';
import { Gains, Toasts } from './Toasts';

/**
 * The game's part of the HUD: the tags over things in the world, the mission
 * card, the floating gains and the toasts during play; and its screens (the
 * island sheet, a station's panel, the sorting game, a character talking)
 * when one is open.
 */
export function GameHud() {
  useGameFeedback();
  useCeiboGreeting();
  const hud = useSessionStore((s) => s.hud);
  const playing = hud === 'play';
  const top = `calc(max(env(safe-area-inset-top), ${JOYSTICK.safeAreaMinPx}px) + 56px)`;
  return (
    <>
      {playing && <TagLayer />}
      {playing && <MissionCard />}
      <Gains />
      <Toasts top={top} />
      <IslaSheet />
      <StationSheet />
      <SortGame />
      <DialogCard />
    </>
  );
}
