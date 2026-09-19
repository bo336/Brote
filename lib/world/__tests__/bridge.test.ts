import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { BRIDGE, WATER_LEVEL } from '../config';
import { crossesRail, deckTopAt, decksFor } from '../decks';
import { buildLayout } from '../layout';
import { MovementSolver, type Body } from '../movement';
import { cumulativeState } from '../progression';
import { bakeHeightfield, bakeResolutionFor, sampleHeight, terrainHeight } from '../terrain';

/**
 * **The bridge, from the 2026-09-13 playtest.** "The bridge in the middle of the
 * lagoon — I don't understand why it's there." It was placed at a fraction of
 * El Río's centre, which is open water, and it was a picture: nothing walked on it.
 */
const TIERS = [7, 8, 11];

test('the bridge spans the river between two dry banks, clear of every lake', () => {
  for (const tier of TIERS) {
    const layout = buildLayout(`puente-${tier}`, cumulativeState(tier));
    const bridge = layout.anchors.find((a) => a.feature === 'bridge');
    assert.ok(bridge, `tier ${tier} has no bridge`);
    const span = bridge.span ?? 0;
    assert.ok(span > BRIDGE.defaultSpanM, `tier ${tier}: a ${span} m bridge does not reach across the carve`);
    const c = Math.cos(bridge.rotY);
    const s = Math.sin(bridge.rotY);
    const ends = [
      terrainHeight(bridge.x + c * (span / 2), bridge.z - s * (span / 2), layout.terrain),
      terrainHeight(bridge.x - c * (span / 2), bridge.z + s * (span / 2), layout.terrain),
    ];
    // Once the mountain sends the river across the meadow there is a dry crossing,
    // and the bridge takes it. Tier 7's river is an estuary at sea level with none.
    if (tier >= 8) for (const h of ends) assert.ok(h > WATER_LEVEL, `tier ${tier}: an end of the bridge is in the water`);
    // Whatever the banks, the deck stands clear of the water.
    const hf = bakeHeightfield(layout.terrain, bakeResolutionFor(layout.terrain));
    const deck = decksFor(layout, hf)[0]!;
    assert.ok(deck.baseY + BRIDGE.deckTopM >= WATER_LEVEL + BRIDGE.minDeckClearM - 1e-9, `tier ${tier}: the deck is under water`);
    for (const lake of layout.terrain.lakes) {
      assert.ok(Math.hypot(bridge.x - lake.x, bridge.z - lake.z) > lake.r, `tier ${tier}: the bridge stands in a lake`);
    }
    // Across the flow, not along it.
    const river = layout.terrain.rivers[0]!;
    const rdx = river.to[0] - river.from[0];
    const rdz = river.to[1] - river.from[1];
    const along = Math.abs(c * rdx - s * rdz) / Math.hypot(rdx, rdz);
    assert.ok(along < 1e-6, `tier ${tier}: the span runs along the river`);
    // And over a channel: its middle is lower than both its ends.
    const middle = terrainHeight(bridge.x, bridge.z, layout.terrain);
    assert.ok(middle < Math.min(...ends) - 0.3, `tier ${tier}: there is no channel under the bridge`);
  }
});

test('the rails keep Pip on the deck, and never pin Pip against them', () => {
  // With no rotation, local and world axes agree: the span is x, the width is z.
  const deck = { x: 0, z: 0, rotY: 0, halfSpan: 3, halfWidth: 0.75, baseY: 0 };
  const y = BRIDGE.deckTopM;
  assert.equal(crossesRail([deck], 0, 0, 0, 0.8, y), true, 'walked off the side through the rail');
  assert.equal(crossesRail([deck], 0, 1.2, 0, 0.5, y), true, 'climbed on through the rail');
  // The tier-11 bot that landed a centimetre inside the side and could not move at all.
  assert.equal(crossesRail([deck], 0, 0.73, 0, 0.6, y), false, 'pinned: cannot step back toward the middle');
  assert.equal(crossesRail([deck], 0, 0.73, 0.2, 0.73, y), false, 'pinned: cannot walk along the rail');
  assert.equal(crossesRail([deck], 2.95, 0, 3.4, 0.2, y), false, 'the ends are open');
  assert.equal(crossesRail([deck], 2.95, 0, 3.4, 0.9, y), false, 'the ends are open, even stepping off diagonally');
  assert.equal(crossesRail([deck], 0, 0, 0, 0.8, y - 1), false, 'under the deck there are no rails');
});

test('Pip walks across on the deck, and the riverbed under it is still the riverbed', () => {
  for (const tier of TIERS) {
    const config = cumulativeState(tier);
    const layout = buildLayout(`puente-${tier}`, config);
    const hf = bakeHeightfield(layout.terrain, bakeResolutionFor(layout.terrain));
    const solver = new MovementSolver(hf, layout, config.verbs);
    const deck = decksFor(layout, hf)[0]!;
    const c = Math.cos(deck.rotY);
    const s = Math.sin(deck.rotY);
    // On the bank, a little way before one end, facing the other.
    const start = deck.halfSpan + 0.8;
    const x0 = deck.x - c * start;
    const z0 = deck.z + s * start;
    const body: Body = {
      x: x0, y: sampleHeight(hf, x0, z0), z: z0, yaw: 0, speed: 0, vx: 0, vz: 0, vy: 0, grounded: true, airborne: false,
    };
    // W walks along (sin yaw, cos yaw); the far end is along (cos θ, −sin θ).
    const yaw = Math.atan2(c, -s);
    let lowest = Infinity;
    let crossed = false;
    for (let i = 0; i < 600 && !crossed; i++) {
      solver.step(body, { x: 0, z: -1, magnitude: 1, running: false, jump: false }, yaw, 1 / 30);
      const lx = (body.x - deck.x) * c - (body.z - deck.z) * s;
      const top = deckTopAt([deck], body.x, body.z);
      if (top !== null && Math.abs(lx) < deck.halfSpan - 0.4) lowest = Math.min(lowest, body.y - top);
      if (lx > deck.halfSpan + 0.3) crossed = true;
    }
    assert.ok(crossed, `tier ${tier}: Pip never reached the far bank`);
    assert.ok(lowest > -0.05, `tier ${tier}: Pip dropped ${lowest.toFixed(2)} m through the deck`);

    // Standing in the channel under the middle, the floor is the riverbed.
    const bed = sampleHeight(hf, deck.x, deck.z);
    assert.equal(solver.groundAt(deck.x, deck.z, bed), bed);
  }
});
