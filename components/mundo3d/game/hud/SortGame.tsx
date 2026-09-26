'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BINS, WASTE } from '@/lib/world/game/materials';
import type { BinId, WasteKind } from '@/lib/world/game/types';
import { haptic } from '@/lib/utils/haptics';
import { playSfx } from '../../audio/sfx';
import { useGameStore } from '../useGameStore';
import { useGameUi } from '../useGameUi';

/**
 * El Punto Limpio: separate what you picked up, one piece at a time.
 *
 * **This is the lesson, and it is a game, not a quiz.** Tap the bin (or press
 * 1–4). Right or wrong, the piece ends up where it belongs and one line says
 * why — the first time you meet each kind it becomes a card in the Guide.
 * Getting it right pays a little more; getting it wrong costs nothing. A run of
 * a dozen takes under half a minute.
 */
const ORDER: BinId[] = ['reciclable', 'organico', 'resto', 'especial'];

function Glyph({ kind }: { kind: WasteKind }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'botella':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M20 6h8v6l4 6v22a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V18l4-6z" /><path {...common} d="M16 24h16" /></svg>;
    case 'lata':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><ellipse {...common} cx="24" cy="10" rx="10" ry="4" /><path {...common} d="M14 10v28c0 2 4.5 4 10 4s10-2 10-4V10" /></svg>;
    case 'vidrio':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M17 8h14v5H17zM15 13h18v27a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3z" /></svg>;
    case 'pila':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><rect {...common} x="14" y="10" width="20" height="32" rx="3" /><path {...common} d="M20 6h8v4h-8zM24 20v8M20 24h8" /></svg>;
    case 'papel':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M12 8l20-2 4 34-22 2z" /><path {...common} d="M17 16l12-1M18 23l12-1M18 30l9-1" /></svg>;
    case 'carton':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M8 16l16-8 16 8v18l-16 8-16-8z" /><path {...common} d="M8 16l16 8 16-8M24 24v18" /></svg>;
    case 'tetra':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M16 14l8-8 8 8v28H16z" /><path {...common} d="M16 14h16M22 22h4" /></svg>;
    case 'bolsa':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M12 16h24l-3 26H15z" /><path {...common} d="M18 16c0-6 12-6 12 0" /></svg>;
    case 'telgopor':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M6 22h36l-4 12H10z" /><path {...common} d="M12 22l3-6h18l3 6" /></svg>;
    case 'yerba':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M14 18c0 14 4 22 10 22s10-8 10-22z" /><path {...common} d="M28 18l6-12" /></svg>;
    case 'cascara':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><path {...common} d="M24 8c-2 10-10 18-16 22M24 8c2 10 10 18 16 22M24 8v30" /></svg>;
    case 'colilla':
      return <svg viewBox="0 0 48 48" className="h-16 w-16"><rect {...common} x="8" y="21" width="32" height="7" rx="2" /><path {...common} d="M28 21v7" /></svg>;
  }
}

interface Verdict {
  waste: WasteKind;
  right: boolean;
  chose: BinId;
}

export function SortGame() {
  const t = useTranslations('mundo.juego');
  const screen = useGameUi((s) => s.screen);
  const close = useGameUi((s) => s.close);
  const bag = useGameStore((s) => s.state?.bag.residuos ?? []);
  const lvl = useGameStore((s) => s.state?.stations.punto_limpio?.lvl ?? 1);
  const dispatch = useGameStore((s) => s.dispatch);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [streak, setStreak] = useState(0);
  const open = screen?.kind === 'separar';
  const current = bag[0];
  const bins = ORDER.filter((b) => b !== 'especial' || lvl >= 2 || current === 'pila' || bag.includes('pila'));

  const choose = useCallback((bin: BinId) => {
    if (!current || verdict) return;
    const events = dispatch({ t: 'sort', bin });
    const ev = events.find((e) => e.type === 'sorted');
    if (!ev || ev.type !== 'sorted') return;
    setVerdict({ waste: ev.waste, right: ev.right, chose: bin });
    setStreak((s) => (ev.right ? s + 1 : 0));
    playSfx(ev.right ? 'right' : 'wrong');
    haptic(ev.right ? 'success' : 'light');
  }, [current, verdict, dispatch]);

  // A right answer moves on by itself; a wrong one waits to be read.
  useEffect(() => {
    if (!verdict) return;
    const id = setTimeout(() => setVerdict(null), verdict.right ? 1300 : 4200);
    return () => clearTimeout(id);
  }, [verdict]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      const n = Number(e.key);
      if (n >= 1 && n <= bins.length) choose(bins[n - 1]!);
      if ((e.key === ' ' || e.key === 'Enter') && verdict) setVerdict(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, bins, choose, verdict, close]);

  if (!open) return null;
  const shown = verdict?.waste ?? current;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col bg-brote-ink/92 px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),20px)] text-brote-cream backdrop-blur-sm">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between">
        <div>
          <h2 className="font-display text-[22px] font-bold">{t('separar.titulo')}</h2>
          <p className="text-caption text-brote-cream/65">
            {bag.length > 0 ? t('separar.quedan', { n: bag.length }) : t('separar.nada')}{streak >= 3 ? ` · ${t('separar.racha', { n: streak })}` : ''}
          </p>
        </div>
        <button type="button" onClick={close} aria-label={t('cerrar')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center">
        {!shown ? (
          <p className="max-w-xs text-center text-[14px] leading-relaxed text-brote-cream/75">
            {t('separar.vacio')}
          </p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${shown}:${bag.length}:${verdict ? 'v' : 'q'}`}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`flex h-32 w-32 items-center justify-center rounded-[2rem] ${verdict ? (verdict.right ? 'bg-brote-green/25 text-brote-green' : 'bg-brote-coral/20 text-brote-coral') : 'bg-white/8 text-brote-cream'}`}>
                <Glyph kind={shown} />
              </div>
              <p className="mt-3 font-display text-[20px] font-semibold">{WASTE[shown].name}</p>
              {verdict && (
                <div className="mt-2 max-w-sm">
                  <p className={`flex items-center justify-center gap-1.5 text-[14px] font-bold ${verdict.right ? 'text-brote-green' : 'text-brote-sun'}`}>
                    {verdict.right ? <Check className="h-4 w-4" aria-hidden /> : null}
                    {verdict.right ? t('separar.bien') : t('separar.vaEn', { bin: BINS[WASTE[verdict.waste].bin].name.toLowerCase() })}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-snug text-brote-cream/85">{WASTE[verdict.waste].why}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {current && (
        <div className={`mx-auto grid w-full max-w-xl gap-2 ${bins.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {bins.map((b, i) => (
            <button
              key={b}
              type="button"
              disabled={!!verdict}
              onClick={() => choose(b)}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-white shadow-soft transition-transform active:scale-95 disabled:opacity-50"
              style={{ background: BINS[b].color }}
            >
              <span className="text-[14px] font-bold">{BINS[b].name}</span>
              <span className="text-[11px] opacity-85">{BINS[b].hint}</span>
              <kbd className="mt-0.5 rounded border border-white/40 px-1.5 text-[10px] [@media(pointer:coarse)]:hidden">{i + 1}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
