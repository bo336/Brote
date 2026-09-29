'use client';

import { audioContext, master } from './engine';

/**
 * Small sounds, synthesised — no audio files.
 *
 * `public/mundo/CREDITS.md` still lists no sound, and "one alone reads as a bug"
 * (`10-CONTROLS-AND-CAMERA.md` §6): a reward with only a picture, or a jump with
 * no weight to it, feels unfinished. These are a few oscillators and a burst of
 * filtered noise through the one shared context — a chime, a hop, a soft thud,
 * a splash — so every action has all three of motion, haptic and sound.
 *
 * Silent until the context is unlocked and unmuted, and never an error: audio
 * is the one part of the world allowed to simply not be there.
 */
export type SfxKind =
  | 'reward' | 'jump' | 'land' | 'splash' | 'pop'
  | 'pickup' | 'deliver' | 'build' | 'right' | 'wrong' | 'grow' | 'coin' | 'talk';

/**
 * Consecutive pickups climb a little in pitch, like a combo. It is the cheapest
 * "this feels good" in games and it tells you, without a word, that the run of
 * things you are picking up is one run.
 */
let comboAt = 0;
let combo = 0;

/** A bright major arpeggio for a job done. */
const CHIME_HZ = [784, 988, 1175, 1568];
const CHIME_STEP_S = 0.07;
let noiseBuffer: AudioBuffer | null = null;

function tone(
  ctx: AudioContext, out: AudioNode, hz: number, at: number, durS: number, type: OscillatorType, gain: number, toHz?: number,
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(hz, at);
  if (toHz) osc.frequency.exponentialRampToValueAtTime(toHz, at + durS);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + durS);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + durS + 0.05);
}

function burst(ctx: AudioContext, out: AudioNode, at: number, durS: number, gain: number, hz: number, filter: BiquadFilterType): void {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let seed = 7;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 16807) % 2147483647;
      data[i] = (seed / 2147483647) * 2 - 1;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = hz;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + durS);
  src.connect(f).connect(g).connect(out);
  src.start(at, 0, durS + 0.05);
}

export function playSfx(kind: SfxKind): void {
  const ctx = audioContext();
  const out = master();
  if (!ctx || !out || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  switch (kind) {
    case 'reward':
      CHIME_HZ.forEach((hz, i) => tone(ctx, out, hz, t + i * CHIME_STEP_S, 0.42, 'sine', 0.1));
      tone(ctx, out, CHIME_HZ[3]! * 1.5, t + CHIME_STEP_S * 3, 0.6, 'triangle', 0.025);
      break;
    case 'jump':
      tone(ctx, out, 330, t, 0.13, 'triangle', 0.06, 640);
      break;
    case 'land':
      burst(ctx, out, t, 0.09, 0.08, 700, 'lowpass');
      break;
    case 'splash':
      burst(ctx, out, t, 0.32, 0.09, 1800, 'bandpass');
      break;
    case 'pop':
      tone(ctx, out, 880, t, 0.09, 'sine', 0.07, 420);
      break;
    case 'pickup': {
      combo = t - comboAt < 0.9 ? Math.min(combo + 1, 10) : 0;
      comboAt = t;
      const hz = 620 * Math.pow(2, combo / 12);
      tone(ctx, out, hz, t, 0.1, 'sine', 0.06, hz * 1.5);
      break;
    }
    case 'deliver':
      burst(ctx, out, t, 0.05, 0.07, 1400, 'bandpass');
      tone(ctx, out, 220, t, 0.06, 'triangle', 0.04);
      break;
    case 'build':
      [0, 0.12, 0.24].forEach((d) => burst(ctx, out, t + d, 0.06, 0.09, 1100, 'bandpass'));
      CHIME_HZ.forEach((hz, i) => tone(ctx, out, hz, t + 0.34 + i * CHIME_STEP_S, 0.5, 'sine', 0.09));
      break;
    case 'right':
      tone(ctx, out, 988, t, 0.16, 'sine', 0.08);
      tone(ctx, out, 1319, t + 0.07, 0.22, 'sine', 0.07);
      break;
    case 'wrong':
      tone(ctx, out, 294, t, 0.18, 'triangle', 0.05, 262);
      break;
    case 'grow':
      burst(ctx, out, t, 0.5, 0.05, 900, 'lowpass');
      [523, 659, 784, 1047].forEach((hz, i) => tone(ctx, out, hz, t + 0.1 + i * 0.09, 0.55, 'sine', 0.07));
      break;
    case 'coin':
      tone(ctx, out, 1568, t, 0.08, 'square', 0.025);
      tone(ctx, out, 2093, t + 0.06, 0.18, 'sine', 0.05);
      break;
    case 'talk':
      tone(ctx, out, 523, t, 0.07, 'triangle', 0.04, 587);
      tone(ctx, out, 659, t + 0.08, 0.09, 'triangle', 0.035);
      break;
  }
}
