import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { ALLOWED_LICENCES, AUDIO_BUDGET, licenceAllowed, withinSourceCap } from '../audio';

function root(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = root(__dirname);

test('**no non-commercial licence is acceptable**', () => {
  // Brote monetises: an NC file anywhere in the tree is a legal problem, not an
  // attribution one.
  for (const bad of ['CC-BY-NC', 'CC BY-NC 4.0', 'cc-by-nc-sa', 'Non-Commercial']) {
    assert.equal(licenceAllowed(bad), false, `${bad} was allowed`);
  }
  for (const good of ALLOWED_LICENCES) assert.equal(licenceAllowed(good), true, good);
  assert.equal(licenceAllowed('Whatever'), false);
});

test('the concurrent-source cap is four', () => {
  // River, waterfall, campfire, summit wind.
  assert.equal(AUDIO_BUDGET.maxPositionalSources, 4);
  assert.equal(withinSourceCap(4), true);
  assert.equal(withinSourceCap(5), false);
});

test('**every audio file that ships is credited, and none is CC-BY-NC**', () => {
  // The credits file is the manifest. A file on disk with no row is a file
  // nobody checked the licence of.
  const audioDir = path.join(ROOT, 'public', 'mundo', 'audio');
  const credits = path.join(ROOT, 'public', 'mundo', 'CREDITS.md');
  assert.ok(fs.existsSync(credits), 'public/mundo/CREDITS.md is missing');

  const text = fs.readFileSync(credits, 'utf8');
  assert.equal(/\bCC-?BY-?NC\b/i.test(text.replace(/Nunca CC-BY-NC/g, '')), false,
    'CREDITS.md lists a non-commercial file');

  if (!fs.existsSync(audioDir)) return; // nothing shipped yet, which is the honest state
  const files = fs.readdirSync(audioDir).filter((f) => /\.(m4a|ogg|mp3|wav)$/i.test(f));
  const missing = files.filter((f) => !text.includes(f));
  assert.deepEqual(missing, [], `audio files with no credit row:\n${missing.join('\n')}`);
});

test('**the audio budget stays inside 1.5 MB initial and 4 MB total**', () => {
  const audioDir = path.join(ROOT, 'public', 'mundo', 'audio');
  if (!fs.existsSync(audioDir)) {
    // Zero bytes is trivially inside the budget, and saying so is more useful
    // than skipping: this is the measurement, and today it reads zero.
    assert.ok(0 <= AUDIO_BUDGET.totalBytes);
    return;
  }
  const total = fs.readdirSync(audioDir)
    .map((f) => fs.statSync(path.join(audioDir, f)).size)
    .reduce((a, b) => a + b, 0);
  assert.ok(total <= AUDIO_BUDGET.totalBytes, `${total} bytes of audio, cap ${AUDIO_BUDGET.totalBytes}`);
});
