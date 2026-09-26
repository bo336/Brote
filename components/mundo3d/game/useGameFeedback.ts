'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

import { MATERIALS } from '@/lib/world/game/materials';
import { DAILY_BY_ID } from '@/lib/world/game/missions';
import { PLANTS } from '@/lib/world/game/plants';
import { SHOP_BY_SLUG } from '@/lib/world/game/shop';
import { named, STATIONS } from '@/lib/world/game/stations';
import { CHAINS } from '@/lib/world/game/texto/cadenas';
import { CARD_BY_ID, castName } from '@/lib/world/game/texto/guia';
import type { GameEvent, MaterialId, RefusalReason } from '@/lib/world/game/types';
import { haptic } from '@/lib/utils/haptics';
import { playSfx } from '../audio/sfx';
import { emitFx } from '../state/feedback';
import { playerTransform } from '../state/usePlayerStore';
import { pushGain, pushSemillas, pushWater } from './gains';
import { useGameStore } from './useGameStore';

/**
 * Turns what the game says happened into what the player sees and hears.
 *
 * Three weights, and each event gets exactly one: a **floating number** for
 * the small constant gains, a **toast** for the moments (a chapter closed, a
 * parcel alive, a station built, a card learned), and a **line** for a refusal
 * — which always says why and what to do, never just "no".
 */
export type ToastTone = 'mission' | 'daily' | 'stage' | 'build' | 'card' | 'gift' | 'star' | 'buy';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
  who?: string;
  semillas?: number;
}

interface FeedbackStore {
  toasts: Toast[];
  line: { id: number; text: string } | null;
  push: (t: Omit<Toast, 'id'>) => void;
  drop: (id: number) => void;
  say: (text: string) => void;
  clearLine: () => void;
}

let nextId = 1;

export const useFeedback = create<FeedbackStore>((set, get) => ({
  toasts: [],
  line: null,
  push: (t) => set({ toasts: [...get().toasts, { ...t, id: nextId++ }].slice(-4) }),
  drop: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  say: (text) => set({ line: { id: nextId++, text } }),
  clearLine: () => set({ line: null }),
}));

const STAGE_TITLE = ['', 'Parcela limpia', 'Suelo vivo', 'Plantada', '¡Parcela viva!', '¡Floreciente!'];
const STAGE_BODY = [
  '',
  'Sin basura y sin invasoras. Ahora le hace falta tierra viva.',
  'Tierra oscura y suelta: lista para plantar.',
  'Ahora necesita agua y unos días.',
  'Ya da frutos y empiezan a llegar los bichos.',
  'Diversidad y refugio: la fauna se queda.',
];

function refusalText(why: RefusalReason, need?: Partial<Record<MaterialId | 'agua' | 'semillas', number>>): string {
  switch (why) {
    case 'bag_full':
      return 'La mochila está llena: llevá lo que tenés a una estación, o vendele algo a Don Beto.';
    case 'missing': {
      const parts = Object.entries(need ?? {}).map(([k, n]) => {
        if (k === 'agua') return 'agua en la regadera: cargala en el tanque';
        if (k === 'semillas') return `${n} semillas`;
        return `${n} de ${MATERIALS[k as MaterialId]?.short.toLowerCase() ?? k}`;
      });
      return parts.length ? `Te falta ${parts.join(' y ')}.` : 'Te falta algo para eso.';
    }
    case 'poor':
      return need?.semillas ? `Te faltan ${need.semillas} semillas. Las misiones y las diarias dan.` : 'Te faltan semillas.';
    case 'locked':
      return 'Todavía no lo descubriste: se abre con tu nivel en Brote.';
    case 'nothing_ready':
      return 'Todavía no hay nada listo.';
    case 'already_today':
      return 'Eso ya se hizo hoy. Mañana, otra vez.';
    case 'not_now':
    default:
      return 'Todavía no.';
  }
}

function react(events: GameEvent[], at: readonly [number, number, number] | null): void {
  const fb = useFeedback.getState();
  const p = at ?? [playerTransform.x, playerTransform.y, playerTransform.z];
  let chapter = false;
  for (const ev of events) {
    switch (ev.type) {
      case 'mission': {
        if (ev.chain) {
          const m = CHAINS[ev.chain]?.missions.find((x) => x.id === ev.id);
          if (!m) break;
          chapter = true;
          fb.push({ tone: 'mission', title: m.title, body: m.done, who: m.who, semillas: m.reward.sem });
          playSfx('reward');
          haptic('success');
          emitFx('stars', playerTransform.x, playerTransform.y + 0.8, playerTransform.z);
        } else if (ev.id === 'daily:bonus') {
          fb.push({ tone: 'daily', title: '¡Las tres del día!', body: 'Mañana hay nuevas.', semillas: 30 });
          playSfx('reward');
        } else {
          const d = DAILY_BY_ID.get(ev.id.replace('daily:', ''));
          fb.push({ tone: 'daily', title: 'Misión del día cumplida', body: d?.title.replace('{n}', '').replace('  ', ' ').trim(), semillas: 12 });
          playSfx('coin');
        }
        break;
      }
      case 'stage':
        if (ev.stage >= 1) fb.push({ tone: 'stage', title: STAGE_TITLE[ev.stage]!, body: STAGE_BODY[ev.stage] });
        break;
      case 'star':
        fb.push({ tone: 'star', title: `${'★'.repeat(ev.stars)} Biodiversidad`, body: 'Una especie nativa más en esa parcela.' });
        break;
      case 'built': {
        const def = STATIONS[ev.station];
        fb.push({
          tone: 'build',
          title: ev.lvl === 1 ? `¡Listo ${named(ev.station)}!` : `${def.name}: nivel ${ev.lvl}`,
          body: def.levels[ev.lvl - 1]?.gain,
        });
        playSfx('build');
        haptic('success');
        for (let k = 0; k < 4; k++) emitFx('sparkle', p[0] + (k - 1.5) * 0.4, p[1] + 0.6, p[2]);
        break;
      }
      case 'learned': {
        const card = CARD_BY_ID.get(ev.card);
        if (card) fb.push({ tone: 'card', title: `Guía de campo: ${card.title}`, body: card.text, who: card.who });
        break;
      }
      case 'gift': {
        const m = Object.values(CHAINS).flatMap((c) => c.missions).find((x) => x.id === ev.what);
        const plants = Object.entries(m?.gift?.plantines ?? {}).map(([k, n]) => `${n} ${PLANTS[k]?.name.toLowerCase() ?? k}`);
        if (plants.length) fb.push({ tone: 'gift', title: `${castName(ev.from)} te dio plantines`, body: plants.join(', ') + '. Están en el galpón.' });
        break;
      }
      case 'bought':
        if (!ev.item.startsWith('tool:')) fb.push({ tone: 'buy', title: `Compraste ${SHOP_BY_SLUG.get(ev.item)?.name.toLowerCase() ?? ev.item}` });
        else fb.push({ tone: 'buy', title: 'Herramienta mejorada' });
        playSfx('coin');
        break;
      case 'earned':
        if (!chapter) pushSemillas(ev.n);
        break;
      case 'collected':
        if (ev.material === 'agua') pushWater(ev.n);
        else pushGain(ev.material as MaterialId, ev.n);
        playSfx('pop');
        break;
      case 'harvested':
        pushGain('frutos', ev.n);
        emitFx('berries', p[0], p[1] + 0.4, p[2]);
        playSfx('pop');
        break;
      case 'pulled':
        emitFx('leaves', p[0], p[1] + 0.3, p[2]);
        playSfx('pop');
        break;
      case 'watered':
        emitFx('water', p[0], p[1] + 0.2, p[2]);
        playSfx('splash');
        break;
      case 'planted':
        emitFx('leaves', p[0], p[1] + 0.2, p[2]);
        break;
      case 'cared':
        emitFx('sparkle', p[0], p[1] + 0.4, p[2]);
        playSfx('pop');
        break;
      case 'refused':
        fb.say(refusalText(ev.why, ev.need));
        playSfx('wrong');
        break;
      default:
        break;
    }
  }
}

/** Mounted once by the HUD: every batch of events, once. */
export function useGameFeedback(): void {
  useEffect(() => {
    let seen = useGameStore.getState().seq;
    return useGameStore.subscribe((st) => {
      if (st.seq === seen) return;
      seen = st.seq;
      if (st.events.length) react(st.events, st.at);
    });
  }, []);
}

