import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { IMPACT_PROVENANCE } from '../config';
import { LEARNING } from '../learning';

/**
 * **All 23 anti-patterns in `04-RESEARCH-DESIGN.md` §9, one by one, by number.**
 *
 * `20-ACCEPTANCE.md` 5F asks for exactly that. Asking a person to confirm
 * twenty-three things by reading is asking for twenty-three things to be
 * confirmed once and then quietly stop being true, so most of them are checked
 * here instead.
 *
 * Where a number is a design fact rather than a string — "no energy system" —
 * the check greps for the thing existing, which is the honest automatable form
 * of "we did not build that".
 */
function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = repoRoot(__dirname);
const ROOTS = ['components/mundo3d', 'lib/world', 'lib/render', 'app/(app)/mundo'];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      walk(full, out);
    } else if (['.ts', '.tsx', '.sql'].includes(path.extname(e.name))) out.push(full);
  }
  return out;
}

/**
 * Comments stripped.
 *
 * Half of these anti-patterns are named in the comments of the very files that
 * refuse them — `TierUpOverlay` opens with "no upsell, no interstitial", and
 * `useCollective` says "**not a leaderboard**" in as many words. A grep over
 * raw text reads those as violations, which would be a test that fails hardest
 * exactly where the code is most careful. So the greps run over the code.
 */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
}

const SOURCES = ROOTS.flatMap((r) => walk(path.join(ROOT, r))).map((f) => {
  const text = fs.readFileSync(f, 'utf8');
  return { file: path.relative(ROOT, f), text, code: stripComments(text) };
});

/** Every Spanish string the world can show, flattened. */
function worldCopy(): { key: string; text: string }[] {
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'es.json'), 'utf8'));
  const out: { key: string; text: string }[] = [];
  const walkNode = (node: unknown, prefix: string) => {
    if (typeof node === 'string') {
      out.push({ key: prefix, text: node });
      return;
    }
    if (typeof node !== 'object' || node === null) return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      walkNode(v, prefix ? `${prefix}.${k}` : k);
    }
  };
  walkNode(es.mundo, 'mundo');
  return out;
}
const COPY = worldCopy();

/** Does any identifier appear anywhere in the world's source? */
function grep(...needles: string[]): string[] {
  const hits: string[] = [];
  for (const { file, code } of SOURCES) {
    const lower = code.toLowerCase();
    for (const needle of needles) {
      if (lower.includes(needle.toLowerCase())) hits.push(`${file} → ${needle}`);
    }
  }
  return hits;
}

/** Does any phrase appear in the shipped copy? */
function copyHits(...needles: string[]): string[] {
  const hits: string[] = [];
  for (const { key, text } of COPY) {
    const lower = text.toLowerCase();
    for (const n of needles) if (lower.includes(n.toLowerCase())) hits.push(`${key} → "${n}"`);
  }
  return hits;
}

// ── Progression integrity ───────────────────────────────────────────────────

test('1. no path from semillas, ads or payment to XP or rank', () => {
  // The XP-isolation grep in `no-xp.test.ts` is the main check. This is its
  // companion for the other two doors into the same room.
  assert.deepEqual(grep('grant_xp', 'add_xp', 'award_xp'), []);
  assert.deepEqual(grep('adReward', 'rewarded_ad', 'watchAdFor'), []);
});

test('2. no grindable in-game XP of any kind', () => {
  assert.deepEqual(grep('gainXp', 'addXp', 'xpFromPlay'), []);
});

test('3. no energy or stamina system that stops play', () => {
  assert.deepEqual(grep('stamina', 'energyBar', 'outOfEnergy', 'refillEnergy'), []);
});

test('4. no pay-to-skip timer on world growth', () => {
  assert.deepEqual(grep('skipTimer', 'speedUpGrowth', 'instantGrow', 'payToSkip'), []);
});

// ── Retention manipulation ──────────────────────────────────────────────────

test('5. no world decay, withering or sadness when somebody lapses', () => {
  // `liveliness` and `maturation` have their own tests proving they only add.
  // This is the other half: nothing anywhere subtracts on absence.
  assert.deepEqual(grep('onLapse', 'decayWorld', 'witherOn', 'punishAbsence'), []);
  // The one wilting thing in the world recovers on its own, whatever anyone does.
  assert.ok(LEARNING.wiltingSelfRecoverDays > 0);
});

test('6. no loss-framed copy anywhere in the world', () => {
  assert.deepEqual(copyHits(
    'te extraña', 'vas a perder', 'perdés tu racha', 'última oportunidad',
    'se va a marchitar', 'hace mucho que no',
  ), []);
});

test('7. streaks are not this world business at all', () => {
  // Rest days and freezes are the app's problem. The world never mentions a
  // streak, which is the strongest available form of "with free rest days".
  assert.deepEqual(copyHits('racha', 'días seguidos de'), []);
});

test('8. no expiring content, rotating shop, FOMO countdown or limited stock', () => {
  assert.deepEqual(grep('expiresAt', 'limitedStock', 'countdownTo', 'flashSale', 'rotatingShop'), []);
  assert.deepEqual(copyHits('por tiempo limitado', 'últimas unidades', 'se vence'), []);
});

test('9. the world sends no notifications at all', () => {
  assert.deepEqual(grep('scheduleNotification', 'pushNotification', 'requestNotificationPermission'), []);
});

test('10. no interstitial or upsell during a tier-up ceremony', () => {
  const ceremony = SOURCES.filter((s) => /TierUpOverlay|ceremony/i.test(s.file));
  assert.ok(ceremony.length > 0, 'the ceremony source was not found');
  for (const { file, code } of ceremony) {
    for (const bad of ['upsell', 'interstitial', 'adslot', 'paywall', 'suscribi']) {
      assert.ok(!code.toLowerCase().includes(bad), `${file} → ${bad}`);
    }
  }
});

// ── Honesty ─────────────────────────────────────────────────────────────────

test('11. no offsetting, neutrality or "N árboles" claim', () => {
  assert.deepEqual(copyHits(
    'compensás', 'compensa', 'carbono neutro', 'huella cero',
    'equivale a plantar', 'árboles plantados',
  ), []);
});

test('12. measured and estimated are never blended into one figure', () => {
  // Every channel declares its own provenance, and the badge is rendered from
  // that declaration rather than from a guess at the call site.
  for (const [channel, kind] of Object.entries(IMPACT_PROVENANCE)) {
    assert.ok(kind === 'medido' || kind === 'estimado', `${channel} → ${kind}`);
  }
});

test('13. no false precision on a modelled estimate', () => {
  // Nothing in the world formats an impact figure with decimals of its own:
  // `lib/impact.ts` owns that decision, and the ceremony line takes the
  // whole-number formatter.
  assert.deepEqual(grep('toFixed(2)', 'toFixed(3)'), []);
});

test('14. self-reported and verified are never shown as equal without a label', () => {
  // The world has one impact surface, El Mojón, and every figure on it carries
  // a provenance badge.
  const mojon = SOURCES.find((s) => s.file.includes('MojonSheet'));
  assert.ok(mojon, 'MojonSheet not found');
  assert.ok(/medido|estimado/.test(mojon!.text), 'El Mojón shows no provenance');
});

test('15. no partner or NGO logo in the world', () => {
  assert.deepEqual(grep('partnerLogo', 'sponsorLogo', 'ngoBadge'), []);
});

// ── Tone ────────────────────────────────────────────────────────────────────

test('16. no guilt, shame, scolding or apocalyptic framing', () => {
  assert.deepEqual(copyHits(
    'deberías', 'tendrías que', 'mal hecho', 'es tu culpa',
    'catástrofe', 'demasiado tarde', 'estamos perdiendo',
  ), []);
});

test('17. no moralising after a missed day', () => {
  assert.deepEqual(copyHits('volviste', 'no viniste', 'te olvidaste', 'abandonaste'), []);
});

test('18. no character is disappointed in the player', () => {
  // The cast has its own grep over its ninety-six beats. This covers the rest
  // of the world's voice.
  assert.deepEqual(copyHits('esperaba más', 'me decepcion', 'pensé que ibas'), []);
});

test('19. no gameplay text over 25 words', () => {
  const over = COPY
    // El Mojón's method note is a methodology page, not gameplay text: §3 of
    // `13-IMPACT-MIRROR.md` requires it to state the coefficient version.
    .filter(({ key }) => !key.startsWith('mundo.mojon.method'))
    .map(({ key, text }) => [key, text.split(/\s+/).filter(Boolean).length] as const)
    .filter(([, n]) => n > 25);
  assert.deepEqual(over, [], `copy over 25 words: ${JSON.stringify(over)}`);
});

test('20. no learning content blocks a non-learning reward', () => {
  // The chocolate-covered-broccoli failure mode, measured at 7:1 against.
  // Every event pays whether or not its line was read, every wilting plant is
  // ignorable, and the budget refuses beats rather than gating anything.
  assert.deepEqual(grep('requireLearning', 'mustAnswerBefore', 'lockedUntilLesson'), []);
  assert.ok(LEARNING.sessionShareMax <= 0.1);
});

// ── Young audience ──────────────────────────────────────────────────────────

test('21. no loot box, gacha or purchasable randomness', () => {
  assert.deepEqual(grep('lootBox', 'gacha', 'randomReward', 'mysteryBox'), []);
});

test('22. no free-text chat or un-moderated user text', () => {
  assert.deepEqual(grep('chatMessage', 'freeText', 'userComment'), []);
  // And no field anywhere in the world's own UI that a person can type into.
  // A slider is an input too; what is banned is somewhere to put words.
  const typable = /<textarea|contentEditable|<input(?![^>]*type=\{?["']?(range|checkbox|radio|color)\b)/;
  const fields = SOURCES.filter((s) => typable.test(s.code)).map((s) => s.file);
  assert.deepEqual(fields, [], `a text field in the world: ${fields.join(', ')}`);
});

test('23. no public leaderboard ranking users on real-world action volume', () => {
  assert.deepEqual(grep('leaderboard', 'topUsers', 'rankAgainst'), []);
});
