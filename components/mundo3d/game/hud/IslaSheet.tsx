'use client';

import { BookMarked, LayoutGrid, Settings2, X } from 'lucide-react';

import { balance } from '@/lib/world/game/state';
import { useSessionStore } from '../../state/useSessionStore';
import { useGameStore } from '../useGameStore';
import { useGameUi, type IslaTab } from '../useGameUi';
import { Camino } from './isla/Camino';
import { Guia } from './isla/Guia';
import { Misiones } from './isla/Misiones';
import { Mochila } from './isla/Mochila';
import { Tienda } from './isla/Tienda';

/**
 * "Tu isla" — everything the game keeps, one tap from the wallet or the
 * mission card: missions, the backpack and the shed, the shop, the field guide,
 * and the path of discoveries. The census (Bitácora), arranging and settings
 * are one more tap, from the header.
 */
const TABS: { id: IslaTab; label: string }[] = [
  { id: 'misiones', label: 'Misiones' },
  { id: 'mochila', label: 'Mochila' },
  { id: 'tienda', label: 'Tienda' },
  { id: 'guia', label: 'Guía' },
  { id: 'camino', label: 'Camino' },
];

export function IslaSheet() {
  const screen = useGameUi((s) => s.screen);
  const open = useGameUi((s) => s.open);
  const close = useGameUi((s) => s.close);
  const state = useGameStore((s) => s.state);
  if (screen?.kind !== 'isla' || !state) return null;
  const tab = screen.tab;
  const go = (hud: 'bitacora' | 'placement' | 'settings') => {
    close();
    useSessionStore.getState().setHud(hud);
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col bg-brote-ink/95 backdrop-blur-sm">
      <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-[max(env(safe-area-inset-top),20px)]">
        <div className="min-w-0">
          <h2 className="font-display text-h2 font-bold text-brote-cream">Tu isla</h2>
          <p className="tnum text-caption text-brote-sun">{balance(state)} semillas del mundo</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => go('bitacora')} aria-label="Bitácora" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brote-cream">
            <BookMarked className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" onClick={() => go('placement')} aria-label="Acomodar" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brote-cream">
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" onClick={() => go('settings')} aria-label="Ajustes" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brote-cream">
            <Settings2 className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" onClick={close} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full bg-brote-cream text-brote-ink">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-3" aria-label="Secciones">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => open({ kind: 'isla', tab: t.id })}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${tab === t.id ? 'bg-brote-green text-white' : 'text-brote-cream/75 hover:bg-white/10'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="mx-auto max-w-xl">
          {tab === 'misiones' && <Misiones />}
          {tab === 'mochila' && <Mochila />}
          {tab === 'tienda' && <Tienda />}
          {tab === 'guia' && <Guia />}
          {tab === 'camino' && <Camino />}
        </div>
      </div>
    </div>
  );
}
