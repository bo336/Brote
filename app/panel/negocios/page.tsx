'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { ChipRail } from '@/components/ui/chip-rail';
import { Skeleton } from '@/components/ui/skeleton';
import { usePanelPass } from '@/components/panel/PanelPass';
import { Actualizar, ErrorCarga, PageHeader } from '@/components/panel/ui';
import { TablaCola } from '@/components/panel/negocios/TablaCola';
import { negociosCola } from '@/lib/api/negocios';
import type { ColaNegocios, FiltroCola } from '@/lib/supabase/rows-negocio';
import { useToastStore } from '@/stores/toast';

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
  const { pass } = usePanelPass();
  const [filtro, setFiltro] = useState<FiltroCola>('pendientes');
  const [cola, setCola] = useState<ColaNegocios | null>(null);
  const [cargando, setCargando] = useState(false);
  const [ahora, setAhora] = useState(0);

  const [fallo, setFallo] = useState(false);
  const cargar = useCallback(async () => {
    if (!pass) return;
    setFallo(false);
    setCargando(true);
    const r = await negociosCola(pass, filtro);
    setCargando(false);
    setAhora(Date.now());
    if (!r.ok) {
      setFallo(true);
      useToastStore.getState().push({ variant: 'error', title: t('panel.cola.error') });
      return;
    }
    setCola(r);
  }, [pass, filtro, t]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const items = cola?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Empresas y Mercado"
        title="Empresas"
        description="Las empresas que piden entrar: se revisa una por una antes de que aparezcan."
        actions={<Actualizar onClick={() => void cargar()} cargando={cargando} />}
      />

      <ChipRail
        layoutId="negocios-cola-filtro"
        value={filtro}
        onChange={(v) => setFiltro(v as FiltroCola)}
        options={FILTROS.map((f) => ({
          value: f,
          label: cola ? `${t(`panel.cola.filtros.${f}`)} · ${cola.contadores[f]}` : t(`panel.cola.filtros.${f}`),
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
