'use client';

import { type RefObject } from 'react';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { etiquetaVerificacion, hace } from '@/components/panel/negocios/etiquetas';
import { claveTamano } from '@/lib/negocio/catalogo';
import { formatearCuit } from '@/lib/negocio/normalizar';
import type { RevisionNegocio } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

export type AccionRevision = 'aprobar' | 'pedir_datos' | 'rechazar';

/**
 * La ficha de revisión de un negocio, sin datos propios (07 §4.10). La página
 * de `/panel/negocios/[id]` le pasa lo cargado y los manejadores; así se puede
 * mirar a 360 px con datos de ejemplo sin pasar por la contraseña.
 */
export function FichaRevision({
  datos,
  ahora,
  pendiente,
  nota,
  notaRef,
  ocupado,
  probando,
  onNota,
  onResolver,
  onProbar,
  onVerCaptura,
  onIr,
}: {
  datos: RevisionNegocio;
  ahora: number;
  pendiente: boolean;
  nota: string;
  notaRef?: RefObject<HTMLTextAreaElement>;
  ocupado: AccionRevision | null;
  probando: boolean;
  onNota: (v: string) => void;
  onResolver: (a: AccionRevision) => void;
  onProbar: () => void;
  onVerCaptura: (ruta: string) => void;
  onIr: (id: string) => void;
}) {
  const t = useTranslations('negocio');
  const f = useFormatter();
  const n = datos.negocio;
  const fecha = (iso: string) => f.dateTime(new Date(iso), { day: 'numeric', month: 'long', year: 'numeric' });
  const principal =
    datos.verificaciones.find((v) => v.status === 'verificado') ??
    datos.verificaciones.find((v) => v.method === 'social_token' && v.evidencia_url) ??
    datos.verificaciones[0] ??
    null;
  const verif = etiquetaVerificacion(t, principal);
  const captura = datos.verificaciones.find((v) => v.method === 'social_token' && v.evidencia_url) ?? null;

  return (
    <div className="space-y-6 py-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <VolverACola />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!datos.anterior}
            aria-label={t('panel.detalle.anterior')}
            onClick={() => datos.anterior && onIr(datos.anterior)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!datos.siguiente}
            aria-label={t('panel.detalle.siguiente')}
            onClick={() => datos.siguiente && onIr(datos.siguiente)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <header className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
        <h1 className="break-words font-display text-h1 font-bold">{n.nombre_comercial}</h1>
        <p className="mt-1 text-small text-muted-foreground">
          {t(`rubros.${n.rubro}`)} · {[n.ciudad, n.provincia].filter(Boolean).join(', ') || '—'} ·{' '}
          {t(`tamanos.${claveTamano(n.tamano)}`)}
        </p>
        <p className="mt-1 text-caption text-muted-foreground">
          {n.enviado_at ? t('panel.detalle.hace', { hace: hace(t, n.enviado_at, ahora) }) : t('panel.detalle.noEnviada')} ·{' '}
          <span className="font-semibold text-foreground">
            {n.status !== 'approved' && n.revision_note && pendiente ? t('estado.observada') : t(`estado.${n.status}`)}
          </span>
        </p>
      </header>

      {/* El bloque de IA: vacío en la fase 1, y lo dice en lugar de inventar. */}
      <Card flat className="border-dashed p-4">
        <span className="eyebrow flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> {t('panel.detalle.ia')}
        </span>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{t('panel.detalle.iaVacia')}</p>
      </Card>

      {datos.riesgos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {datos.riesgos.map((r) => (
            <span
              key={r}
              className="rounded-pill border border-brote-coral/30 bg-brote-coral/10 px-2.5 py-0.5 text-caption font-medium text-foreground"
            >
              {t(`panel.riesgos.${r}`)}
            </span>
          ))}
        </div>
      )}

      <section>
        <span className="eyebrow text-muted-foreground">{t('panel.detalle.chequeos')}</span>
        <dl className="mt-1.5 border-y border-hairline divide-hairline text-small">
          <Chequeo etiqueta={t('panel.detalle.verificacion')} tono={verif.tono === 'ok' ? 'ok' : verif.tono === 'mal' ? 'mal' : 'nada'}>
            <span>{verif.texto}</span>
            {principal?.verified_at && (
              <span className="text-muted-foreground"> · {hace(t, principal.verified_at, ahora)}</span>
            )}
            {captura && (
              <button
                type="button"
                className="ml-2 inline-flex items-center gap-1 font-medium text-primary"
                onClick={() => onVerCaptura(captura.evidencia_url!)}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="link-underline">{t('panel.detalle.verCaptura')}</span>
              </button>
            )}
          </Chequeo>

          <Chequeo
            etiqueta={t('panel.detalle.sitio')}
            tono={!n.sitio_web ? 'nada' : n.sitio_estado === 'ok' ? 'ok' : n.sitio_estado === 'caido' ? 'mal' : 'nada'}
          >
            {n.sitio_web ? (
              <>
                <span>
                  {probando
                    ? '…'
                    : n.sitio_estado === 'ok'
                      ? t('panel.detalle.sitioOk')
                      : n.sitio_estado === 'caido'
                        ? t('panel.detalle.sitioCaido')
                        : t('panel.detalle.sitioSinChequear')}
                </span>{' '}
                ·{' '}
                <a
                  href={n.sitio_web}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-0.5 font-medium text-primary"
                >
                  <span className="link-underline break-all">{n.sitio_web.replace(/^https:\/\//, '')}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={onProbar}
                  disabled={probando}
                  className="ml-2 inline-flex items-center gap-1 text-caption text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                >
                  <RefreshCw className={cn('h-3 w-3', probando && 'animate-spin')} />
                  {t('panel.detalle.probarSitio')}
                </button>
              </>
            ) : (
              <span className="text-muted-foreground">{t('panel.detalle.sitioNinguno')}</span>
            )}
          </Chequeo>

          <Chequeo
            etiqueta={t('panel.detalle.cuit')}
            tono={n.cuit === null ? 'nada' : n.cuit_valido ? 'ok' : 'mal'}
          >
            {n.cuit ? (
              <>
                <span className="font-mono tnum">{formatearCuit(n.cuit)}</span>
                <span className="text-muted-foreground">
                  {' · '}
                  {n.cuit_valido ? t('panel.detalle.cuitValido') : t('panel.detalle.cuitInvalido')}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{t('panel.detalle.cuitNinguno')}</span>
            )}
          </Chequeo>

          <Chequeo etiqueta={t('panel.detalle.duplicado')} tono={datos.duplicados.length ? 'mal' : 'ok'}>
            {datos.duplicados.length === 0 ? (
              <span>{t('panel.detalle.duplicadoNo')}</span>
            ) : (
              <span className="flex flex-col gap-1">
                {datos.duplicados.map((d) => (
                  <span key={d.id}>
                    <Link href={`/panel/negocios/${d.id}`} className="font-medium text-primary">
                      <span className="link-underline">{d.nombre}</span>
                    </Link>
                    <span className="text-muted-foreground">
                      {' · '}
                      {d.motivos.map((m) => t(`panel.detalle.motivos.${m}`)).join(', ')} · {t(`estado.${d.status}`)}
                    </span>
                  </span>
                ))}
              </span>
            )}
          </Chequeo>
        </dl>
      </section>

      <section>
        <span className="eyebrow text-muted-foreground">{t('panel.detalle.suspalabras')}</span>
        <blockquote className="mt-1.5 whitespace-pre-line border-l-2 border-border pl-4 text-body leading-relaxed">
          {n.descripcion ?? '—'}
        </blockquote>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="eyebrow text-muted-foreground">{t('panel.detalle.contacto')}</span>
          <ul className="mt-1.5 space-y-1 text-small">
            {n.instagram && (
              <li>
                <a
                  href={`https://www.instagram.com/${n.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 font-medium text-primary"
                >
                  <span className="link-underline">@{n.instagram}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            )}
            {n.email_contacto && <li className="break-all">{n.email_contacto}</li>}
            {n.whatsapp && <li className="tnum">{n.whatsapp}</li>}
            {n.razon_social && <li className="text-muted-foreground">{n.razon_social}</li>}
          </ul>
        </div>
        <div>
          <span className="eyebrow text-muted-foreground">{t('panel.detalle.intereses')}</span>
          <p className="mt-1.5 text-small">
            {n.intereses.length
              ? n.intereses
                  .map((i) => t(i === 'mejora' ? 'resumen.approved.mejoraTitulo' : 'resumen.approved.mercadoTitulo'))
                  .join(' · ')
              : '—'}
          </p>
          {datos.creador && (
            <p className="mt-3 text-caption text-muted-foreground">
              {t('panel.detalle.quien', {
                nombre: datos.creador.display_name ?? (datos.creador.username ? `@${datos.creador.username}` : '—'),
                fecha: fecha(datos.creador.desde),
              })}
            </p>
          )}
        </div>
      </section>

      {pendiente ? (
        <section className="space-y-3 border-t border-hairline pt-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <Button loading={ocupado === 'aprobar'} disabled={!!ocupado} onClick={() => onResolver('aprobar')}>
              <Check className="h-4 w-4" />
              {t('panel.detalle.aprobar')}
            </Button>
            <Button
              variant="secondary"
              loading={ocupado === 'pedir_datos'}
              disabled={!!ocupado}
              onClick={() => onResolver('pedir_datos')}
            >
              <CircleAlert className="h-4 w-4 shrink-0" />
              {t('panel.detalle.pedir')}
            </Button>
            <Button
              variant="danger"
              loading={ocupado === 'rechazar'}
              disabled={!!ocupado}
              onClick={() => onResolver('rechazar')}
            >
              <CircleX className="h-4 w-4" />
              {t('panel.detalle.rechazar')}
            </Button>
          </div>
          <div>
            <label htmlFor="nota-negocio" className="mb-1.5 block text-small font-medium">
              {t('panel.detalle.nota')}
            </label>
            <Textarea
              id="nota-negocio"
              ref={notaRef}
              value={nota}
              onChange={(e) => onNota(e.target.value)}
              placeholder={t('panel.detalle.notaPh')}
              className="min-h-20 text-small"
              maxLength={1000}
            />
          </div>
          <p className="hidden text-caption text-muted-foreground sm:block">{t('panel.detalle.atajos')}</p>
        </section>
      ) : (
        <section className="border-t border-hairline pt-5 text-small">
          <p className="flex items-center gap-2 font-medium">
            <CircleCheck className="h-4 w-4 text-muted-foreground" />
            {t('panel.detalle.noPendiente')}
          </p>
          {n.revision_note && (
            <figure className="mt-3">
              <figcaption className="eyebrow text-muted-foreground">{t('panel.detalle.notaPrevia')}</figcaption>
              <blockquote className="mt-1 whitespace-pre-line text-muted-foreground">{n.revision_note}</blockquote>
            </figure>
          )}
        </section>
      )}
    </div>
  );
}

export function VolverACola() {
  const t = useTranslations('negocio.panel.detalle');
  return (
    <Link
      href="/panel/negocios"
      className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {t('volver')}
    </Link>
  );
}

function Chequeo({
  etiqueta,
  tono,
  children,
}: {
  etiqueta: string;
  tono: 'ok' | 'mal' | 'nada';
  children: React.ReactNode;
}) {
  const Icono = tono === 'ok' ? CircleCheck : tono === 'mal' ? CircleX : CircleAlert;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <dt className="flex w-28 shrink-0 items-center gap-1.5 font-medium">
        <Icono
          className={cn(
            'h-4 w-4 shrink-0',
            tono === 'ok' && 'text-primary',
            tono === 'mal' && 'text-brote-coral',
            tono === 'nada' && 'text-muted-foreground',
          )}
          aria-hidden
        />
        {etiqueta}
      </dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
