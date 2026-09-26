'use client';

import Link from 'next/link';
import { Check, Lock } from 'lucide-react';

import { tierPath, type Discovery } from '@/lib/world/game/discoveries';
import { useGameStore } from '../../useGameStore';

/**
 * Tu camino — the Descubrir axis, laid out: what every rank and division of
 * the real ladder reveals on the island, what you already have, and what comes
 * next.
 *
 * This is the one place the game talks about the app, and it only explains:
 * the island grows *new things* with real actions and grows *what you have*
 * with play. There is no button that turns one into the other, and there is
 * no nag — just the door to Acciones for whoever wants it.
 */
const RANKS = ['Semilla', 'Brote', 'Plántula', 'Retoño', 'Arbusto', 'Árbol', 'Bosque', 'Guardián', 'Ecosistema', 'Planeta', 'Gaia'];
const KIND: Record<Discovery['kind'], string> = {
  lugar: 'Lugar', planta: 'Planta', estacion: 'Estación', objeto: 'Tienda', especie: 'Bitácora',
};

export function Camino() {
  const ctx = useGameStore.getState().ctx();
  if (!ctx) return null;
  const here = ctx.tier + (ctx.div - 1) / 5;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white/5 p-4 text-[13px] leading-relaxed text-brote-cream/80">
        <p>
          <span className="font-semibold text-brote-cream">Tu isla crece de dos formas.</span> Con tu nivel en Brote
          —acciones reales— se <em>descubren</em> lugares, especies y estaciones nuevas. Jugando, lo descubierto se
          <em> restaura</em>: parcelas vivas, estaciones mejores, fauna que llega.
        </p>
        <p className="mt-2">
          Estás en nivel <span className="font-bold text-brote-sun">{ctx.tier} · {RANKS[ctx.tier - 1]}</span>, división{' '}
          <span className="font-bold text-brote-sun">{ctx.div}</span> de 5. Cada división descubre algo; cada nivel, un lugar.
        </p>
        <Link href="/acciones" className="mt-3 inline-block rounded-full bg-white/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-brote-cream">
          Ir a Acciones
        </Link>
      </section>

      <ol className="space-y-3">
        {RANKS.map((rank, i) => {
          const tier = i + 1;
          const path = tierPath(tier);
          const past = tier < ctx.tier;
          const now = tier === ctx.tier;
          return (
            <li key={rank} className={`rounded-2xl p-3.5 ${now ? 'bg-brote-green/15 ring-1 ring-brote-green/50' : 'bg-white/5'}`}>
              <p className="flex items-center gap-2 font-display text-[15px] font-semibold text-brote-cream">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${past || now ? 'bg-brote-green text-white' : 'bg-white/10 text-brote-cream/50'}`}>
                  {past ? <Check className="h-3.5 w-3.5" aria-hidden /> : tier}
                </span>
                {rank}
                {now && <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-brote-green">Estás acá</span>}
              </p>
              <ul className="mt-2 space-y-1">
                {path.flatMap(({ div, items }) =>
                  items.map((d) => {
                    const got = tier + (div - 1) / 5 <= here + 1e-9;
                    return (
                      <li key={`${div}:${d.kind}:${d.name}`} className={`flex items-start gap-2 text-[12.5px] ${got ? 'text-brote-cream/85' : 'text-brote-cream/40'}`}>
                        <span className="mt-[3px] shrink-0">{got ? <Check className="h-3 w-3 text-brote-green" aria-hidden /> : <Lock className="h-3 w-3" aria-hidden />}</span>
                        <span>
                          <span className="font-semibold">{d.name}</span>
                          <span className="opacity-70"> · {KIND[d.kind]}{div > 1 ? ` · división ${div}` : ''}</span>
                        </span>
                      </li>
                    );
                  }),
                )}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
