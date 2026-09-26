'use client';

import dynamic from 'next/dynamic';

import type { ImpactTotals, JournalEntry } from '@/lib/world/types';
import type { SaveState } from '../placement/usePlacementSave';
import { useSessionStore } from '../state/useSessionStore';
import { BitacoraSheet } from './BitacoraSheet';
import { ControlsHelp } from './ControlsHelp';
import { GameHud } from '../game/hud/GameHud';
import { RegionTitle } from './RegionTitle';
import { RewardToast } from './RewardToast';
import { EventCard } from './EventCard';
import { HUD } from './HUD';
import { useCollective } from './useCollective';
import { useGiftInbox } from './useGiftInbox';
import { MojonSheet } from './MojonSheet';
import { PlacementBar } from './PlacementBar';
import { SettingsSheet } from './SettingsSheet';
import { TierUpOverlay } from './TierUpOverlay';
import { VisitHud } from '../visit/VisitHud';
import type { VisitSession } from '../visit/useVisit';

/**
 * Everything drawn over the canvas.
 *
 * Split out of `MundoGame` so that file stays what it says it is — the canvas,
 * the quality monitor, the frameloop and the disposal — and so the 400-line
 * rule (`01-RULES.md` §2) is met by cutting on a seam rather than by squeezing.
 *
 * The HUD proper is still four elements (`16-UI-AUDIO-A11Y.md` §1). What is
 * assembled here are the things that *replace* it for a moment: the placement
 * bar, the two sheets, and the ceremony's cards. Only one of them is ever up.
 */
const PerfOverlay = dynamic(() => import('../dev/PerfOverlay').then((m) => m.PerfOverlay), { ssr: false });

export interface HudLayerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  impact: ImpactTotals;
  tier: number;
  worldIndex: number;
  biomeName: string;
  worldGrowth: number;
  worldGoal: number;
  collectiveWaterL: number;
  saveState: SaveState;
  /** The bootstrap failed and this island is a default. Nothing may write. */
  readOnly: boolean;
  /** Whose census it is — a dismissed suggestion is remembered per player. */
  userId: string;
  /** The census, straight from `world_bootstrap`. */
  journal: readonly JournalEntry[];
  perf: boolean;
  /** Somebody else's island. Replaces this layer with the visitor's four controls. */
  visit?: VisitSession;
}

export function HudLayer({
  canvasRef,
  impact,
  tier,
  worldIndex,
  biomeName,
  worldGrowth,
  worldGoal,
  collectiveWaterL,
  saveState,
  readOnly,
  userId,
  journal,
  perf,
  visit,
}: HudLayerProps) {
  const hud = useSessionStore((s) => s.hud);
  const setHud = useSessionStore((s) => s.setHud);
  const placement = useSessionStore((s) => s.placement);
  const placementActions = useSessionStore((s) => s.placementActions);
  const eventRun = useSessionStore((s) => s.eventRun);
  const firstRun = useSessionStore((s) => s.firstRun);
  // What everybody's real actions add up to. Not a leaderboard: no ranking, no
  // comparison, no name on any figure.
  const collective = useCollective(readOnly);
  // Anything a friend left in your set while you were away. One line, once.
  useGiftInbox(readOnly || visit !== undefined);

  /**
   * A visit is not this HUD with things switched off — it is a different
   * screen, and returning early is what makes that true rather than promised.
   * Nothing below this line can be reached from somebody else's island.
   */
  if (visit) {
    return (
      <>
        <VisitHud visit={visit} />
        {perf && <PerfOverlay />}
      </>
    );
  }

  return (
    <>
      <TierUpOverlay
        canvasRef={canvasRef}
        totals={impact}
        worldIndex={worldIndex}
        biomeName={biomeName}
        growth={worldGrowth}
        goal={worldGoal}
      />
      <HUD onOpenBitacora={() => setHud('bitacora')} />
      {/* What to do, how to do it, and that it worked. */}
      {/* The game: mission card, tags, gains, toasts, and its screens. */}
      <GameHud />
      {hud === 'play' && <ControlsHelp />}
      <RegionTitle />
      <RewardToast />
      <BitacoraSheet
        open={hud === 'bitacora'}
        onClose={() => setHud('play')}
        userId={userId}
        tier={tier}
        journal={journal}
        readOnly={readOnly}
        canArrange={placement.props.length > 0}
        onArrange={() => setHud('placement')}
        onOpenSettings={() => setHud('settings')}
        worldIndex={worldIndex}
        worldGrowth={worldGrowth}
        worldGoal={worldGoal}
      />
      {hud === 'placement' && placementActions && (
        <PlacementBar
          props={placement.props}
          hasGhost={placement.hasGhost}
          rejected={placement.rejected}
          remaining={placement.remaining}
          canUndo={placement.canUndo}
          slots={placement.slots}
          saveState={saveState}
          onPick={placementActions.pick}
          onRotate={placementActions.rotate}
          onCommit={placementActions.commit}
          onCancel={placementActions.cancel}
          onUndo={placementActions.undo}
          onUseSlot={placementActions.useSlot}
          onExit={() => setHud('play')}
        />
      )}
      {eventRun?.script && <EventCard run={eventRun} />}
      {/* The first three minutes. Above the HUD in the tree and below it in
          the frame: it never covers the joystick, because the beat that
          matters most is the one where you walk. */}
      {firstRun && hud === 'play' && null}
      <SettingsSheet open={hud === 'settings'} onClose={() => setHud('play')} />
      <MojonSheet
        open={hud === 'mojon'}
        onClose={() => setHud('play')}
        totals={impact}
        tier={tier}
        collectiveWaterL={collective || collectiveWaterL}
      />
      {perf && PerfOverlay && <PerfOverlay />}
    </>
  );
}
