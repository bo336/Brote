import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  BLOOMED_THRESHOLD, LIVELINESS_RANGE, LIVELY_THRESHOLD, returnLine, returnLineKey,
  type ReturnState,
} from '../returns';

const QUIET: ReturnState = { ripeForage: false, matured: 0, liveliness: 0.35, hasRiver: false };

function root(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = root(__dirname);

test('every line the picker can return has copy behind it', () => {
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'es.json'), 'utf8'));
  for (const line of [1, 2, 3, 4, 5] as const) {
    const key = returnLineKey(line).split('.')[1]!;
    const text = es.mundo.return[key];
    assert.equal(typeof text, 'string', `mundo.return.${key} is missing`);
    assert.ok(text.length > 0);
  }
});

test('**a quiet week gets a warm sentence, not a scolding**', () => {
  // Line 5 exists precisely so "nothing happened" has a phrasing.
  assert.equal(returnLine(QUIET), 5);
});

test('the line is only shown when it is true', () => {
  assert.equal(returnLine({ ...QUIET, ripeForage: true }), 3);
  assert.equal(returnLine({ ...QUIET, matured: BLOOMED_THRESHOLD }), 1);
  assert.equal(returnLine({ ...QUIET, liveliness: LIVELY_THRESHOLD }), 2);
  assert.equal(returnLine({ ...QUIET, hasRiver: true }), 4);
});

test('the most specific true thing wins', () => {
  // Something you can pick beats something you can look at.
  const everything: ReturnState = {
    ripeForage: true, matured: 1, liveliness: 1, hasRiver: true,
  };
  assert.equal(returnLine(everything), 3);
  assert.equal(returnLine({ ...everything, ripeForage: false }), 1);
  assert.equal(returnLine({ ...everything, ripeForage: false, matured: 0 }), 2);
});

test('every threshold is reachable', () => {
  // A threshold outside its input's range is a line that can never be shown.
  const [min, max] = LIVELINESS_RANGE;
  assert.ok(LIVELY_THRESHOLD > min && LIVELY_THRESHOLD <= max, `${LIVELY_THRESHOLD}`);
  assert.ok(BLOOMED_THRESHOLD > 0 && BLOOMED_THRESHOLD <= 1);
});

test('**no return line is loss-framed**', () => {
  // `14-CONTENT.md`: never "tu isla te extraña", "volviste", "hace N días que
  // no venís", or anything that makes absence the subject.
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'es.json'), 'utf8'));
  const banned = [
    'te extraña', 'volviste', 'no venís', 'no viniste', 'hace mucho',
    'abandonaste', 'te olvidaste', 'descuidaste', 'perdiste',
  ];
  const hits: string[] = [];
  for (const [key, text] of Object.entries(es.mundo.return as Record<string, string>)) {
    for (const word of banned) {
      if (text.toLowerCase().includes(word)) hits.push(`return.${key} → ${word}`);
    }
  }
  assert.deepEqual(hits, [], `loss-framed return copy:\n${hits.join('\n')}`);
});
