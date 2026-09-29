'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Flower2, MessagesSquare, Store, TreeDeciduous, type LucideIcon } from 'lucide-react';
import { SafeImage, ImagenFallback } from '@/components/ui/safe-image';
import { defaultPosterFor } from '@/components/mundo3d/poster/defaultPoster';
import {
  mapaOk,
  unidadEnRama,
  useImpactoHoy,
  useImpactoTotal,
  useMapaAcademia,
  useMercadoDeTema,
  useMercadoDestacado,
  useMundoAbierto,
} from './datos';
import { CEIBO_MAX_FLORES } from './SeguiEnBrote';
import { elegirPuentes, type Destino } from '@/lib/inicio/puentes';
import { impactoDeAccion, pistaDeImpacto, pistasDeImpacto, type ConImpacto } from '@/lib/inicio/impacto';
import { leerVisitasDeHoy, marcarVisita } from '@/lib/inicio/visitas';
import { getDomain, getDomainColor } from '@/lib/domains';
import { urlImagen } from '@/lib/mercado/imagenes';
import { useSession } from '@/stores/session';
import { cn } from '@/lib/utils/cn';
import type { ActivityRow } from '@/lib/supabase/rows';

type Accion = ActivityRow & ConImpacto;

interface Puerta {
  destino: Destino;
  href: string;
  icono: LucideIcon;
  color: string;
  titulo: string;
  bajada: string;
  /** Pictures for the primary card (the island, products). */
  fotos?: { src: string | null; alt: string; href?: string }[];
}

/**
 * "Antes de cerrar" — the card that answers "and now?" the moment an action
 * is marked.
 *
 * Opening the app, ticking one action and closing it was the whole session for
 * most people. This appears right under the checklist as soon as something is
 * done today: first what that action just added (a real number), then ONE
 * door picked for it — a lesson in the same topic, products for it, the ceibo
 * on their island that just got a flower, or the Plaza to tell someone — and
 * the other doors as chips. `lib/inicio/puentes.ts` decides the order.
 */
export function AntesDeCerrar({
  ultima,
  reciente,
  hechasHoy,
  completo,
}: {
  /** The action marked most recently (this visit), or one done earlier today. */
  ultima: Accion | null;
  /** True when `ultima` was marked just now, on this visit. */
  reciente: boolean;
  hechasHoy: number;
  completo: boolean;
}) {
  const t = useTranslations('inicio.antes');
  const reduce = useReducedMotion();
  const tipo = useSession((s) => s.profile?.accountType);
  const profile = useSession((s) => s.profile);
  const esKid = tipo === 'kid';

  const dominio = ultima?.domain_slug ?? null;
  const tema = dominio ? getDomain(dominio) : undefined;
  const mapa = mapaOk(useMapaAcademia().data);
  const mundo = useMundoAbierto();
  const mercadoTema = useMercadoDeTema(dominio);
  const mercado = useMercadoDestacado();
  const hoy = useImpactoHoy();
  const total = useImpactoTotal();

  // Read after mount: localStorage does not exist on the server.
  const [visitados, setVisitados] = useState<Destino[]>([]);
  useEffect(() => setVisitados(leerVisitasDeHoy()), [ultima?.id]);

  const unidad = unidadEnRama(mapa, dominio);
  const productosTema = (mercadoTema.data ?? []).slice(0, 3);
  const flores = Math.min(CEIBO_MAX_FLORES, Math.max(0, Math.floor(total.data?.actions ?? 0)));

  const puertas = useMemo<Record<Destino, Puerta | null>>(() => {
    const sig = mapa?.siguiente ?? null;
    const academia: Puerta | null = unidad
      ? {
          destino: 'academia',
          href: `/aprender/u/${unidad.slug}`,
          icono: TreeDeciduous,
          color: getDomainColor(dominio ?? ''),
          titulo: t('academiaTema', { tema: tema?.name_es ?? '' }),
          bajada: t('academiaBajada', { unidad: unidad.titulo_es, hechas: unidad.hechas, total: unidad.total }),
        }
      : sig
        ? {
            destino: 'academia',
            href: `/aprender/u/${sig.unidad.slug}`,
            icono: TreeDeciduous,
            color: sig.unidad.rama_slug === 'tronco' ? '#1FB57A' : getDomainColor(sig.unidad.rama_slug),
            titulo: t('academiaSiguiente'),
            bajada: t('academiaSiguienteBajada', { unidad: sig.unidad.titulo_es, min: sig.leccion.minutos }),
          }
        : null;

    const enTema = productosTema.length > 0;
    const generales = (mercado.data ?? []).slice(0, 3);
    const mercadoPuerta: Puerta | null =
      esKid || (!enTema && generales.length === 0)
        ? null
        : {
            destino: 'mercado',
            href: '/mercado',
            icono: Store,
            color: '#FFB23E',
            titulo: enTema ? t('mercadoTema', { tema: tema?.name_es ?? '' }) : t('mercadoGeneral'),
            bajada: t('mercadoBajada'),
            fotos: (enTema ? productosTema : generales).map((p) => ({
              src: urlImagen(p.imagen),
              alt: p.titulo,
              href: `/mercado/${p.slug}`,
            })),
          };

    const tier = Math.min(11, Math.max(1, profile?.mundoState?.rankTier ?? 1));
    const mundoPuerta: Puerta | null = mundo.data
      ? {
          destino: 'mundo',
          href: '/mundo',
          icono: Flower2,
          color: '#E8638C',
          titulo: flores > 0 ? t('mundoTitulo', { n: flores }) : t('mundoTituloCero'),
          bajada: t('mundoBajada'),
          fotos: [{ src: profile?.worldSnapshotUrl || defaultPosterFor(tier), alt: '' }],
        }
      : null;

    const texto = ultima ? t('plazaTexto', { accion: ultima.title_es }) : '';
    const plaza: Puerta = esKid
      ? { destino: 'plaza', href: '/feed', icono: MessagesSquare, color: '#2DB4D4', titulo: t('plazaKid'), bajada: t('plazaKidBajada') }
      : {
          destino: 'plaza',
          href: `/feed?escribir=1&texto=${encodeURIComponent(texto)}`,
          icono: MessagesSquare,
          color: '#2DB4D4',
          titulo: t('plazaTitulo'),
          bajada: t('plazaBajada'),
        };

    return { academia, mercado: mercadoPuerta, mundo: mundoPuerta, plaza };
  }, [mapa, unidad, dominio, tema, productosTema, mercado.data, esKid, mundo.data, flores, profile, ultima, t]);

  const orden = elegirPuentes({
    academiaEnTema: !!unidad,
    academiaSiguiente: !!mapa?.siguiente,
    saviaRestante: mapa ? (mapa.savia ? mapa.savia.restante : null) : 0,
    mercadoEnTema: esKid ? 0 : productosTema.length,
    mercadoDisponible: !!puertas.mercado,
    mundoAbierto: !!puertas.mundo,
    visitadosHoy: visitados,
  }).filter((d) => puertas[d]);

  const principal = orden[0] ? puertas[orden[0]] : null;
  const resto = orden.slice(1).map((d) => puertas[d]!).slice(0, 3);

  const sumo = ultima ? pistaDeImpacto(impactoDeAccion(ultima), ultima.domain_slug) : null;
  const delDia = pistasDeImpacto(hoy.data ?? { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 }).slice(0, 2);

  if (hechasHoy === 0) return null;

  return (
    <motion.section
      key={ultima?.id ?? 'dia'}
      aria-labelledby="antes-de-cerrar"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="overflow-hidden rounded-card border border-primary/25 bg-gradient-to-b from-primary/[0.09] to-transparent p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-crisp">
          <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
        </span>
        <div className="min-w-0">
          {/* Just marked: what THAT action added. Coming back later the same
              day: what the day has added so far — never "¡Hecho!" about
              something done hours ago. */}
          <p className="font-display text-h3 font-bold leading-snug">
            {completo
              ? t('diaCompleto')
              : reciente
                ? sumo
                  ? t('sumaste', { impacto: sumo.texto })
                  : t('hecho')
                : delDia.length > 0
                  ? t('hoyYa', { impacto: delDia.map((p) => p.texto).join(t('y')) })
                  : t('hoyYaAcciones', { n: hechasHoy })}
          </p>
          <p className="mt-0.5 text-small text-muted-foreground">
            {(reciente || completo) && delDia.length > 0
              ? t('hoyLlevas', { n: hechasHoy, impacto: delDia.map((p) => p.texto).join(' · ') })
              : t('hoyAcciones', { n: hechasHoy })}
          </p>
        </div>
      </div>

      {principal && (
        <>
          <p id="antes-de-cerrar" className="eyebrow mt-4 text-muted-foreground">
            {t('eyebrow')}
          </p>
          <PuertaPrincipal p={principal} />
        </>
      )}

      {resto.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {resto.map((p) => {
            const Icono = p.icono;
            return (
              <li key={p.destino}>
                <Link
                  href={p.href}
                  onClick={() => marcarVisita(p.destino)}
                  className="press inline-flex h-9 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 text-small font-medium shadow-soft hover:border-primary/30"
                >
                  <Icono className="h-4 w-4" style={{ color: p.color }} aria-hidden />
                  {t(`chip_${p.destino}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}

function PuertaPrincipal({ p }: { p: Puerta }) {
  const Icono = p.icono;
  const fotos = p.fotos ?? [];
  const conProductos = p.destino === 'mercado' && fotos.length > 0;

  return (
    <div className="mt-2 overflow-hidden rounded-card border border-border bg-surface shadow-soft transition-shadow duration-200 hover:shadow-lift">
      <Link
        href={p.href}
        onClick={() => marcarVisita(p.destino)}
        className="group flex items-center gap-3 p-3"
      >
        {p.destino === 'mundo' && fotos[0] ? (
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-brote-ink">
            <SafeImage
              src={fotos[0].src}
              className="h-full w-full object-cover"
              fallback={<ImagenFallback className="h-full w-full" icon={Flower2} color={p.color} iconSize={24} />}
            />
          </span>
        ) : (
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: `${p.color}1f`, color: p.color }}
          >
            <Icono className="h-6 w-6" aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-body font-bold leading-snug">{p.titulo}</span>
          <span className="mt-0.5 line-clamp-2 block text-caption leading-relaxed text-muted-foreground">{p.bajada}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </Link>
      {conProductos && (
        <ul className={cn('grid gap-2 border-t border-hairline p-3', fotos.length >= 3 ? 'grid-cols-3' : 'grid-cols-2')}>
          {fotos.map((f, i) => (
            <li key={i}>
              <Link
                href={f.href ?? p.href}
                onClick={() => marcarVisita('mercado')}
                className="group block aspect-square overflow-hidden rounded-[12px] bg-surface-2"
                aria-label={f.alt}
              >
                <SafeImage
                  src={f.src}
                  alt={f.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  fallback={<ImagenFallback className="h-full w-full" color="#FFB23E" icon={Store} iconSize={22} />}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
