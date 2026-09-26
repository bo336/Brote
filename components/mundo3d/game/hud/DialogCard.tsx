'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { castName } from '@/lib/world/game/texto/guia';
import { useGameUi } from '../useGameUi';

/**
 * A character talking. Only ever because you walked up and pressed "Hablar":
 * the game never interrupts you with a dialogue.
 *
 * One line at a time, advanced with a tap (or E / Enter / Space). The colour
 * dot matches the character's body, so four voices read as four people.
 */
const COLOR: Record<string, string> = { don_beto: '#8CC4D8', ines: '#3E8C5C', mila: '#E86A5A', tuco: '#E8875A' };

export function DialogCard() {
  const t = useTranslations('mundo.juego.dialogo');
  const screen = useGameUi((s) => s.screen);
  const close = useGameUi((s) => s.close);
  const [i, setI] = useState(0);
  const dialog = screen?.kind === 'dialogo' ? screen.dialog : null;
  useEffect(() => setI(0), [dialog]);
  const lines = dialog?.lines ?? [];
  const last = i >= lines.length - 1;
  const next = () => (last ? close() : setI((n) => n + 1));

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (['e', 'E', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        next();
      }
      if (e.key === 'Escape') close();
    };
    // Registered a beat late, so the E that opened it does not also close it.
    const id = setTimeout(() => window.addEventListener('keydown', onKey), 250);
    return () => {
      clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  });

  if (!dialog || lines.length === 0) return null;
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
      <motion.button
        type="button"
        onClick={next}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl rounded-3xl bg-brote-cream px-5 py-4 text-left text-brote-ink shadow-soft-lg"
      >
        <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em]">
          <span className="h-3 w-3 rounded-full" style={{ background: COLOR[dialog.who] ?? '#9CC93B' }} />
          {castName(dialog.who)}
        </p>
        <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-[15.5px] leading-relaxed">
          {lines[i]}
        </motion.p>
        <p className="mt-2 text-right text-[12px] font-semibold text-brote-green-deep">
          {last ? (dialog.close ?? t('seguir')) : t('siguiente')} ›
        </p>
      </motion.button>
    </div>
  );
}
