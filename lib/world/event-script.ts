/**
 * The six events, as scripts.
 *
 * `14-CONTENT.md` §5 writes all six out in full. What they have in common — and
 * what makes one runtime enough for all of them — is the sentence in §5.1:
 * every decision is **"answered by moving Pip to a place, never by tapping an
 * option"**. So an event is a list of stages; a stage puts a few things in the
 * world and waits for the player to walk to one.
 *
 * The rules that bound all six (`11-GAME-LOOP.md` §3.7) are properties of this
 * shape rather than of any one script:
 *
 *  - **Never blocking** — a stage can always be left; `skippable` is not a flag
 *    because there is no event that is not.
 *  - **Failure is never punitive** — a wrong spot costs seconds and never
 *    progress, and every payout has a floor above zero.
 *  - **Nothing is permanently lost** — no stage removes a species, a placement
 *    or a region, and the only thing an event can change is scenery that
 *    regrows.
 *
 * The scripts are pure data so `__tests__/event-script.test.ts` can hold them to
 * all three at once, for every event, rather than six code reviews.
 */
import {
  CRECIENTE, EVENT_MIN_GAP_DAYS, INCENDIO, NIDO, RESIDUOS, SEQUIA, VISITANTE,
} from './config';
import type { EventId, RegionId } from './types';

/**
 * Where a spot goes, said relative to the island rather than in metres.
 *
 * Scripts cannot hold coordinates: every island is a different island, and a
 * hard-coded x/z that lands in the lagoon on one seed is the same bug the
 * chores had. The runtime resolves these against the layout it has.
 */
export interface SpotAnchor {
  /** A region's centre, an island anchor's position, or the spawn. */
  ref: 'region' | 'anchor' | 'spawn';
  /** Which region or which feature, when `ref` needs one. */
  id?: string;
  /** Radians around the reference point. */
  angle: number;
  /** Metres out from it. */
  dist: number;
}

export interface EventSpot {
  id: string;
  /** i18n key, relative to `mundo`. What the action button says here. */
  labelKey: string;
  at: SpotAnchor;
}

export interface EventStage {
  id: string;
  /** The one line shown while this stage is live. */
  promptKey: string;
  spots: EventSpot[];
  /**
   * The spots that advance the stage. **Every stage has at least one.**
   *
   * A stage whose every spot is wrong is a stage nobody can finish, which is
   * the definition of blocking.
   */
  correct: string[];
  /** The line a wrong choice gets. Never a telling-off; often the teaching. */
  wrongKey?: string;
}

export interface EventScript {
  id: EventId;
  /** `mundo.event.<id>` — the title. */
  titleKey: string;
  region: RegionId;
  stages: EventStage[];
  /** Semillas on a clean run and on a run with a wrong turn. Never zero. */
  payout: number;
  payoutImperfect: number;
  /** The one line afterwards, for the events that teach something. */
  learnKey?: string;
  startKey: string;
  endKey: string;
  /** Seconds a wrong choice costs. Time, never progress. */
  wrongCostS: number;
}

/** Twelve items and four bins, from §5.4. The sort is the assessment. */
const RESIDUOS_ITEMS = [
  ['botella_pet', 'reciclable'], ['pila', 'peligroso'], ['manzana', 'organico'],
  ['telgopor', 'no_reciclable'], ['lata', 'reciclable'], ['bolsa', 'no_reciclable'],
  ['cascara_huevo', 'organico'], ['envase_yogur', 'reciclable'], ['colilla', 'peligroso'],
  ['carton_mojado', 'no_reciclable'], ['red_pesca', 'no_reciclable'], ['frasco_vidrio', 'reciclable'],
] as const;

const BINS = ['reciclable', 'organico', 'peligroso', 'no_reciclable'] as const;

/** The four bins, in a row on the sand. */
function binSpots(): EventSpot[] {
  return BINS.map((bin, i) => ({
    id: `bin_${bin}`,
    labelKey: `event.residuos.bin.${bin}`,
    at: { ref: 'region', id: 'islote', angle: (i - 1.5) * 0.32, dist: 7 } as SpotAnchor,
  }));
}

/** One stage per item: pick it up by walking to the bin it belongs in. */
function residuosStages(): EventStage[] {
  return RESIDUOS_ITEMS.map(([item, bin]) => ({
    id: item,
    promptKey: `event.residuos.item.${item}`,
    spots: binSpots(),
    correct: [`bin_${bin}`],
    // Not scored mid-task (§5.4): the line explaining why comes at the end.
    wrongKey: `event.residuos.why.${item}`,
  }));
}

export const EVENT_SCRIPTS: Record<EventId, EventScript> = {
  /**
   * El incendio — the flagship. Three decision points, each a real piece of
   * fire behaviour, each answered by walking to the right side of the front.
   */
  incendio: {
    id: 'incendio',
    titleKey: 'event.incendio.title',
    region: 'arboleda',
    startKey: 'event.incendio.start',
    endKey: 'event.incendio.end',
    learnKey: 'event.incendio.learn',
    payout: INCENDIO.payout,
    payoutImperfect: INCENDIO.payoutImperfect,
    wrongCostS: INCENDIO.wrongChoiceCostS,
    stages: [
      {
        id: 'break',
        promptKey: 'event.incendio.q1',
        // Fire spreads fastest with the wind; you cut ahead of the front, on
        // the downwind side. The wind sock and the drifting smoke say which.
        spots: [
          { id: 'downwind', labelKey: 'event.incendio.rake', at: { ref: 'region', id: 'arboleda', angle: 0.6, dist: 6 } },
          { id: 'upwind', labelKey: 'event.incendio.rake', at: { ref: 'region', id: 'arboleda', angle: 0.6 + Math.PI, dist: 6 } },
        ],
        correct: ['downwind'],
        wrongKey: 'event.incendio.w1',
      },
      {
        id: 'brush',
        promptKey: 'event.incendio.q2',
        // Dry fine fuel carries fire into a canopy. Removing it beats wetting
        // it when the water is three cans deep.
        spots: [
          { id: 'drag', labelKey: 'event.incendio.drag', at: { ref: 'region', id: 'arboleda', angle: 2.1, dist: 4.5 } },
          { id: 'water', labelKey: 'event.incendio.water', at: { ref: 'region', id: 'arboleda', angle: 3.4, dist: 4.5 } },
        ],
        correct: ['drag'],
        wrongKey: 'event.incendio.w2',
      },
      {
        id: 'spots',
        promptKey: 'event.incendio.q3',
        // Fine dry fuel goes exponential; a smoulder in damp litter does not.
        spots: [
          { id: 'grass', labelKey: 'event.incendio.douse', at: { ref: 'region', id: 'arboleda', angle: 4.9, dist: 7 } },
          { id: 'litter', labelKey: 'event.incendio.douse', at: { ref: 'region', id: 'arboleda', angle: 5.8, dist: 7 } },
        ],
        correct: ['grass'],
        wrongKey: 'event.incendio.w3',
      },
    ],
  },

  /** La creciente — three animals up, two sandbags down. Nothing to get wrong. */
  creciente: {
    id: 'creciente',
    titleKey: 'event.creciente.title',
    region: 'rio',
    startKey: 'event.creciente.start',
    endKey: 'event.creciente.end',
    learnKey: 'event.creciente.learn',
    payout: CRECIENTE.payout,
    payoutImperfect: CRECIENTE.payout,
    wrongCostS: 0,
    stages: [
      ...[0, 1, 2].map((i) => ({
        id: `animal_${i}`,
        promptKey: 'event.creciente.animal',
        spots: [{
          id: `high_${i}`,
          labelKey: 'event.creciente.carry',
          at: { ref: 'region', id: 'rio', angle: 1.1 + i * 1.9, dist: 5 + i } as SpotAnchor,
        }],
        correct: [`high_${i}`],
      })),
      ...[0, 1].map((i) => ({
        id: `sandbag_${i}`,
        promptKey: 'event.creciente.sandbag',
        spots: [{
          id: `bank_${i}`,
          labelKey: 'event.creciente.place',
          at: { ref: 'anchor', id: 'bridge', angle: i * Math.PI, dist: 3 } as SpotAnchor,
        }],
        correct: [`bank_${i}`],
      })),
    ],
  },

  /** El nido caído — pure observation, no learning gate, no penalty. */
  nido: {
    id: 'nido',
    titleKey: 'event.nido.title',
    region: 'arboleda',
    startKey: 'event.nido.start',
    endKey: 'event.nido.end',
    payout: NIDO.payout,
    payoutImperfect: NIDO.payout,
    wrongCostS: 0,
    stages: [{
      id: 'tree',
      promptKey: 'event.nido.q',
      spots: [0, 1, 2].map((i) => ({
        id: `tree_${i}`,
        labelKey: 'event.nido.place',
        at: { ref: 'region', id: 'arboleda', angle: i * 2.1, dist: 5 } as SpotAnchor,
      })),
      // Only one has the matching fork and the down feathers at its base.
      correct: ['tree_1'],
      wrongKey: 'event.nido.wrong',
    }],
  },

  /** Residuos en la playa — twelve items, four bins, the sort is the test. */
  residuos: {
    id: 'residuos',
    titleKey: 'event.residuos.title',
    region: 'islote',
    startKey: 'event.residuos.start',
    endKey: 'event.residuos.end',
    learnKey: 'event.residuos.learn',
    payout: RESIDUOS.payout,
    payoutImperfect: RESIDUOS.payout,
    wrongCostS: 0,
    stages: residuosStages(),
  },

  /** La sequía — who gets the water. Nothing dies; the droopy ones recover. */
  sequia: {
    id: 'sequia',
    titleKey: 'event.sequia.title',
    region: 'jardin',
    startKey: 'event.sequia.start',
    endKey: 'event.sequia.end',
    learnKey: 'event.sequia.learn',
    payout: SEQUIA.payout,
    payoutImperfect: SEQUIA.payout,
    wrongCostS: 0,
    stages: [0, 1, 2].map((day) => ({
      id: `day_${day}`,
      promptKey: 'event.sequia.q',
      spots: [
        {
          id: `new_${day}`,
          labelKey: 'event.sequia.water',
          at: { ref: 'region', id: 'jardin', angle: day * 2.0, dist: 4 } as SpotAnchor,
        },
        {
          id: `old_${day}`,
          labelKey: 'event.sequia.water',
          at: { ref: 'region', id: 'jardin', angle: day * 2.0 + 1.1, dist: 5.5 } as SpotAnchor,
        },
      ],
      // Deep roots survive a dry spell; the newly planted ones do not.
      correct: [`new_${day}`],
      wrongKey: 'event.sequia.wrong',
    })),
  },

  /** La visitante — the cozy one. Gentle, short, and impossible to fail. */
  visitante: {
    id: 'visitante',
    titleKey: 'event.visitante.title',
    region: 'claro',
    startKey: 'event.visitante.start',
    endKey: 'event.visitante.end',
    payout: VISITANTE.payout,
    payoutImperfect: VISITANTE.payout,
    wrongCostS: 0,
    stages: [
      {
        id: 'meet',
        promptKey: 'event.visitante.meet',
        spots: [{ id: 'shore', labelKey: 'event.visitante.greet', at: { ref: 'region', id: 'claro', angle: 0.4, dist: 8 } }],
        correct: ['shore'],
      },
      {
        id: 'sit',
        promptKey: 'event.visitante.sit',
        spots: [{ id: 'bench', labelKey: 'event.visitante.sitdown', at: { ref: 'anchor', id: 'bench', angle: 0, dist: 1.2 } }],
        correct: ['bench'],
      },
    ],
  },
};

/** Every script, for the tests and for the runtime's lookup. */
export const EVENT_SCRIPT_LIST: readonly EventScript[] = Object.values(EVENT_SCRIPTS);

/** How many stages an event has. Its length, in decisions rather than seconds. */
export function stageCount(id: EventId): number {
  return EVENT_SCRIPTS[id].stages.length;
}

/**
 * What an event pays. Never zero, and a wrong turn costs the difference
 * between a clean run and an imperfect one — nothing more.
 */
export function payoutFor(id: EventId, mistakes: number): number {
  const script = EVENT_SCRIPTS[id];
  return mistakes > 0 ? script.payoutImperfect : script.payout;
}

export { EVENT_MIN_GAP_DAYS };
