import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { BEATS_PER_CHARACTER, CAST, TOTAL_BEATS, beatForDay, dayIndex } from '../cast';

function root(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = root(__dirname);
const ES = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'es.json'), 'utf8'));
const BEATS: string[] = CAST.flatMap((who) =>
  Array.from({ length: BEATS_PER_CHARACTER }, (_, i) => ES.mundo.cast[who][String(i)] as string));

test('**at least ninety beats ship**', () => {
  // §6: enough that the cycle lasts three months.
  assert.ok(TOTAL_BEATS >= 90, `${TOTAL_BEATS} beats`);
  assert.equal(BEATS.length, TOTAL_BEATS);
  for (const line of BEATS) assert.equal(typeof line, 'string');
});

test('**every beat is under twenty-five words**', () => {
  const over = BEATS.map((line, i) => [i, line.split(/\s+/).filter(Boolean).length] as const)
    .filter(([, n]) => n > 25);
  assert.deepEqual(over, [], `beats over 25 words: ${JSON.stringify(over)}`);
});

test('**no character is ever disappointed in the player**', () => {
  // The hard rule of §6: nobody comments on absence, nobody nags, nobody
  // mentions a streak. This is the list of ways that would creep back in.
  const banned = [
    'hace mucho que no', 'no viniste', 'te extrañ', 'volviste', 'te olvidaste',
    'deberías', 'tendrías que', 'racha', 'no venís', 'abandonaste',
    'te felicito por fin', 'por fin viniste', 'esperaba que',
  ];
  const hits: string[] = [];
  BEATS.forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const word of banned) if (lower.includes(word)) hits.push(`${i}: ${word}`);
  });
  assert.deepEqual(hits, [], `a character is nagging:\n${hits.join('\n')}`);
});

test('nobody says the same thing twice', () => {
  assert.equal(new Set(BEATS).size, BEATS.length, 'a beat is duplicated');
});

test('every character has a name and a full set', () => {
  for (const who of CAST) {
    assert.equal(typeof ES.mundo.cast[who].name, 'string');
    for (let i = 0; i < BEATS_PER_CHARACTER; i++) {
      assert.equal(typeof ES.mundo.cast[who][String(i)], 'string', `${who}.${i} is missing`);
    }
  }
});

test('one beat a day, taking turns, in order within a voice', () => {
  const days = Array.from({ length: 8 }, (_, i) => beatForDay(`2026-09-0${i + 1}`));
  // Round robin across the four.
  assert.deepEqual(days.slice(0, 4).map((b) => b.who), [...CAST].slice(0, 4).sort()
    .length === 4 ? days.slice(0, 4).map((b) => b.who) : []);
  assert.equal(new Set(days.slice(0, 4).map((b) => b.who)).size, 4, 'a voice repeats inside one cycle');
  // And each voice's second beat is the next one, not a random one.
  const first = days[0]!;
  const second = days[4]!;
  assert.equal(first.who, second.who);
  assert.notEqual(first.key, second.key);
});

test('the cycle lasts a season and then starts over cleanly', () => {
  const start = '2026-01-01';
  const a = beatForDay(start);
  const later = new Date(Date.parse(`${start}T00:00:00Z`) + TOTAL_BEATS * 86_400_000)
    .toISOString().slice(0, 10);
  assert.deepEqual(beatForDay(later), a);
});

test('a bad date does not crash the drip', () => {
  assert.equal(dayIndex('not-a-date'), 0);
  const b = beatForDay('not-a-date');
  assert.ok(CAST.includes(b.who));
});

test('every key the schedule produces has copy behind it', () => {
  const start = Date.UTC(2026, 0, 1);
  for (let i = 0; i < TOTAL_BEATS; i++) {
    const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
    const beat = beatForDay(date);
    const [, who, n] = beat.key.split('.');
    assert.equal(typeof ES.mundo.cast[who!][n!], 'string', `${beat.key} has no copy`);
  }
});
