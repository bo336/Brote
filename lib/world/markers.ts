/**
 * Los mojones de proyecto — a stone for every real project you actually went to.
 *
 * `11-GAME-LOOP.md` §5 pillar 5 calls this "the strongest emotional link in the
 * design, and nearly free to build": the island carries a small commemorative
 * marker for each project the player joined, with the date and the place, and
 * walking up to it tells you what you did.
 *
 * Two rules, and both are about honesty rather than layout:
 *
 *  - **Attended, not signed up.** The RPC only counts sessions the player was
 *    actually at. A stone for an intention is an invented memory, and the
 *    island does not invent memories for the same reason it does not invent
 *    figures (`13-IMPACT-MIRROR.md` §1).
 *  - **One per project.** Five stones in a row for five visits does not tell a
 *    better story than one, and the island is small.
 *
 * Placement is here because it is a decision — where a memory sits, and what
 * happens when there are more memories than room.
 */
import { MARKERS } from './config';
import { hashInt, mulberry32 } from './rng';
import type { ProjectMarker } from './types';

/** What the server sends, before the island decides where to put it. */
export interface RawMarker {
  id: string;
  title: string;
  place: string | null;
  date: string;
}

/**
 * Lay the markers out along a path, oldest first.
 *
 * **A line, not a scatter.** Memories in a row read as a walk you can take; the
 * same stones sprinkled across the island read as litter. Oldest nearest the
 * spawn, so walking the line is walking forward in time.
 *
 * The island is small and the line is bounded — past `MARKERS.max` the oldest
 * stop being placed rather than being crammed in. Somebody with forty projects
 * has earned a path, not a graveyard.
 */
export function placeMarkers({
  markers,
  seed,
  spawn,
  radius,
  isGround,
}: {
  markers: readonly RawMarker[];
  seed: number;
  spawn: readonly [number, number];
  /** The island's radius, so the line never walks off the shelf. */
  radius: number;
  isGround?: (x: number, z: number) => boolean;
}): ProjectMarker[] {
  const ordered = [...markers].sort((a, b) => a.date.localeCompare(b.date));
  const shown = ordered.slice(-MARKERS.max);
  const rng = mulberry32(hashInt(`markers:${seed}`));
  // One direction for the whole line, drawn from the island's own seed: the
  // path is in the same place every visit, and a different place per island.
  const heading = rng() * Math.PI * 2;

  const out: ProjectMarker[] = [];
  shown.forEach((m, i) => {
    const along = MARKERS.firstM + i * MARKERS.spacingM;
    if (along > radius * MARKERS.reachFraction) return;
    // A gentle drift, so the line reads as a path somebody walked rather than
    // as a fence somebody measured.
    const drift = (rng() - 0.5) * MARKERS.driftM;
    const x = spawn[0] + Math.cos(heading) * along + Math.cos(heading + Math.PI / 2) * drift;
    const z = spawn[1] + Math.sin(heading) * along + Math.sin(heading + Math.PI / 2) * drift;
    if (isGround && !isGround(x, z)) return;
    out.push({ ...m, x, z });
  });
  return out;
}

/**
 * The one line a marker says, as parts the caller translates.
 *
 * Kept as data rather than a formatted string so the copy stays in
 * `messages/es.json` — and so a marker with no place reads as a sentence
 * rather than as a sentence with a hole in it.
 */
export function markerLine(m: ProjectMarker): { key: string; values: Record<string, string> } {
  return m.place
    ? { key: 'marker.linePlace', values: { title: m.title, place: m.place, date: m.date } }
    : { key: 'marker.line', values: { title: m.title, date: m.date } };
}
