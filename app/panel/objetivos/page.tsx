'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePanelPass } from '@/components/panel/PanelPass';
import { Actualizar, ErrorCarga, PageHeader } from '@/components/panel/ui';
import { hace } from '@/components/panel/negocios/etiquetas';
import { objetivosCola, objetivoRevisar } from '@/lib/api/mejora';
import { firmarEvidencia } from '@/lib/api/negocios';
import type { ColaObjetivos } from '@/lib/supabase/rows-negocio';
import { useToastStore } from '@/stores/toast';

type Item = ColaObjetivos['items'][number];
type Accion = 'aprobar' | 'parcial' | 'corregir';

/**
 * `/panel/objetivos` — la cola de cierres (fase 2 §6.3).
 *
 * La evidencia no se sirve desde acá: se pide una URL firmada de 60 segundos y
 * se abre. El bucket sigue siendo privado y el enlace muere solo.
 */
export default function ColaObjetivosPage() {
  const t = useTranslations('negocio');
  const { pass } = usePanelPass();
  const [cola, setCola] = useState<ColaObjetivos | null>(null);
  const [cargando, setCargando] = useState(false);
  const [ahora, setAhora] = useState(0);

  const [fallo, setFallo] = useState(false);
  const cargar = useCallback(async () => {
    if (!pass) return;
    setFallo(false);
    setCargando(true);
    const r = await objetivosCola(pass);
    setCargando(false);
    setAhora(Date.now());
    if (!r.ok) {
      setFallo(true);
      useToastStore.getState().push({ variant: 'error', title: t('mejora.panel.error') });
      return;
    }
    setCola(r);
  }, [pass, t]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const items = cola?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Empresas y Mercado"
        title="Objetivos"
        description="Los objetivos de mejora que las empresas dieron por cumplidos y esperan revisión."
        actions={<Actualizar onClick={() => void cargar()} cargando={cargando} />}
      />

      {fallo && !cola ? (
        <ErrorCarga onReintentar={() => void cargar()} />
      ) : !cola ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="border-y border-hairline py-8 text-center text-small text-muted-foreground">
          {t('mejora.panel.vacia')}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <Cierre key={item.id} item={item} pass={pass} ahora={ahora} onListo={() => void cargar()} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Cierre({
  item,
  pass,
  ahora,
  onListo,
}: {
  item: Item;
  pass: string;
  ahora: number;
  onListo: () => void;
}) {
  const t = useTranslations('negocio');
  const f = useFormatter();
  const [nota, setNota] = useState('');
  const [ocupado, setOcupado] = useState<Accion | null>(null);

  const num = (n: number | null) =>
    n == null ? '—' : `${f.number(Number(n), { maximumFractionDigits: 2 })} ${item.unidad}`.trim();

  async function ver(ruta: string) {
    const url = await firmarEvidencia(pass, item.negocio_id, ruta);
    if (!url) return useToastStore.getState().push({ variant: 'error', title: t('mejora.panel.error') });
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function revisar(accion: Accion) {
    // La corrección sin decir qué falta es una pared. Pedirla es el mínimo.
    if (accion === 'corregir' && !nota.trim()) {
      return useToastStore.getState().push({ variant: 'error', title: t('mejora.panel.notaFalta') });
    }
    setOcupado(accion);
    const r = await objetivoRevisar(pass, item.id, accion, nota.trim());
    setOcupado(null);
    if (!r.ok) return useToastStore.getState().push({ variant: 'error', title: t('mejora.panel.error') });
    useToastStore.getState().push({
      variant: 'success',
      title: t(
        accion === 'aprobar'
          ? 'mejora.panel.aprobado'
          : accion === 'parcial'
            ? 'mejora.panel.marcadoParcial'
            : 'mejora.panel.pedido',
      ),
    });
    onListo();
  }

  return (
    <li className="rounded-card border border-border bg-surface p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <span className="eyebrow text-muted-foreground">
          {t('mejora.panel.deQuien', { negocio: item.negocio, rubro: item.rubro })}
        </span>
        <span className="eyebrow text-muted-foreground">
          {t('mejora.panel.cerradoHace', { hace: hace(t, item.cerrado_at, ahora) })}
        </span>
      </div>

      <p className="mt-1.5 text-body font-semibold leading-snug">{item.titulo}</p>
      <p className="mt-1 max-w-prose text-small leading-relaxed text-muted-foreground">{item.porque}</p>

      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 border-y border-hairline py-3">
        <Dato etiqueta={t('mejora.panel.antesDespues')} valor={`${num(item.linea_base)} → ${num(item.valor_final)}`} />
        <Dato etiqueta={t('mejora.panel.meta')} valor={num(item.objetivo)} />
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="eyebrow text-muted-foreground">{t('mejora.panel.comoMedir')}</dt>
          <dd className="mt-0.5 text-small leading-relaxed">{item.como_medir}</dd>
        </div>
        <div>
          <dt className="eyebrow text-muted-foreground">{t('mejora.panel.evidenciaPedida')}</dt>
          <dd className="mt-0.5 text-small leading-relaxed">{item.evidencia_requerida}</dd>
        </div>
      </dl>

      {item.evidencias.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.evidencias.map((e, i) => (
            <Button key={e.id} size="sm" variant="secondary" onClick={() => void ver(e.path)}>
              <ExternalLink className="h-4 w-4" />
              {t('mejora.panel.verEvidencia')}
              {item.evidencias.length > 1 && <span className="tnum"> {i + 1}</span>}
            </Button>
          ))}
        </div>
      )}

      <Textarea
        aria-label={t('mejora.panel.nota')}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder={t('mejora.panel.notaPh')}
        className="mt-3 min-h-16 text-small"
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button size="sm" className="rounded-pill" loading={ocupado === 'aprobar'} onClick={() => void revisar('aprobar')}>
          {t('mejora.panel.aprobar')}
        </Button>
        <Button size="sm" variant="secondary" loading={ocupado === 'parcial'} onClick={() => void revisar('parcial')}>
          {t('mejora.panel.parcial')}
        </Button>
        <Button size="sm" variant="ghost" loading={ocupado === 'corregir'} onClick={() => void revisar('corregir')}>
          {t('mejora.panel.corregir')}
        </Button>
      </div>
      <p className="mt-1.5 text-caption leading-relaxed text-muted-foreground">{t('mejora.panel.parcialAyuda')}</p>
    </li>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <span className="block">
      <span className="eyebrow block text-muted-foreground">{etiqueta}</span>
      <span className="mt-0.5 block text-body font-semibold tnum">{valor}</span>
    </span>
  );
}
