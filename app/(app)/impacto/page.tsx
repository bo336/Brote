'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, Share2, ShieldCheck, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/ui/reveal';
import { IconoImpacto } from '@/components/impacto/IconoImpacto';
import { ImpactBenchmark } from '@/components/impacto/ImpactBenchmark';
import { FraseDestacada } from '@/components/inicio/ImpactoReal';
import { useImpactoTotal } from '@/components/inicio/datos';
import { fetchMyImpactSince, fetchPulsoPublico } from '@/lib/api/impacto';
import {
  HABITOS,
  NOMBRE_METRICA,
  VERSION_CIFRAS,
  historiaDe,
  historiaPrincipal,
  historias,
  textoParaCompartir,
  type Historia,
  type Metrica,
} from '@/lib/impacto/historias';
import { CO2_EQ, ENERGY_EQ, WASTE_EQ, WATER_EQ, formatCo2, formatEnergy, formatWaste, formatWater } from '@/lib/impact';
import { toast } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const FORMATO: Record<Metrica, (n: number) => string> = {
  water: formatWater,
  co2: formatCo2,
  waste: formatWaste,
  energy: formatEnergy,
};

/** Una acción para mover cada métrica (13-IMPACT-MIRROR §4: el dato va con algo que se puede hacer). */
const PARA_MOVER: Record<Metrica, { href: string; texto: string }> = {
  water: { href: '/acciones?dominio=agua', texto: 'Acciones que ahorran agua' },
  co2: { href: '/acciones?dominio=movilidad', texto: 'Acciones de movilidad y comida' },
  waste: { href: '/acciones?dominio=residuos', texto: 'Acciones que evitan residuos' },
  energy: { href: '/acciones?dominio=energia', texto: 'Acciones que ahorran energía' },
};

/**
 * Tu impacto — la página que faltaba (docs/REESTRUCTURA.md D5).
 *
 * El motivo de la app vivía en una sección del perfil. Ahora tiene su lugar:
 * arriba una frase (cuánto dura un hábito diario con lo que ahorraste), por
 * métrica la cifra con dos o tres formas de imaginarla, esta semana, vos al
 * lado de una persona promedio, lo que hizo la comunidad y cómo se calcula.
 * Todo sale de acciones medidas; nada se redondea para arriba.
 */
export default function ImpactoPage() {
  const total = useImpactoTotal();
  const semana = useQuery({ queryKey: ['impact-since', 7], queryFn: () => fetchMyImpactSince(7), staleTime: 60_000 });
  const pulso = useQuery({ queryKey: ['pulso-publico'], queryFn: fetchPulsoPublico, staleTime: 10 * 60_000 });

  if (total.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-56 w-full rounded-card" />
      </div>
    );
  }

  const tot = total.data ?? { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 };
  const principal = historiaPrincipal(tot);
  const todas = historias(tot);
  const movidas = new Set(todas.map((h) => h.metrica));
  const faltan = (['water', 'co2', 'waste', 'energy'] as Metrica[]).filter((m) => !movidas.has(m));
  const deSemana = semana.data ? historiaPrincipal(semana.data) : null;
  const comunidad = pulso.data && pulso.data.agua_l > 0 ? historiaDe('water', pulso.data.agua_l) : null;

  async function compartir(h: Historia) {
    const texto = textoParaCompartir(h);
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (navigator.share) {
        await navigator.share({ text: texto, url });
        return;
      }
      await navigator.clipboard.writeText(`${texto} ${url}`);
      toast.success('Copiado', 'Pegalo donde quieras.');
    } catch {
      /* cancelado */
    }
  }

  return (
    <div className="space-y-6">
      {/* La frase principal: el titular de la página. */}
      <header className="relative isolate overflow-hidden rounded-card bg-brote-ink p-5 text-brote-cream shadow-soft-lg">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `${principal ? NOMBRE_METRICA[principal.metrica].color : '#2DB4D4'}33` }}
        />
        <span className="eyebrow block text-brote-cream/60">Tu impacto real</span>
        {principal ? (
          <>
            <h1 className="mt-2 text-balance font-display text-display-l font-extrabold leading-[1.08]">
              <FraseDestacada h={principal} color={NOMBRE_METRICA[principal.metrica].color} />
            </h1>
            <p className="mt-2 text-small leading-relaxed text-brote-cream/70">
              {principal.valor} {NOMBRE_METRICA[principal.metrica].de}, con {tot.actions ?? 0}{' '}
              {(tot.actions ?? 0) === 1 ? 'acción medida' : 'acciones medidas'}.
            </p>
            <button
              type="button"
              onClick={() => void compartir(principal)}
              className="press mt-4 inline-flex h-10 items-center gap-2 rounded-pill bg-brote-cream px-4 text-small font-semibold text-brote-ink hover:-translate-y-0.5"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Compartir
            </button>
          </>
        ) : (
          <>
            <h1 className="mt-2 font-display text-display-l font-extrabold leading-[1.08]">Tu impacto empieza con tu primera acción medida</h1>
            <p className="mt-2 text-small leading-relaxed text-brote-cream/70">
              Cada acción del día, de tu rutina o del catálogo suma agua, CO₂, residuos y energía de verdad. Acá vas a verlo en cosas de todos los días.
            </p>
            <Link
              href="/"
              className="press mt-4 inline-flex h-10 items-center gap-2 rounded-pill bg-brote-cream px-4 text-small font-semibold text-brote-ink hover:-translate-y-0.5"
            >
              Ver las acciones de hoy <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </>
        )}
      </header>

      {/* Una tarjeta por métrica que se movió. */}
      {todas.map((h, i) => (
        <Reveal key={h.metrica} index={i}>
          <TarjetaMetrica h={h} />
        </Reveal>
      ))}

      {faltan.length > 0 && todas.length > 0 && (
        <section aria-labelledby="impacto-faltan" className="rounded-card border border-dashed border-border p-4">
          <h2 id="impacto-faltan" className="text-small font-semibold">
            Todavía no moviste {faltan.map((m) => NOMBRE_METRICA[m].titulo.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' ni $1')}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {faltan.map((m) => (
              <li key={m}>
                <Link
                  href={PARA_MOVER[m].href}
                  className="press inline-flex h-9 items-center gap-1.5 rounded-pill border border-border px-3 text-caption font-semibold hover:border-foreground/30"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: NOMBRE_METRICA[m].color }} aria-hidden />
                  {PARA_MOVER[m].texto}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {deSemana && (
        <section aria-labelledby="impacto-semana">
          <span className="eyebrow block text-muted-foreground">Últimos 7 días</span>
          <h2 id="impacto-semana" className="mt-1 text-balance font-display text-h2 font-bold leading-snug">
            <FraseDestacada h={deSemana} color={NOMBRE_METRICA[deSemana.metrica].color} />
          </h2>
        </section>
      )}

      <ImpactBenchmark days={30} />

      {comunidad && pulso.data && (
        <section aria-labelledby="impacto-todos" className="rounded-card border border-border bg-surface p-4 shadow-soft">
          <span className="eyebrow flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Entre todos en Brote
          </span>
          <h2 id="impacto-todos" className="mt-1 text-balance font-display text-h3 font-bold leading-snug">
            {comunidad.frase}
          </h2>
          <p className="mt-1 text-caption text-muted-foreground tnum">
            {comunidad.valor} de agua, {formatCo2(pulso.data.co2_kg)} de CO₂ y {formatWaste(pulso.data.residuos_kg)} de residuos, con{' '}
            {pulso.data.acciones} acciones de {pulso.data.personas} personas.
          </p>
        </section>
      )}

      <ComoSeCalcula />
    </div>
  );
}

function TarjetaMetrica({ h }: { h: Historia }) {
  const color = NOMBRE_METRICA[h.metrica].color;
  const otras = [...h.otrasFrases.map((f) => ({ texto: f.frase, icono: f.icono, base: f.base })), ...h.ejemplos];
  return (
    <section aria-labelledby={`metrica-${h.metrica}`} className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
      <div className="flex items-start justify-between gap-3 p-4" style={{ background: `${color}12` }}>
        <div className="min-w-0">
          <span className="eyebrow block" style={{ color }}>
            {NOMBRE_METRICA[h.metrica].titulo}
          </span>
          <h2 id={`metrica-${h.metrica}`} className="mt-1 text-balance font-display text-h3 font-bold leading-snug">
            <FraseDestacada h={h} color={color} />
          </h2>
          <p className="mt-1 text-caption text-muted-foreground">{h.base}</p>
        </div>
        <span className="shrink-0 rounded-pill bg-surface px-2.5 py-1 font-display text-small font-bold tnum shadow-soft" style={{ color }}>
          {h.valor}
        </span>
      </div>
      {otras.length > 0 && (
        <div className="p-4 pt-3">
          <span className="eyebrow block text-muted-foreground">En otras palabras</span>
          <ul className="mt-2 space-y-2.5">
            {otras.slice(0, 4).map((o) => (
              <li key={o.texto} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: `${color}1f`, color }}>
                  <IconoImpacto icono={o.icono} className="h-4 w-4" />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-small font-medium leading-snug">{o.texto}</span>
                  <span className="block text-caption text-muted-foreground">{o.base}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link
        href={PARA_MOVER[h.metrica].href}
        className="group flex items-center justify-between gap-2 border-t border-hairline px-4 py-3 text-small font-semibold transition-colors hover:bg-surface-2"
      >
        <span>Sumar más: {PARA_MOVER[h.metrica].texto.toLowerCase()}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  );
}

/** "¿Cómo lo calculamos?" (13-IMPACT-MIRROR §3): qué cuenta, de dónde sale cada cifra y su versión. */
function ComoSeCalcula() {
  const [abierto, setAbierto] = useState(false);
  const grupos: { m: Metrica; cosas: { texto: string; base: string }[] }[] = (
    [
      ['water', WATER_EQ],
      ['co2', CO2_EQ],
      ['waste', WASTE_EQ],
      ['energy', ENERGY_EQ],
    ] as const
  ).map(([m, eqs]) => ({
    m,
    cosas: [
      ...HABITOS[m].map((h) => ({
        texto: h.frase.replace('{d}', '…').replace(/\.$/, ''),
        base: `${h.base} (${FORMATO[m](h.porDia)} por día)`,
      })),
      ...eqs.map((e) => ({ texto: e.one.charAt(0).toUpperCase() + e.one.slice(1), base: `${e.base} (${FORMATO[m](e.per)})` })),
    ],
  }));

  return (
    <section className="rounded-card border border-border bg-surface">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex items-center gap-2 text-small font-semibold">
          <ShieldCheck className="h-4 w-4 text-hecho" aria-hidden />
          ¿Cómo lo calculamos?
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', abierto && 'rotate-180')} aria-hidden />
      </button>
      {abierto && (
        <div className="space-y-4 border-t border-hairline p-4 text-small leading-relaxed">
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Sólo cuentan acciones medidas: las del día, tu rutina, el catálogo y las jornadas de proyectos. El juego no suma.</li>
            <li>Lo que cargás por tu cuenta suma puntos, pero no impacto: nadie midió cuánto ahorró.</li>
            <li>Una acción cuenta sólo lo que ahorra esa vez; un arreglo que dura cuenta 30 días.</li>
            <li>Cada cifra de abajo está en el extremo alto de su rango, y los resultados se redondean para abajo.</li>
          </ul>
          {grupos.map((g) => (
            <div key={g.m}>
              <h3 className="eyebrow" style={{ color: NOMBRE_METRICA[g.m].color }}>
                {NOMBRE_METRICA[g.m].titulo}
              </h3>
              <ul className="mt-1 space-y-0.5 text-caption text-muted-foreground">
                {g.cosas.map((c) => (
                  <li key={c.texto}>
                    <span className="text-foreground/85">{c.texto}</span> — {c.base}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-caption text-muted-foreground">
            Cifras versión {VERSION_CIFRAS}. Fuentes y metodología en{' '}
            <Link href="/legal/fuentes" className="font-semibold text-foreground underline-offset-2 hover:underline">
              Fuentes
            </Link>
            .
          </p>
        </div>
      )}
    </section>
  );
}
