'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChipRail } from '@/components/ui/chip-rail';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { firmarEvidencia } from '@/lib/api/negocios';
import { reporteResolver, reportesCola } from '@/lib/api/mercado';
import type { ColaReportes } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

type Estado = 'abierto' | 'confirmado' | 'desestimado';

/**
 * `/panel/reportes` (fase 3 §9). Listado, motivo, quién reportó y estado.
 *
 * Confirmar exige que la empresa haya podido responder: descargo recibido o 7
 * días vencidos (08 §8.2) — lo frena la base, y acá se dice hasta cuándo.
 * Desestimar no penaliza a nadie, tampoco a quien reportó de buena fe.
 */
export default function ReportesPage() {
  const t = useTranslations('mercado.panel.reportes');
  const tm = useTranslations('mercado.reporte.motivos');
  const tv = useTranslations('negocio.panel');
  const tp = useTranslations('mercado.panel');
  const f = useFormatter();
  const { pass, setPass } = usePanelPass();
  const [estado, setEstado] = useState<Estado>('abierto');
  const [cola, setCola] = useState<ColaReportes | null>(null);
  const [cargando, setCargando] = useState(false);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!pass) return;
    setCargando(true);
    const r = await reportesCola(pass, estado);
    setCargando(false);
    if (!r.ok) {
      if (/autorizado/i.test(r.error ?? '')) setPass('');
      else useToastStore.getState().push({ variant: 'error', title: tp('error') });
      return;
    }
    setCola(r);
  }, [pass, estado, setPass, tp]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function resolver(id: string, accion: 'confirmar' | 'desestimar') {
    if (!pass) return;
    setOcupado(`${accion}-${id}`);
    const r = await reporteResolver(pass, id, accion, notas[id] ?? '');
    setOcupado(null);
    if (!r.ok) {
      const msg = r.error === 'descargo_pendiente' ? t('descargoPendiente') : r.error === 'falta_nota' ? tp('notaFalta') : tp('error');
      useToastStore.getState().push({ variant: 'error', title: msg });
      return;
    }
    useToastStore.getState().push({ variant: 'success', title: tp('hecho') });
    await cargar();
  }

  async function ver(negocioId: string, ruta: string) {
    if (!pass) return;
    const url = await firmarEvidencia(pass, negocioId, ruta);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (!pass) return <CandadoPanel verificar={async (p) => (await reportesCola(p, 'abierto')).ok} />;

  const fecha = (iso: string) => f.dateTime(new Date(iso), { day: 'numeric', month: 'long' });

  return (
    <div className="space-y-5 py-4 pb-16">
      <Link href="/panel" className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {tv('volverPanel')}
      </Link>
      <header className="flex items-end justify-between gap-3">
        <div>
          <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
          <h1 className="mt-1 font-display text-h1 font-bold">{t('titulo')}</h1>
        </div>
        <Button variant="secondary" size="icon-sm" onClick={() => void cargar()} aria-label={t('titulo')}>
          <RefreshCw className={cn('h-4 w-4', cargando && 'animate-spin')} />
        </Button>
      </header>

      <ChipRail
        layoutId="reportes-estado"
        value={estado}
        onChange={(v) => setEstado(v as Estado)}
        options={(['abierto', 'confirmado', 'desestimado'] as const).map((e) => ({
          value: e,
          label: cola ? `${t(`estados.${e}`)} · ${cola.contadores[e]}` : t(`estados.${e}`),
        }))}
      />
      <p className="text-caption text-muted-foreground">{t('confirmarAyuda')}</p>

      {!cola ? (
        <Skeleton className="h-40 w-full" />
      ) : cola.items.length === 0 ? (
        <p className="border-y border-hairline py-8 text-center text-small text-muted-foreground">{t('vacia')}</p>
      ) : (
        <ul className="border-y border-hairline divide-hairline">
          {cola.items.map((r) => {
            const puedeConfirmar = !!r.descargo_at || Date.now() >= new Date(r.descargo_vence).getTime();
            return (
              <li key={r.id} className="py-4">
                <p className="eyebrow flex flex-wrap gap-x-1.5 text-muted-foreground">
                  <span>{r.negocio.nombre}</span>
                  <span aria-hidden>·</span>
                  <span>{fecha(r.created_at)}</span>
                  <span aria-hidden>·</span>
                  <span>{t('delListado', { n: r.reportes_del_listado })}</span>
                </p>
                <Link href={`/panel/listados/${r.listado.id}`} className="mt-1 block text-small font-semibold">
                  <span className="link-underline">{r.listado.titulo}</span>
                </Link>
                <p className="mt-1 text-small">
                  <span className="font-semibold">{tm(r.motivo)}</span>
                  {r.detalle && <span className="text-muted-foreground"> — &ldquo;{r.detalle}&rdquo;</span>}
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground">{t('reportante', { nombre: r.reportante ?? t('anonimo') })}</p>

                <div className="mt-2 border-l-2 border-border pl-3">
                  <span className="eyebrow text-muted-foreground">{t('descargo')}</span>
                  {r.descargo ? (
                    <>
                      <p className="mt-0.5 text-small leading-relaxed">{r.descargo}</p>
                      {r.descargo_path && (
                        <button type="button" onClick={() => void ver(r.negocio.id, r.descargo_path!)} className="mt-1 inline-flex items-center gap-1 text-caption font-medium text-primary">
                          <FileText className="h-3.5 w-3.5" />
                          {t('verEvidencia')}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="mt-0.5 text-caption text-muted-foreground">{t('sinDescargo', { fecha: fecha(r.descargo_vence) })}</p>
                  )}
                </div>
                {r.nota && <p className="mt-2 text-small">{r.nota}</p>}

                {r.estado === 'abierto' && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      aria-label={tp('nota')}
                      placeholder={t('notaPh')}
                      value={notas[r.id] ?? ''}
                      onChange={(e) => setNotas({ ...notas, [r.id]: e.target.value })}
                      className="min-h-14 text-small"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" disabled={!puedeConfirmar} loading={ocupado === `confirmar-${r.id}`} onClick={() => void resolver(r.id, 'confirmar')}>
                        {t('confirmar')}
                      </Button>
                      <Button size="sm" variant="secondary" loading={ocupado === `desestimar-${r.id}`} onClick={() => void resolver(r.id, 'desestimar')}>
                        {t('desestimar')}
                      </Button>
                      {!puedeConfirmar && <span className="text-caption text-muted-foreground">{t('descargoPendiente')}</span>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
