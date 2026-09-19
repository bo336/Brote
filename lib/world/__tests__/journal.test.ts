import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { completedDomains, pagesFor, progressFor, speciesFor, suggestionFor } from '../journal';
import { cumulativeState } from '../progression';
import { SPECIES } from '../species';
import type { JournalEntry } from '../types';

function seen(slug: string): JournalEntry {
  const s = SPECIES.find((x) => x.slug === slug)!;
  return {
    species_slug: slug,
    first_seen_at: '2026-09-07T12:00:00Z',
    region: s.region,
    time_of_day: s.time_of_day[0]!,
    count: 1,
  };
}

/** Every species the player can actually reach at this tier. */
function reachable(tier: number): string[] {
  return cumulativeState(tier).species;
}

test('the catalogue is bounded by tier, and refreshes as it rises', () => {
  // §3.3: bounded per tier and refreshed at each tier, which is what makes an
  // unlock read as new content rather than a new texture.
  const small = pagesFor(2, []).reduce((n, p) => n + p.total, 0);
  const big = pagesFor(9, []).reduce((n, p) => n + p.total, 0);
  assert.ok(small > 0);
  assert.ok(big > small, `${big} should exceed ${small}`);
  assert.equal(big, reachable(9).length);
});

test('unseen species are listed as silhouettes, never hidden', () => {
  const pages = pagesFor(3, []);
  const lines = pages.flatMap((p) => p.lines);
  assert.ok(lines.length > 0);
  assert.ok(lines.every((l) => !l.seen && l.entry === null));
  // The name and the blurb exist for every one of them — that is the density
  // rule, and it is what makes an empty page worth walking around for.
  assert.ok(lines.every((l) => l.species.name_es.length > 0 && l.species.blurb_es.length > 0));
});

test('a sighting lands on its own region page and nowhere else', () => {
  const slug = reachable(2)[0]!;
  const species = SPECIES.find((s) => s.slug === slug)!;
  const pages = pagesFor(2, [seen(slug)]);
  for (const page of pages) {
    const hit = page.lines.filter((l) => l.seen);
    if (page.region === species.region) assert.equal(hit.length, 1);
    else assert.equal(hit.length, 0, `${page.region} should be untouched`);
  }
});

test('pages come back in ladder order, not map order', () => {
  const order = pagesFor(11, []).map((p) => p.region);
  assert.equal(order[0], 'claro');
  assert.deepEqual(order, [...new Set(order)], 'a region appears once');
});

test('a region is complete only when every one of its species is logged', () => {
  const tier = 2;
  const all = reachable(tier).map(seen);
  const pages = pagesFor(tier, all);
  assert.ok(pages.every((p) => p.complete), 'everything logged should complete every page');

  const partial = pagesFor(tier, all.slice(0, all.length - 1));
  assert.ok(partial.some((p) => !p.complete), 'one missing should leave one page open');
});

test('progress counts only what the tier can reach', () => {
  const p = progressFor(3, reachable(3).map(seen));
  assert.equal(p.seen, p.total);
  assert.equal(p.total, reachable(3).length);
  // Logging something from above the tier cannot push it past full.
  const above = SPECIES.find((s) => s.min_tier > 3)!;
  const q = progressFor(3, [...reachable(3).map(seen), seen(above.slug)]);
  assert.equal(q.seen, q.total);
});

test('**a completed domain suggests one real action, once**', () => {
  const tier = 2;
  const all = reachable(tier).map(seen);
  const done = completedDomains(tier, all);
  assert.ok(done.length > 0, 'logging everything should complete at least one domain');

  // One at a time, never a queue: three sets finished together is one nudge.
  const first = suggestionFor(tier, all);
  assert.equal(first, done[0]);

  // Dismissed is never repeated — that is the whole of "once".
  const after = suggestionFor(tier, all, done);
  assert.equal(after, null);
});

test('a domain the tier cannot finish is never called complete', () => {
  // Telling somebody they finished a set they cannot yet finish is a lie that
  // costs the app seam its credibility.
  const tier = 1;
  const one = reachable(tier).map(seen);
  for (const domain of completedDomains(tier, one)) {
    const remaining = SPECIES.filter((s) => s.domain_slug === domain && s.min_tier <= tier);
    assert.ok(remaining.every((s) => one.some((e) => e.species_slug === s.slug)));
  }
});

test('an empty journal completes nothing and suggests nothing', () => {
  assert.deepEqual(completedDomains(5, []), []);
  assert.equal(suggestionFor(5, []), null);
});

test('a sighting can be looked up by slug for its name and blurb', () => {
  const slug = reachable(1)[0]!;
  assert.equal(speciesFor(slug)?.slug, slug);
  assert.equal(speciesFor('no_existe'), undefined);
});
