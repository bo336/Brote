'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Leaf, MessagesSquare, Sprout, Store, TreePine, Users, type LucideIcon } from 'lucide-react';
import { SOLIDO_LUGAR } from '@/components/nav/nav-items';
import { mapaOk, useMapaAcademia, useMercadoDestacado, useMundoAbierto, usePulsoPlaza } from './datos';
import { leerVisitasDeHoy, marcarVisita } from '@/lib/inicio/visitas';
import type { Destino } from '@/lib/inicio/puentes';
import type { Lugar } from '@/lib/lugares';
import { useSession } from '@/stores/session';
import { cn } from '@/lib/utils/cn';

interface Parada {
  key: string;
  lugar: Lugar;
  nombre: string;
  href: string;
  icon: LucideIcon;
  /** Un punto: hay algo nuevo o pendiente adentro, y hoy todavía no entraste. */
  espera?: boolean;
  /** Para recordar que entraste hoy (y apagar el punto). */
  visita?: Destino;
}

/**
 * La fila de lugares, arriba de Hoy (docs/REESTRUCTURA.md D4).
 *
 * Cada lugar del pueblo en su color, a un toque, con un punto donde hay algo
 * esperando: temas para repasar en la Academia, historias nuevas en la Plaza,
 * productos elegidos en el Mercado. El punto se apaga cuando entrás (se
 * recuerda en este navegador, por día). Es la forma corta de que Hoy conecte
 * con el resto de Brote sin una tarjeta grande por cada lugar.
 */
export function FilaLugares() {
  const tipo = useSession((s) => s.profile?.accountType);
  const esChico = tipo === 'kid';
  const mundo = useMundoAbierto();
  const academia = useMapaAcademia();
  const pulso = usePulsoPlaza(!esChico);
  const mercado = useMercadoDestacado(!esChico);
  const [visitas, setVisitas] = useState<Destino[]>([]);
  useEffect(() => setVisitas(leerVisitasDeHoy()), []);

  const mapa = mapaOk(academia.data);
  const paradas: Parada[] = [
    {
      key: 'academia',
      lugar: 'academia',
      nombre: 'Academia',
      href: '/aprender',
      icon: GraduationCap,
      espera: !!mapa && (mapa.repaso > 0 || !!mapa.siguiente),
      visita: 'academia',
    },
    ...(mundo.data === true
      ? [{ key: 'mundo', lugar: 'mundo' as const, nombre: 'Tu mundo', href: '/mundo', icon: TreePine, visita: 'mundo' as const }]
      : []),
    ...(!esChico
      ? [
          {
            key: 'plaza',
            lugar: 'plaza' as const,
            nombre: 'Plaza',
            href: '/feed',
            icon: MessagesSquare,
            espera: (pulso.data?.today ?? 0) > 0,
            visita: 'plaza' as const,
          },
        ]
      : []),
    { key: 'proyectos', lugar: 'proyectos', nombre: 'Proyectos', href: '/acciones?tab=proyectos', icon: Users },
    { key: 'acciones', lugar: 'acciones', nombre: 'Acciones', href: '/acciones', icon: Leaf },
    ...(!esChico
      ? [
          {
            key: 'mercado',
            lugar: 'mercado' as const,
            nombre: 'Mercado',
            href: '/mercado',
            icon: Store,
            espera: (mercado.data?.length ?? 0) >= 2,
            visita: 'mercado' as const,
          },
        ]
      : []),
    { key: 'impacto', lugar: 'impacto', nombre: 'Tu impacto', href: '/impacto', icon: Sprout },
  ];

  return (
    <nav aria-label="Los lugares de Brote" className="-mx-4">
      <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 pt-0.5">
        {paradas.map((p) => {
          const Icon = p.icon;
          const punto = p.espera && !(p.visita && visitas.includes(p.visita));
          return (
            <li key={p.key} className="shrink-0">
              <Link
                href={p.href}
                prefetch={false}
                onClick={() => p.visita && marcarVisita(p.visita)}
                className="group flex w-[4.25rem] flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    'relative flex h-14 w-14 items-center justify-center rounded-full shadow-soft transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95',
                    SOLIDO_LUGAR[p.lugar],
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden />
                  {punto && (
                    <span
                      className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-brote-coral ring-[3px] ring-background"
                      aria-label="Hay algo nuevo"
                    />
                  )}
                </span>
                <span className="w-full truncate text-center text-caption font-medium leading-tight text-foreground/85">{p.nombre}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
