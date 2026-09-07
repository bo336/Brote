/**
 * Every object in the world that has a name and a description.
 *
 * "Every object in the world has a name and a description (Animal Crossing's
 * density rule) — cheap content that makes a small island feel rich"
 * (`11-GAME-LOOP.md` §3.3). Species already had theirs in `species.ts`; props
 * had a name and no description, and the nineteen structural features had
 * neither.
 *
 * This module is **the list of what must have copy**, not the copy itself —
 * that ships from `messages/es.json` like every other string. Its whole job is
 * to give `__tests__/things.test.ts` something to check against, so the density
 * rule is enforced rather than remembered.
 */
import { PROP_IDS } from './progression';
import type { FeatureId, PropId } from './types';

/** The nineteen structural features, in ladder order. */
export const FEATURE_IDS: readonly FeatureId[] = [
  'mojon', 'puddle', 'bench', 'compost', 'nest', 'treehouse', 'hammock',
  'river', 'pond', 'bridge', 'waterfall', 'mountain', 'cave', 'snow',
  'islet', 'boat', 'telescope', 'aurora', 'monument',
];

/** Everything a player can walk up to and be told about. */
export type ThingId = PropId | FeatureId;

export const THING_IDS: readonly ThingId[] = [...PROP_IDS, ...FEATURE_IDS];

/**
 * The i18n key for a thing, **relative to the `mundo` namespace** — the same
 * convention every `labelKey` in the world uses.
 */
export function thingNameKey(id: ThingId): string {
  return `thing.${id}.name`;
}

export function thingDescKey(id: ThingId): string {
  return `thing.${id}.desc`;
}
