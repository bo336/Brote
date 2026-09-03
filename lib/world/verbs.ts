/**
 * The verb state machine, declared as one table.
 *
 * `10-CONTROLS-AND-CAMERA.md` §2.8: transitions live in one table so illegal
 * transitions are impossible — not a pile of booleans that eventually lets Pip
 * swim while climbing. The renderer reads `poseKey`; the controller reads
 * `speed`; the world reads `requiresFeature`.
 */
import { MOVE, VERB_MOTION } from './config';
import type { FeatureId, PlayerState, VerbId } from './types';

export interface VerbDef {
  id: VerbId;
  /** The movement state this verb puts Pip in. */
  state: PlayerState;
  /** Metres per second while the verb owns movement; `null` = it does not. */
  speed: number | null;
  /** Which pose `PipRig` cross-fades to (`09-PIP.md` §3). */
  poseKey: string;
  /** i18n key for the action button and the "ahora podés…" line. */
  labelKey: string;
  /** The world feature the verb needs. A locked verb gives a hint, not a wall. */
  requiresFeature?: FeatureId;
  /** Audio cue fired on completion (`14-CONTENT.md` §8). */
  sound?: string;
}

export const VERB_TABLE: Record<VerbId, VerbDef> = {
  walk: { id: 'walk', state: 'walk', speed: MOVE.walkSpeed, poseKey: 'walk', labelKey: 'mundo.verb.walk' },
  plant: { id: 'plant', state: 'interact', speed: null, poseKey: 'act', labelKey: 'mundo.verb.plant', sound: 'plant' },
  water: { id: 'water', state: 'interact', speed: null, poseKey: 'act', labelKey: 'mundo.verb.water', sound: 'water_pour' },
  log: { id: 'log', state: 'interact', speed: null, poseKey: 'log', labelKey: 'mundo.verb.log', sound: 'log_shutter' },
  climb: { id: 'climb', state: 'climb', speed: VERB_MOTION.climbSpeed, poseKey: 'climb', labelKey: 'mundo.verb.climb' },
  forage: { id: 'forage', state: 'interact', speed: null, poseKey: 'act', labelKey: 'mundo.verb.forage', sound: 'forage_pick' },
  glide: { id: 'glide', state: 'glide', speed: VERB_MOTION.glideHorizontalSpeed, poseKey: 'glide', labelKey: 'mundo.verb.glide', requiresFeature: 'treehouse' },
  rest: { id: 'rest', state: 'rest', speed: null, poseKey: 'rest', labelKey: 'mundo.verb.rest', requiresFeature: 'hammock' },
  swim: { id: 'swim', state: 'swim', speed: VERB_MOTION.swimSpeed, poseKey: 'swim', labelKey: 'mundo.verb.swim', requiresFeature: 'river', sound: 'water_enter' },
  fish: { id: 'fish', state: 'interact', speed: null, poseKey: 'log', labelKey: 'mundo.verb.fish', requiresFeature: 'pond' },
  scale: { id: 'scale', state: 'climb', speed: VERB_MOTION.climbSpeed, poseKey: 'climb', labelKey: 'mundo.verb.scale', requiresFeature: 'mountain' },
  cave: { id: 'cave', state: 'walk', speed: MOVE.walkSpeed, poseKey: 'walk', labelKey: 'mundo.verb.cave', requiresFeature: 'cave' },
  track: { id: 'track', state: 'walk', speed: MOVE.walkSpeed, poseKey: 'walk', labelKey: 'mundo.verb.track', requiresFeature: 'snow' },
  sail: { id: 'sail', state: 'walk', speed: VERB_MOTION.sailSpeed, poseKey: 'sail', labelKey: 'mundo.verb.sail', requiresFeature: 'boat', sound: 'boat_creak' },
  observe: { id: 'observe', state: 'cutscene', speed: null, poseKey: 'log', labelKey: 'mundo.verb.observe', requiresFeature: 'telescope' },
  mentor: { id: 'mentor', state: 'interact', speed: null, poseKey: 'act', labelKey: 'mundo.verb.mentor', requiresFeature: 'monument' },
};

/**
 * Legal state transitions. Anything not listed is refused — which is how
 * "swimming while climbing" stops being possible rather than merely unlikely.
 */
export const STATE_TRANSITIONS: Record<PlayerState, PlayerState[]> = {
  idle: ['walk', 'run', 'swim', 'climb', 'rest', 'interact', 'cutscene'],
  walk: ['idle', 'run', 'swim', 'climb', 'glide', 'interact', 'cutscene'],
  run: ['idle', 'walk', 'swim', 'climb', 'glide', 'interact', 'cutscene'],
  swim: ['idle', 'walk', 'cutscene'],
  climb: ['idle', 'walk', 'glide', 'cutscene'],
  glide: ['idle', 'walk', 'swim', 'cutscene'],
  rest: ['idle', 'cutscene'],
  interact: ['idle', 'walk', 'cutscene'],
  // A ceremony always ends by handing control back, and never to another script.
  cutscene: ['idle'],
};

/** Is this transition declared? The controller asks before it moves. */
export function canTransition(from: PlayerState, to: PlayerState): boolean {
  if (from === to) return true;
  return STATE_TRANSITIONS[from].includes(to);
}

/** The verb's definition, for the action button and the teaching line. */
export function verbDef(verb: VerbId): VerbDef {
  return VERB_TABLE[verb];
}
