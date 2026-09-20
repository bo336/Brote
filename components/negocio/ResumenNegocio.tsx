import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import {
  ArrowRight,
  CircleCheck,
  Clock,
  Handshake,
  ShieldCheck,
  Store,
  Target,
  BadgeCheck,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { NivelChip } from '@/components/negocio/NivelChip';
import { AvisosNegocio } from '@/components/negocio/AvisosNegocio';
import { BRAND } from '@/lib/brand';
import type { NegocioDetalle } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

/**
 * El Resumen en la fase 1: estado de la solicitud, estado de la verificación y
 * lo próximo (fase 1 §4.2).
 *
 * Sin la franja de métricas: llega en la fase 4, cuando haya algo real que
 * contar. Una franja con cuatro ceros es exactamente el número inventado que
 * el sistema de diseño prohíbe.
 */
export function ResumenNegocio({ negocio: n }: { negocio: NegocioDetalle }) {
  const t = useTranslations('negocio');
  const f = useFormatter();
  const fecha = (iso: string) => f.dateTime(new Date(iso), { day: 'numeric', month: 'long', year: 'numeric' });

  const enRevision = n.status === 'submitted' || n.status === 'in_review';
  const observada = enRevision && !!n.revision_note;
  const verificada = n.verificaciones.find((v) => v.status === 'verificado') ?? null;
  const captura = n.verificaciones.find((v) => v.method === 'social_token' && v.tiene_captura) ?? null;

  const estadoEtiqueta = observada ? t('estado.observada') : t(`estado.${n.status}`);

  return (
    <div className="max-w-3xl space-y-10">
      <header className={entrada(0)}>
        <span className="eyebrow text-muted-foreground">{t('resumen.eyebrow', { rubro: t(`rubros.${n.rubro}`) })}</span>
        <h1 className="mt-1.5 break-words font-display text-display-l font-bold">{n.nombre_comercial}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <NivelChip tier={n.tier} />
          <span className="rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-caption font-semibold text-muted-foreground">
            {estadoEtiqueta}
          </span>
        </div>
      </header>

      {n.status === 'draft' && (
        <Bloque
          eyebrow={t('resumen.draft.eyebrow')}
          titulo={t('resumen.draft.titulo')}
          cuerpo={t('resumen.draft.cuerpo')}
          accion={{ href: '/negocio/alta', texto: t('resumen.draft.boton') }}
        />
      )}

      {enRevision && !observada && (
        <>
          <Bloque
            eyebrow={t('resumen.revision.eyebrow', { estado: estadoEtiqueta.toLowerCase() })}
            titulo={t('resumen.revision.titulo')}
            cuerpo={t('resumen.revision.cuerpo')}
            pie={n.enviado_at ? t('resumen.revision.enviada', { fecha: fecha(n.enviado_at) }) : undefined}
          />
          <Lista titulo={t('resumen.revision.mientras')} indice={2}>
            {verificada ? (
              <Fila
                icono={CircleCheck}
                titulo={t('resumen.revision.verificadaTitulo')}
                cuerpo={t('resumen.revision.verificadaCuerpo')}
                tono="ok"
              />
            ) : (
              <Fila
                icono={ShieldCheck}
                titulo={t('resumen.revision.verificarTitulo')}
                cuerpo={captura ? t('resumen.capturaEnRevision') : t('resumen.revision.verificarCuerpo')}
                href="/negocio/verificacion"
              />
            )}
          </Lista>
        </>
      )}

      {observada && (
        <>
          <Bloque
            eyebrow={t('resumen.observada.eyebrow')}
            titulo={t('resumen.observada.titulo')}
            cuerpo={t('resumen.observada.cuerpo')}
            cita={n.revision_note}
            accion={{ href: '/negocio/alta', texto: t('resumen.observada.boton') }}
            pie={t('resumen.observada.conservado')}
          />
          <EstadoVerificacion negocio={n} indice={2} />
        </>
      )}

      {n.status === 'approved' && (
        <>
          <Bloque
            eyebrow={t('resumen.approved.eyebrow')}
            titulo={t('resumen.approved.titulo', { nombre: n.nombre_comercial })}
            cuerpo={t('resumen.approved.cuerpo')}
            citaEtiqueta={n.revision_note ? t('resumen.approved.nota') : undefined}
            cita={n.revision_note}
          />
          <Lista titulo={t('resumen.approved.proximo')} indice={2}>
            {!verificada && (
              <Fila
                icono={ShieldCheck}
                titulo={t('resumen.approved.verificarTitulo')}
                cuerpo={captura ? t('resumen.capturaEnRevision') : t('resumen.approved.verificarCuerpo')}
                href="/negocio/verificacion"
              />
            )}
            {ordenIntereses(n.intereses).map((i) =>
              i === 'mejora' ? (
                <Fila
                  key="mejora"
                  icono={Target}
                  titulo={t('resumen.approved.mejoraTitulo')}
                  cuerpo={t('resumen.approved.mejoraCuerpo')}
                  href="/negocio/mejora"
                />
              ) : (
                <Fila
                  key="mercado"
                  icono={Store}
                  titulo={t('resumen.approved.mercadoTitulo')}
                  cuerpo={t('resumen.approved.mercadoCuerpo')}
                  href="/negocio/listados"
                />
              ),
            )}
            <Fila
              key="analitica"
              icono={BarChart3}
              titulo={t('resumen.approved.analiticaTitulo')}
              cuerpo={t('resumen.approved.analiticaCuerpo')}
              href="/negocio/analitica"
            />
            <Fila
              key="kit"
              icono={BadgeCheck}
              titulo={t('resumen.approved.kitTitulo')}
              cuerpo={t('resumen.approved.kitCuerpo')}
              href="/negocio/kit"
            />
          </Lista>
          {verificada && <EstadoVerificacion negocio={n} indice={3} />}
          <AvisosNegocio negocioId={n.id} />
        </>
      )}

      {n.status === 'rejected' && (
        <Bloque
          eyebrow={t('resumen.rejected.eyebrow')}
          titulo={t('resumen.rejected.titulo')}
          citaEtiqueta={t('resumen.rejected.motivo')}
          cita={n.revision_note}
          pie={
            puedeReaplicar(n)
              ? t('resumen.rejected.ya')
              : n.puede_reaplicar_at
                ? t('resumen.rejected.cuando', { fecha: fecha(n.puede_reaplicar_at) })
                : undefined
          }
          accion={puedeReaplicar(n) ? { href: '/negocio/alta', texto: t('resumen.rejected.boton') } : undefined}
        />
      )}

      {n.status === 'suspended' && (
        <Bloque
          eyebrow={t('resumen.suspended.eyebrow')}
          titulo={t('resumen.suspended.titulo')}
          citaEtiqueta={n.revision_note ? t('resumen.suspended.motivo') : undefined}
          cita={n.revision_note}
          pie={t('resumen.suspended.contacto', { email: BRAND.contactEmail })}
        />
      )}

      {n.status === 'closed' && (
        <Bloque
          eyebrow={t('resumen.closed.eyebrow')}
          titulo={t('resumen.closed.titulo')}
          cuerpo={t('resumen.closed.cuerpo')}
        />
      )}
    </div>
  );
}

function puedeReaplicar(n: NegocioDetalle): boolean {
  return !!n.puede_reaplicar_at && new Date(n.puede_reaplicar_at).getTime() <= Date.now();
}

/** Lo que eligieron primero va primero; si no eligieron nada, Mejora arriba. */
function ordenIntereses(intereses: NegocioDetalle['intereses']): ('mejora' | 'mercado')[] {
  if (intereses.length === 1 && intereses[0] === 'mercado') return ['mercado', 'mejora'];
  return ['mejora', 'mercado'];
}

/**
 * Entrada escalonada con CSS (60 ms por bloque), no con un observer de JS: si
 * el frame loop está estrangulado, un elemento que arranca en opacity 0 y
 * espera a JS queda invisible (07 §2.1, trampa 1). Una animación CSS termina
 * igual, y con movimiento reducido directamente no corre.
 */
function entrada(indice: number): string {
  return cn(
    'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both',
    ['', 'motion-safe:delay-75', 'motion-safe:delay-150', 'motion-safe:delay-200', 'motion-safe:delay-300'][Math.min(indice, 4)],
  );
}

function Bloque({
  eyebrow,
  titulo,
  cuerpo,
  cita,
  citaEtiqueta,
  pie,
  accion,
}: {
  eyebrow: string;
  titulo: string;
  cuerpo?: string;
  cita?: string | null;
  citaEtiqueta?: string;
  pie?: string;
  accion?: { href: string; texto: string };
}) {
  return (
    <section className={cn('border-t border-hairline pt-6', entrada(1))}>
      <span className="eyebrow text-muted-foreground">{eyebrow}</span>
      <h2 className="mt-1.5 font-display text-h1 font-bold">{titulo}</h2>
      {cuerpo && <p className="mt-2 max-w-prose text-body leading-relaxed text-muted-foreground">{cuerpo}</p>}
      {cita && (
        <figure className="mt-4 max-w-prose border-l-2 border-brote-sun/70 pl-4">
          {citaEtiqueta && <figcaption className="eyebrow mb-1 text-muted-foreground">{citaEtiqueta}</figcaption>}
          <blockquote className="whitespace-pre-line text-body leading-relaxed text-foreground">{cita}</blockquote>
        </figure>
      )}
      {accion && (
        <Link href={accion.href} className={cn(buttonVariants({ variant: 'primary' }), 'mt-5 rounded-pill')}>
          {accion.texto}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      {pie && <p className="mt-3 text-caption text-muted-foreground">{pie}</p>}
    </section>
  );
}

function Lista({ titulo, indice, children }: { titulo: string; indice: number; children: React.ReactNode }) {
  return (
    <section className={entrada(indice)}>
      <span className="eyebrow text-muted-foreground">{titulo}</span>
      <ul className="mt-2 border-y border-hairline divide-hairline">{children}</ul>
    </section>
  );
}

function Fila({
  icono: Icono,
  titulo,
  cuerpo,
  href,
  etiqueta,
  tono,
}: {
  icono: LucideIcon;
  titulo: string;
  cuerpo: string;
  href?: string;
  etiqueta?: string;
  tono?: 'ok';
}) {
  const contenido = (
    <>
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
          tono === 'ok' ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted-foreground group-hover:text-primary',
        )}
      >
        <Icono className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small font-semibold">
          {href ? <span className="link-underline">{titulo}</span> : titulo}
        </span>
        <span className="mt-0.5 block text-small leading-relaxed text-muted-foreground">{cuerpo}</span>
        {etiqueta && (
          <span className="mt-1 block text-caption text-muted-foreground sm:hidden">
            <Clock className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
            {etiqueta}
          </span>
        )}
      </span>
      {etiqueta && (
        <span className="mt-1 hidden shrink-0 text-caption text-muted-foreground sm:inline">
          <Clock className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
          {etiqueta}
        </span>
      )}
      {href && (
        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      )}
    </>
  );

  return (
    <li>
      {href ? (
        <Link href={href} className="group flex items-start gap-3 py-3.5 transition-colors duration-150">
          {contenido}
        </Link>
      ) : (
        <div className="flex items-start gap-3 py-3.5">{contenido}</div>
      )}
    </li>
  );
}

function EstadoVerificacion({ negocio: n, indice }: { negocio: NegocioDetalle; indice: number }) {
  const t = useTranslations('negocio');
  const f = useFormatter();
  const verificada = n.verificaciones.find((v) => v.status === 'verificado') ?? null;
  const captura = n.verificaciones.find((v) => v.method === 'social_token' && v.tiene_captura) ?? null;

  return (
    <Lista titulo={t('resumen.verificacion')} indice={indice}>
      {verificada ? (
        <Fila
          icono={CircleCheck}
          tono="ok"
          titulo={t(`verificacion.metodos.${verificada.method}.nombre`)}
          cuerpo={t('resumen.verificado', {
            metodo: t(`verificacion.${verificada.method === 'social_token' ? 'media' : 'fuerte'}`),
            fecha: verificada.verified_at
              ? f.dateTime(new Date(verificada.verified_at), { day: 'numeric', month: 'long', year: 'numeric' })
              : '',
          })}
          href="/negocio/verificacion"
        />
      ) : (
        <Fila
          icono={captura ? Handshake : ShieldCheck}
          titulo={captura ? t('resumen.capturaEnRevision') : t('resumen.sinVerificar')}
          cuerpo={t('resumen.revision.verificarCuerpo')}
          href="/negocio/verificacion"
        />
      )}
    </Lista>
  );
}
