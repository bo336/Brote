'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { create } from 'zustand';

import { SEMILLAS } from '@/lib/world/game/config';

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
  push: (t) => set({ toasts: [...get().toasts, { ...t, id: nextId++ }].slice(-8) }),
  drop: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  say: (text) => set({ line: { id: nextId++, text } }),
  clearLine: () => set({ line: null }),
}));

type T = ReturnType<typeof useTranslations<'mundo.juego'>>;

function refusalText(t: T, why: RefusalReason, need?: Partial<Record<MaterialId | 'agua' | 'semillas', number>>): string {
  switch (why) {
    case 'bag_full':
      return t('no.llena');
    case 'missing': {
      const parts = Object.entries(need ?? {}).map(([k, n]) => {
        if (k === 'agua') return t('no.faltaAgua');
        if (k === 'semillas') return t('no.faltaSemillas', { n: n ?? 0 });
        return t('no.faltaMat', { n: n ?? 0, name: MATERIALS[k as MaterialId]?.short.toLowerCase() ?? k });
      });
      return parts.length ? t('no.falta', { what: parts.join(t('no.y')) }) : t('no.faltaAlgo');
    }
    case 'poor':
      return need?.semillas ? t('no.pobre', { n: need.semillas }) : t('no.pobreSin');
    case 'locked':
      return t('no.bloqueado');
    case 'nothing_ready':
      return t('no.nadaListo');
    case 'already_today':
      return t('no.hoyYa');
    case 'later':
      return t('no.masAdelante');
    case 'not_now':
    default:
      return t('no.todavia');
  }
}

function react(t: T, events: GameEvent[], at: readonly [number, number, number] | null): void {
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
          fb.push({ tone: 'daily', title: t('toast.tresDelDia'), body: t('toast.tresDelDiaBody'), semillas: SEMILLAS.dailyBonus });
          playSfx('reward');
        } else {
          const d = DAILY_BY_ID.get(ev.id.replace('daily:', ''));
          fb.push({ tone: 'daily', title: t('toast.diaria'), body: d?.title.replace('{n}', '').replace('  ', ' ').trim(), semillas: SEMILLAS.daily });
          playSfx('coin');
        }
        break;
      }
      case 'stage':
        if (ev.stage >= 1 && ev.stage <= 5) {
          const k = String(ev.stage) as '1' | '2' | '3' | '4' | '5';
          fb.push({ tone: 'stage', title: t(`toast.etapa.${k}`), body: t(`toast.etapaBody.${k}`) });
        }
        break;
      case 'star':
        fb.push({ tone: 'star', title: t('toast.estrella', { stars: '★'.repeat(ev.stars) }), body: t('toast.estrellaBody') });
        break;
      case 'built': {
        const def = STATIONS[ev.station];
        fb.push({
          tone: 'build',
          title: ev.lvl === 1 ? t('toast.construida', { name: named(ev.station) }) : t('toast.nivelNuevo', { name: def.name, n: ev.lvl }),
          body: def.levels[ev.lvl - 1]?.gain,
        });
        playSfx('build');
        haptic('success');
        for (let k = 0; k < 4; k++) emitFx('sparkle', p[0] + (k - 1.5) * 0.4, p[1] + 0.6, p[2]);
        break;
      }
      case 'learned': {
        const card = CARD_BY_ID.get(ev.card);
        if (card) fb.push({ tone: 'card', title: t('toast.ficha', { title: card.title }), body: card.text, who: card.who });
        break;
      }
      case 'gift': {
        const m = Object.values(CHAINS).flatMap((c) => c.missions).find((x) => x.id === ev.what);
        const plants = Object.entries(m?.gift?.plantines ?? {}).map(([k, n]) => `${n} ${PLANTS[k]?.name.toLowerCase() ?? k}`);
        if (plants.length) fb.push({ tone: 'gift', title: t('toast.regalo', { who: castName(ev.from) }), body: t('toast.regaloBody', { list: plants.join(', ') }) });
        break;
      }
      case 'bought':
        if (!ev.item.startsWith('tool:')) fb.push({ tone: 'buy', title: t('toast.compraste', { name: SHOP_BY_SLUG.get(ev.item)?.name.toLowerCase() ?? ev.item }) });
        else fb.push({ tone: 'buy', title: t('toast.herramienta') });
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
        fb.say(refusalText(t, ev.why, ev.need));
        playSfx('wrong');
        break;
      default:
        break;
    }
  }
}

/** Mounted once by the HUD: every batch of events, once. */
export function useGameFeedback(): void {
  const t = useTranslations('mundo.juego');
  const tRef = useRef(t);
  tRef.current = t;
  useEffect(() => {
    let seen = useGameStore.getState().seq;
    return useGameStore.subscribe((st) => {
      if (st.seq === seen) return;
      seen = st.seq;
      if (st.events.length) react(tRef.current, st.events, st.at);
    });
  }, []);
}

