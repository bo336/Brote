'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { reportarListado } from '@/lib/mercado/acciones';
import { MOTIVOS_REPORTE, type ReportReason } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * Reportar un listado: motivos tipificados, jamás texto libre como única
 * entrada; "otro" con detalle obligatorio (08 §8.1). Una persona reporta un
 * listado una sola vez: lo cierra la base, no esta pantalla.
 */
export function ReportarListado({ listingId, yaReportado }: { listingId: string; yaReportado: boolean }) {
  const t = useTranslations('mercado.reporte');
  const tf = useTranslations('mercado.ficha');
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<ReportReason | null>(null);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(yaReportado);

  async function enviar() {
    if (!motivo) return;
    setEnviando(true);
    const r = await reportarListado(listingId, motivo, detalle);
    setEnviando(false);
    if (!r.ok) {
      if (r.error === 'ya_reportado') setHecho(true);
      useToastStore.getState().push({ variant: 'error', title: t.has(`errores.${r.error}`) ? t(`errores.${r.error}`) : t('errores.error') });
      return;
    }
    setHecho(true);
    setAbierto(false);
    useToastStore.getState().push({ variant: 'success', title: t('gracias') });
  }

  if (hecho) {
    return (
      <span className="inline-flex items-center gap-1 text-small text-muted-foreground">
        <Check className="h-4 w-4" />
        {tf('yaReportado')}
      </span>
    );
  }

  const faltaDetalle = motivo === 'otro' && detalle.trim().length < 10;

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="inline-flex items-center gap-1 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <span className="link-underline">{tf('reportar')}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
      <Sheet open={abierto} onOpenChange={setAbierto} title={t('titulo')} description={t('intro')}>
        <fieldset className="mt-1">
          <legend className="sr-only">{t('titulo')}</legend>
          <div className="space-y-1.5">
            {MOTIVOS_REPORTE.map((m) => (
              <label
                key={m}
                className={cn(
                  'press flex cursor-pointer items-center gap-3 rounded-card border px-3.5 py-2.5 text-small transition-colors duration-150',
                  motivo === m ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-2',
                )}
              >
                <input type="radio" name="motivo" value={m} checked={motivo === m} onChange={() => setMotivo(m)} className="accent-[rgb(var(--primary))]" />
                {t(`motivos.${m}`)}
              </label>
            ))}
          </div>
        </fieldset>
        {motivo && (
          <div className="mt-3">
            <label htmlFor="rep-detalle" className="mb-1 block text-small font-medium">
              {t('detalle')}
            </label>
            <p className="mb-1.5 text-caption text-muted-foreground">{motivo === 'otro' ? t('detalleObligatorio') : t('detalleOpcional')}</p>
            <Textarea id="rep-detalle" value={detalle} onChange={(e) => setDetalle(e.target.value)} className="min-h-20 text-small" />
          </div>
        )}
        <Button block className="mt-4 rounded-pill" loading={enviando} disabled={!motivo || faltaDetalle} onClick={() => void enviar()}>
          {t('enviar')}
        </Button>
      </Sheet>
    </>
  );
}
