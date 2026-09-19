'use client';

import { useEffect, useMemo } from 'react';

import { pipStageForTier } from '@/lib/mundo';
import { biomeConfig } from '@/lib/world/biome';
import { queueFor } from '@/lib/world/ceremony';
import { ZERO_IMPACT } from '@/lib/world/impact';
import type { ImpactTotals, WorldPayload } from '@/lib/world/types';
import { usePlayerStore } from './usePlayerStore';
import { useSessionStore } from './useSessionStore';
import { useWorldStore } from './useWorldStore';

/**
 * Everything a `WorldPayload` does to the stores, in one place.
 *
 * `MundoGame` is composition and lifecycle — the canvas, the quality monitor,
 * the frameloop, the disposal. Turning one server payload into world state,
 * Pip's look, a balance and a queue of owed ceremonies is a different job with
 * a different reason to change, and it had grown to a third of that file.
 *
 * **The world reads this and never writes it** (`15-DATA-MODEL.md` §1).
 * `mundo_state` belongs to Postgres, which recomputes it whenever a real action
 * is verified in the app.
 */

/** The tiers that light Pip up, from `08-WORLD-AND-PROGRESSION.md` §5.1. */
const AURA_TIER = 8;
const GOLDEN_TIER = 11;

export interface HydratedWorld {
  userId: string;
  tier: number;
  worldIndex: number;
  liveliness: number;
  impact: ImpactTotals;
  /** The biome's own name, for the share card. Never derived from a string. */
  biomeName: string;
  /**
   * The ground colour of the world being left, for the palette wash.
   *
   * Only meaningful while a world completion is owed: `biomeConfig(n - 1)` is
   * the biome this island wore last visit, and the wash runs from it to the one
   * it wears now.
   */
  previousBiome: string;
}

export function useHydrateWorld({
  payload,
  userId,
  tier,
  worldIndex,
  liveliness,
}: {
  payload?: WorldPayload;
  /** The preview route's fallbacks, for a world nobody owns. */
  userId: string;
  tier: number;
  worldIndex: number;
  liveliness: number;
}): HydratedWorld {
  const hydrate = useWorldStore((s) => s.hydrate);
  const setAppearance = usePlayerStore((s) => s.setAppearance);
  const setSemillas = usePlayerStore((s) => s.setSemillas);
  const setCosmetics = usePlayerStore((s) => s.setCosmetics);
  const queueCeremonies = useSessionStore((s) => s.queueCeremonies);
  const nextCeremony = useSessionStore((s) => s.nextCeremony);

  /**
   * Derived once from server state. It cannot change during play: a real action
   * completes in the app, never in here. The payload is the truth when there is
   * one; the loose values are the preview route's way of asking for a world
   * nobody owns.
   */
  const world = useMemo<HydratedWorld>(() => {
    const index = payload?.worldIndex ?? worldIndex;
    return {
      userId: payload?.userId ?? userId,
      tier: payload?.tier ?? tier,
      worldIndex: index,
      liveliness: payload?.liveliness ?? liveliness,
      impact: payload?.impact ?? ZERO_IMPACT,
      biomeName: biomeConfig(index).name,
      previousBiome: biomeConfig(Math.max(1, index - 1)).chalked.grass,
    };
  }, [payload, userId, tier, worldIndex, liveliness]);

  useEffect(() => {
    hydrate(world);
  }, [hydrate, world]);

  /** The balance and the look Pip already has, straight from the server. */
  useEffect(() => {
    if (!payload) return;
    setSemillas(payload.semillas);
    setCosmetics(payload.pip);
  }, [payload, setSemillas, setCosmetics]);

  /**
   * **Pip's stage.** The store defaults to `seed`, `applyStage` hides the leaves
   * at seed, and nothing ever called this — so Pip was a bare ball at tier 11
   * with the sprout that gives the game its name missing entirely. The stage
   * comes from `lib/mundo.ts`, the same function the profile uses, so the Pip in
   * the world and the Pip on the profile can never disagree.
   */
  useEffect(() => {
    setAppearance({
      stage: pipStageForTier(world.tier),
      golden: world.tier >= GOLDEN_TIER,
      aura: world.tier >= AURA_TIER,
    });
  }, [setAppearance, world.tier]);

  /**
   * A tier reached but not yet celebrated plays **the next time the player
   * enters `/mundo`** (`08-WORLD-AND-PROGRESSION.md` §5), which is here. The
   * queue is drained one at a time, oldest first, and `world_mark_celebrated`
   * is what stops it playing twice.
   */
  useEffect(() => {
    if (!payload) return;
    const queue = queueFor(
      payload.celebratedTier,
      payload.tier,
      payload.celebratedWorld,
      payload.worldIndex,
    );
    if (queue.length === 0) return;
    queueCeremonies(queue);
    nextCeremony();
  }, [payload, queueCeremonies, nextCeremony]);

  return world;
}
