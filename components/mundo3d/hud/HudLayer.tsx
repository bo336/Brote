'use client';

import dynamic from 'next/dynamic';

import type { ImpactTotals, JournalEntry } from '@/lib/world/types';
import type { SaveState } from '../placement/usePlacementSave';
import { useSessionStore } from '../state/useSessionStore';
import { BitacoraSheet } from './BitacoraSheet';
import { EventCard } from './EventCard';
import { HUD } from './HUD';
import { MojonSheet } from './MojonSheet';
import { PlacementBar } from './PlacementBar';
import { SettingsSheet } from './SettingsSheet';
import { TierUpOverlay } from './TierUpOverlay';

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
}: HudLayerProps) {
  const hud = useSessionStore((s) => s.hud);
  const setHud = useSessionStore((s) => s.setHud);
  const placement = useSessionStore((s) => s.placement);
  const placementActions = useSessionStore((s) => s.placementActions);
  const eventRun = useSessionStore((s) => s.eventRun);

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
      <HUD
        onOpenSettings={() => setHud('settings')}
        onArrange={() => setHud('placement')}
        onOpenBitacora={() => setHud('bitacora')}
      />
      <BitacoraSheet
        open={hud === 'bitacora'}
        onClose={() => setHud('play')}
        userId={userId}
        tier={tier}
        journal={journal}
        readOnly={readOnly}
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
      <SettingsSheet open={hud === 'settings'} onClose={() => setHud('play')} />
      <MojonSheet
        open={hud === 'mojon'}
        onClose={() => setHud('play')}
        totals={impact}
        tier={tier}
        collectiveWaterL={collectiveWaterL}
      />
      {perf && PerfOverlay && <PerfOverlay />}
    </>
  );
}
