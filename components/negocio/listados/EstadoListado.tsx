'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft, Check, Eye, Paperclip, Pencil, Send, Sparkles, Undo2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { subirDocumento } from '@/lib/api/mercado';
import { enviarDescargo, retirarListado } from '@/lib/mercado/acciones';
import { CLAIMS } from '@/lib/mercado/claims';
import { puede } from '@/lib/negocio/roles';
import type { ListadoDetalle, ReporteNegocio } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * La ficha de estado de un listado, para su empresa: dónde está, qué le dijo
 * el revisor, qué sugiere el análisis automático y qué reportes tiene — con el
 * derecho de descargo a mano (08 §8.2).
 */
export function EstadoListado({ detalle }: { detalle: ListadoDetalle }) {
  const t = useTranslations('mercado.estado');
  const tl = useTranslations('mercado.listados');
  const ta = useTranslations('mercado.afirmaciones');
  const tc = useTranslations('mercado.categorias');
  const tr = useTranslations('mercado.reporte.motivos');
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const l = detalle.listado;
  // Una tienda nueva (Mercado v2) edita en vivo lo publicado; el flujo anterior
  // lo tenía que retirar primero.
  const vendedor = detalle.negocio?.modelo === 'vendedor';
  const editable = l.status === 'draft' || l.status === 'despublicado' || (vendedor && l.status === 'publicado');
  const puedeEditar = puede(detalle.rol, 'crear_listado');

  async function retirar() {
    if (l.status === 'publicado' && !window.confirm(t('sacarConfirma'))) return;
    setOcupado(true);
    const r = await retirarListado(l.id);
    setOcupado(false);
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: t('errores.no_retirable') });
      return;
    }
    router.push(vendedor ? `/negocio/listados/${l.id}` : `/negocio/listados/${l.id}/editar?paso=1`);
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <Link href="/negocio/listados" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {tl('titulo')}
      </Link>

      <header className="mt-4">
        <span className="eyebrow flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
          <span className={cn(l.status === 'publicado' && 'text-primary', l.status === 'rechazado' && 'text-brote-coral', l.status === 'despublicado' && 'text-brote-sun')}>
            {tl(`estado.${l.status}`)}
          </span>
          <span aria-hidden>·</span>
          <span>{tc(l.categoria)}</span>
        </span>
        <h1 className="mt-1.5 font-display text-h1 font-bold leading-tight">{l.titulo}</h1>
        {l.status === 'publicado' && <NivelBadge nivel={l.tier_efectivo} className="mt-2" />}
      </header>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/mercado/${l.slug}`} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
          <Eye className="h-4 w-4" />
          {l.status === 'publicado' ? t('verEnMercado') : t('vistaPrevia')}
        </Link>
        {puedeEditar && editable && (
          <Link href={`/negocio/listados/${l.id}/editar?paso=1`} className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'rounded-pill')}>
            <Pencil className="h-4 w-4" />
            {l.status === 'despublicado' ? t('reenviar') : t('editar')}
          </Link>
        )}
        {puedeEditar && (l.status === 'pendiente' || l.status === 'publicado') && (
          <Button size="sm" variant="ghost" loading={ocupado} onClick={() => void retirar()}>
            <Undo2 className="h-4 w-4" />
            {l.status === 'pendiente' ? t('retirar') : t('sacar')}
          </Button>
        )}
      </div>

      {l.status === 'pendiente' && <p className="mt-5 text-small text-muted-foreground">{t('enRevision')}</p>}
      {l.status === 'rechazado' && <p className="mt-5 text-small text-muted-foreground">{t('rechazado')}</p>}
      {l.status === 'despublicado' && l.despublicado_por && t.has(`despublicadoPor.${l.despublicado_por}`) && (
        <p className="mt-5 text-small text-brote-sun">{t(`despublicadoPor.${l.despublicado_por}`)}</p>
      )}
      {l.observacion && (
        <div className="mt-5 border-l-2 border-brote-sun pl-3">
          <span className="eyebrow text-muted-foreground">{t('observacion')}</span>
          <p className="mt-1 text-small leading-relaxed">{l.observacion}</p>
        </div>
      )}

      {/* Cada afirmación con SU nivel: la regla antihalo, también para la empresa. */}
      <section className="mt-8">
        <span className="eyebrow text-muted-foreground">{ta('titulo')}</span>
        <ul className="mt-2 border-y border-hairline divide-hairline">
          {detalle.afirmaciones.map((c) => (
            <li key={c.id} className="flex items-start gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="eyebrow flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
                  <span>{CLAIMS[c.kind].nombre}</span>
                  <span aria-hidden>·</span>
                  <span className={cn(c.status === 'rechazada' && 'text-brote-coral', c.status === 'aprobada' && 'text-primary')}>{ta(`estado.${c.status}`)}</span>
                </span>
                <span className="mt-0.5 block text-small leading-relaxed">{c.enunciado}</span>
                {c.observacion && <span className="mt-1 block text-caption text-brote-sun">{c.observacion}</span>}
              </span>
              {c.status === 'aprobada' && c.tier !== 'e0' && <NivelBadge nivel={c.tier} tamano="sm" />}
            </li>
          ))}
        </ul>
      </section>

      {l.sugerencias && (l.sugerencias.afirmaciones?.length > 0 || l.sugerencias.banderas_texto?.length > 0) && (
        <section className="mt-8">
          <span className="eyebrow inline-flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {t('sugerencias')}
          </span>
          <p className="mt-1 text-caption text-muted-foreground">{t('sugerenciasAyuda')}</p>
          <ul className="mt-2 space-y-2.5">
            {l.sugerencias.banderas_texto?.map((b) => (
              <li key={b} className="text-small text-muted-foreground">
                &ldquo;{b}&rdquo;
              </li>
            ))}
            {l.sugerencias.afirmaciones
              ?.filter((s) => s.problemas.length > 0 || s.texto_sugerido)
              .map((s) => (
                <li key={s.claim_id} className="rounded-[14px] bg-surface-2 px-3.5 py-2.5 text-small leading-relaxed">
                  {s.problemas.length > 0 && <p className="text-muted-foreground">{s.problemas.join(' · ')}</p>}
                  {s.texto_sugerido && <p className="mt-1">&ldquo;{s.texto_sugerido}&rdquo;</p>}
                </li>
              ))}
          </ul>
        </section>
      )}

      {detalle.reportes.length > 0 && (
        <section className="mt-8">
          <span className="eyebrow inline-flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('reportes')}
          </span>
          <p className="mt-1 max-w-prose text-caption leading-relaxed text-muted-foreground">{t('reportesAyuda')}</p>
          <ul className="mt-2 border-y border-hairline divide-hairline">
            {detalle.reportes.map((r) => (
              <Reporte key={r.id} r={r} negocioId={l.business_id} motivo={tr(r.motivo)} puedeResponder={puedeEditar} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Reporte({ r, negocioId, motivo, puedeResponder }: { r: ReporteNegocio; negocioId: string; motivo: string; puedeResponder: boolean }) {
  const t = useTranslations('mercado.estado');
  const f = useFormatter();
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [ruta, setRuta] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  const fecha = (iso: string) => f.dateTime(new Date(iso), { day: 'numeric', month: 'long' });

  async function subir(file: File) {
    const up = await subirDocumento(negocioId, 'reportes', file);
    if (up.ok) setRuta(up.ruta);
    else useToastStore.getState().push({ variant: 'error', title: t('errores.error') });
  }

  async function enviar() {
    setOcupado(true);
    const res = await enviarDescargo(r.id, texto, ruta);
    setOcupado(false);
    if (!res.ok) {
      useToastStore.getState().push({ variant: 'error', title: t.has(`errores.${res.error}`) ? t(`errores.${res.error}`) : t('errores.error') });
      return;
    }
    router.refresh();
  }

  return (
    <li className="py-3.5">
      <p className="eyebrow flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
        <span className={cn(r.estado === 'confirmado' && 'text-brote-coral')}>{t(`reporteEstado.${r.estado}`)}</span>
        <span aria-hidden>·</span>
        <span>{fecha(r.created_at)}</span>
      </p>
      <p className="mt-1 text-small font-semibold">{motivo}</p>
      {r.detalle && <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">&ldquo;{r.detalle}&rdquo;</p>}
      {r.nota && <p className="mt-1.5 text-small leading-relaxed">{r.nota}</p>}
      {r.estado === 'confirmado' && r.corregir_hasta && (
        <p className="mt-1.5 text-caption font-medium text-brote-sun">{t('corregirHasta', { fecha: fecha(r.corregir_hasta) })}</p>
      )}

      {r.descargo ? (
        <div className="mt-2 border-l-2 border-border pl-3">
          <span className="eyebrow text-muted-foreground">{t('descargo')}</span>
          <p className="mt-0.5 text-small leading-relaxed">{r.descargo}</p>
          {r.descargo_at && <p className="mt-0.5 text-caption text-muted-foreground">{t('descargoEnviado', { fecha: fecha(r.descargo_at) })}</p>}
        </div>
      ) : (
        r.estado === 'abierto' &&
        puedeResponder && (
          <div className="mt-2.5 space-y-2">
            <p className="text-caption text-muted-foreground">{t('descargoHasta', { fecha: fecha(r.descargo_vence) })}</p>
            <Textarea aria-label={t('descargo')} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t('descargoPh')} className="min-h-20 text-small" />
            <input
              ref={archivo}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void subir(file);
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => archivo.current?.click()}>
                <Paperclip className="h-4 w-4" />
                {t('adjuntar')}
              </Button>
              <Button size="sm" className="rounded-pill" loading={ocupado} disabled={texto.trim().length < 20} onClick={() => void enviar()}>
                <Send className="h-4 w-4" />
                {t('enviarDescargo')}
              </Button>
              {ruta && <Check aria-label={t('adjuntar')} className="h-4 w-4 text-primary" />}
            </div>
          </div>
        )
      )}
    </li>
  );
}
