'use client';

import { create } from 'zustand';

/**
 * Floating tags over things in the world: what a pad still needs, what a parcel
 * asks for next, who has something to tell you.
 *
 * Two halves that never re-render each other: the **content** of a tag lives in
 * this small store and changes only when the game state does; its **position**
 * is projected every frame by `TagProjector` inside the canvas and written
 * straight to the element's style. A tag that follows the camera through React
 * state would re-render the HUD sixty times a second.
 */
export type TagTone = 'site' | 'parcel' | 'cast' | 'station' | 'alert';

export interface WorldTag {
  id: string;
  x: number;
  y: number;
  z: number;
  title: string;
  /** Short lines under the title: "3 ramas", "2 reciclado". */
  lines?: string[];
  tone: TagTone;
  /** Beyond this many metres from Pip the tag hides. */
  within: number;
  /** A small badge (the "!" over a character with something to say). */
  badge?: string;
}

interface TagStore {
  tags: Map<string, WorldTag>;
  version: number;
  set: (tag: WorldTag) => void;
  remove: (id: string) => void;
  clearPrefix: (prefix: string) => void;
  /** Replace every tag under a prefix in one go, and only if anything changed. */
  setMany: (prefix: string, tags: WorldTag[]) => void;
}

function same(a: WorldTag | undefined, b: WorldTag): boolean {
  return !!a && a.x === b.x && a.y === b.y && a.z === b.z && a.title === b.title && a.tone === b.tone &&
    a.within === b.within && a.badge === b.badge && (a.lines ?? []).join('|') === (b.lines ?? []).join('|');
}

export const useTags = create<TagStore>((set, get) => ({
  tags: new Map(),
  version: 0,
  set: (tag) => {
    if (same(get().tags.get(tag.id), tag)) return;
    const tags = new Map(get().tags);
    tags.set(tag.id, tag);
    set({ tags, version: get().version + 1 });
  },
  remove: (id) => {
    if (!get().tags.has(id)) return;
    const tags = new Map(get().tags);
    tags.delete(id);
    set({ tags, version: get().version + 1 });
  },
  setMany: (prefix, list) => {
    const current = get().tags;
    let changed = false;
    const seen = new Set<string>();
    for (const t of list) {
      seen.add(t.id);
      if (!same(current.get(t.id), t)) changed = true;
    }
    for (const id of current.keys()) if (id.startsWith(prefix) && !seen.has(id)) changed = true;
    if (!changed) return;
    const tags = new Map([...current].filter(([id]) => !id.startsWith(prefix)));
    for (const t of list) tags.set(t.id, t);
    set({ tags, version: get().version + 1 });
  },
  clearPrefix: (prefix) => {
    const tags = new Map(get().tags);
    let changed = false;
    for (const id of tags.keys()) {
      if (id.startsWith(prefix)) {
        tags.delete(id);
        changed = true;
      }
    }
    if (changed) set({ tags, version: get().version + 1 });
  },
}));

/** The DOM element of each tag, registered by the HUD, positioned by the projector. */
export const tagElements = new Map<string, HTMLElement>();
