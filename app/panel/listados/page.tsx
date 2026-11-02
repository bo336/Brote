'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { ChevronRight, ImageOff } from 'lucide-react';
import { ChipRail } from '@/components/ui/chip-rail';
import { Skeleton } from '@/components/ui/skeleton';
import { usePanelPass } from '@/components/panel/PanelPass';
import { Actualizar, ErrorCarga, PageHeader } from '@/components/panel/ui';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { listadosCola } from '@/lib/api/mercado';
import { urlImagen } from '@/lib/mercado/imagenes';
import type { ColaListados } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';

/**
 * `/panel/listados` — la cola de listados (fase 3 §6.2). FIFO: el que más
 * espera, primero. `?modo=auditoria` es la cola de auditoría posterior de la
 * publicación acelerada (fase 3 §6.3).
 */
export default function ColaListadosPage() {
  const t = useTranslations('mercado.panel');
  const tc = useTranslations('mercado.categorias');
  const tv = useTranslations('negocio.panel');
  const f = useFormatter();
  const params = useSearchParams();
  const { pass } = usePanelPass();
  const [modo, setModo] = useState<'pendientes' | 'auditoria'>(params.get('modo') === 'auditoria' ? 'auditoria' : 'pendientes');
  const [cola, setCola] = useState<ColaListados | null>(null);
  const [cargando, setCargando] = useState(false);

  const [fallo, setFallo] = useState(false);
  const cargar = useCallback(async () => {
    if (!pass) return;
    setFallo(false);
    setCargando(true);
    const r = await listadosCola(pass, modo);
    setCargando(false);
    if (!r.ok) {
      setFallo(true);
      useToastStore.getState().push({ variant: 'error', title: t('error') });
      return;
    }
    setCola(r);
  }, [pass, modo, t]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Empresas y Mercado"
        title="Productos"
        description="Lo que las tiendas quieren publicar en el Mercado, y lo ya publicado que falta auditar."
        actions={<Actualizar onClick={() => void cargar()} cargando={cargando} />}
      />

      <ChipRail
        layoutId="listados-cola-modo"
        value={modo}
        onChange={(v) => setModo(v as 'pendientes' | 'auditoria')}
        options={(['pendientes', 'auditoria'] as const).map((m) => ({
          value: m,
          label: cola ? `${t(`modos.${m}`)} · ${cola.contadores[m]}` : t(`modos.${m}`),
        }))}
      />

      {fallo && !cola ? (
        <ErrorCarga onReintentar={() => void cargar()} />
      ) : !cola ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : cola.items.length === 0 ? (
        <p className="border-y border-hairline py-8 text-center text-small text-muted-foreground">{t('vacia')}</p>
      ) : (
        <ul className="border-y border-hairline divide-hairline">
          {cola.items.map((it) => {
            const img = urlImagen(it.imagen);
            const cuando = modo === 'auditoria' ? it.publicado_at : it.enviado_at;
            return (
              <li key={it.id}>
                <Link href={`/panel/listados/${it.id}${modo === 'auditoria' ? '?modo=auditoria' : ''}`} className="group flex items-center gap-3 py-3">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-2">
                    {img ? <Image src={img} alt="" fill sizes="48px" className="object-cover" /> : <ImageOff className="h-4 w-4 text-muted-foreground" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow flex flex-wrap gap-x-1.5 text-muted-foreground">
                      <span>{it.negocio.nombre}</span>
                      <span aria-hidden>·</span>
                      <span>{tc(it.categoria)}</span>
                      <span aria-hidden>·</span>
                      <span>{t(`verificacion.${it.negocio.verificacion ?? 'ninguna'}`)}</span>
                    </span>
                    <span className="block truncate text-small font-semibold">
                      <span className="link-underline">{it.titulo}</span>
                    </span>
                    <span className="block text-caption text-muted-foreground">
                      {it.ia
                        ? t('ia', { puntaje: it.ia.puntaje, recomendacion: t.has(`recomendaciones.${it.ia.recomendacion}`) ? t(`recomendaciones.${it.ia.recomendacion}`) : it.ia.recomendacion })
                        : t('soloReglas')}
                      {cuando && ` · ${f.relativeTime(new Date(cuando))}`}
                    </span>
                  </span>
                  <NivelBadge nivel={it.negocio.tier} tamano="sm" enlace={false} className="hidden sm:inline-flex" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
