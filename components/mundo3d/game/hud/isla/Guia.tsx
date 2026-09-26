'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CARDS, castName, type CardCategory } from '@/lib/world/game/texto/guia';
import { useGameStore } from '../../useGameStore';

/**
 * La Guía de campo — everything you learned by doing it, kept as cards.
 *
 * You never have to open this: every card already arrived as a small line at
 * the moment it was true (the first battery you sorted, the first ligustro you
 * pulled). This is where they are kept, grouped, with who told you. Unlearned
 * cards show only their category — a list of things still to find out.
 */
const CATS: CardCategory[] = ['residuos', 'suelo', 'agua', 'plantas', 'fauna', 'invasoras', 'energia'];

export function Guia() {
  const t = useTranslations('mundo.juego.guia');
  const know = useGameStore((s) => s.state?.know ?? []);
  const [cat, setCat] = useState<CardCategory>('residuos');
  const learned = new Set(know);
  const total = CARDS.length;
  const got = CARDS.filter((c) => learned.has(c.id)).length;
  const cards = CARDS.filter((c) => c.cat === cat);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5">
        <BookOpen className="h-5 w-5 shrink-0 text-brote-sun" aria-hidden />
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold text-brote-cream">{t('fichas', { got, total })}</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brote-sun" style={{ width: `${Math.round((got / total) * 100)}%` }} />
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATS.map((c) => {
          const n = CARDS.filter((k) => k.cat === c && learned.has(k.id)).length;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${cat === c ? 'bg-brote-cream text-brote-ink' : 'bg-white/10 text-brote-cream/80'}`}
            >
              {t(`cats.${c}`)} <span className="tnum opacity-60">{n}</span>
            </button>
          );
        })}
      </div>
      <ul className="space-y-2">
        {cards.map((c) =>
          learned.has(c.id) ? (
            <li key={c.id} className="rounded-2xl bg-white/5 p-3.5">
              <p className="font-display text-[14.5px] font-semibold text-brote-cream">{c.title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-brote-cream/80">{c.text}</p>
              <p className="mt-1 text-[11px] text-brote-cream/45">{t('conto', { who: castName(c.who) })}</p>
            </li>
          ) : (
            <li key={c.id} className="rounded-2xl border border-dashed border-white/10 px-3.5 py-3 text-[12.5px] text-brote-cream/35">
              {t('porDescubrir')}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
