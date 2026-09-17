'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChipRail } from '@/components/ui/chip-rail';
import { Skeleton } from '@/components/ui/skeleton';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { TablaCola } from '@/components/panel/negocios/TablaCola';
import { negociosCola } from '@/lib/api/negocios';
import type { ColaNegocios, FiltroCola } from '@/lib/supabase/rows-negocio';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const FILTROS: FiltroCola[] = ['pendientes', 'observadas', 'rechazadas', 'todas'];

/**
 * `/panel/negocios` — la cola de altas (fase 1 §7.1).
 *
 * Filas con hairline, ordenadas por antigüedad: la solicitud que más espera va
 * primero. En escritorio es una tabla estilada; en un teléfono, cada fila se
 * apila, porque aprobar desde el teléfono tiene que ser posible (07 §8).
 */
export default function ColaNegociosPage() {
  const t = useTranslations('negocio');
  const { pass, setPass } = usePanelPass();
  const [filtro, setFiltro] = useState<FiltroCola>('pendientes');
  const [cola, setCola] = useState<ColaNegocios | null>(null);
  const [cargando, setCargando] = useState(false);
  const [ahora, setAhora] = useState(0);

  const cargar = useCallback(async () => {
    if (!pass) return;
    setCargando(true);
    const r = await negociosCola(pass, filtro);
    setCargando(false);
    setAhora(Date.now());
    if (!r.ok) {
      // Una contraseña que dejó de valer (se cambió en otra pestaña) vuelve al candado.
      if (/autorizado/i.test(r.error ?? '')) setPass('');
      else useToastStore.getState().push({ variant: 'error', title: t('panel.cola.error') });
      return;
    }
    setCola(r);
  }, [pass, filtro, setPass, t]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!pass) {
    return (
      <CandadoPanel
        verificar={async (p) => (await negociosCola(p, 'pendientes')).ok}
      />
    );
  }

  const items = cola?.items ?? [];

  return (
    <div className="space-y-5 py-4 pb-16">
      <Link
        href="/panel"
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t('panel.volverPanel')}
      </Link>

      <header className="flex items-end justify-between gap-3">
        <div>
          <span className="eyebrow text-muted-foreground">{t('panel.cola.eyebrow')}</span>
          <h1 className="mt-1 font-display text-h1 font-bold">{t('panel.cola.titulo')}</h1>
        </div>
        <Button variant="secondary" size="icon-sm" onClick={() => void cargar()} aria-label={t('panel.cola.actualizar')}>
          <RefreshCw className={cn('h-4 w-4', cargando && 'animate-spin')} />
        </Button>
      </header>

      <ChipRail
        layoutId="negocios-cola-filtro"
        value={filtro}
        onChange={(v) => setFiltro(v as FiltroCola)}
        options={FILTROS.map((f) => ({
          value: f,
          label: cola ? `${t(`panel.cola.filtros.${f}`)} · ${cola.contadores[f]}` : t(`panel.cola.filtros.${f}`),
        }))}
      />

      {!cola ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="border-y border-hairline py-8 text-center text-small text-muted-foreground">
          {t('panel.cola.vacia')}
        </p>
      ) : (
        <TablaCola items={items} filtro={filtro} ahora={ahora} />
      )}
    </div>
  );
}
