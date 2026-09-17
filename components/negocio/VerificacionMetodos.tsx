'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { Check, ChevronDown, CircleAlert, Copy, ImageUp, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/card';
import { METODOS_VERIFICACION, REINTENTO_MINUTOS, REINTENTOS_POR_DIA } from '@/lib/negocio/catalogo';
import { dominioDe } from '@/lib/negocio/normalizar';
import { subirCaptura, verificarNegocio } from '@/lib/api/negocios';
import { registrarCaptura } from '@/lib/negocio/acciones';
import { useToastStore } from '@/stores/toast';
import type { NegocioDetalle, VerificacionNegocio, VerificationMethod } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

/**
 * Los métodos de verificación como filas con hairline, de más fuerte a más
 * liviano (fase 1 §6.2, 07 §4.3). Se usa en `/negocio/verificacion` y en el
 * paso 5 del alta.
 *
 * El error SIEMPRE es humano y accionable: lo que se muestra es el
 * `ultimo_error` que escribió `verify-business` con el mapa de la fase 1, o un
 * código de negocio traducido. Nunca "fetch failed", nunca un código HTTP.
 */
export function VerificacionMetodos({ negocio, puedeEditar }: { negocio: NegocioDetalle; puedeEditar: boolean }) {
  const t = useTranslations('negocio.verificacion');
  const dominio = dominioDe(negocio.sitio_web);
  const porMetodo = new Map(negocio.verificaciones.map((v) => [v.method, v]));
  const verificada = negocio.verificaciones.find((v) => v.status === 'verificado') ?? null;

  const disponibles = METODOS_VERIFICACION.filter((m) =>
    m.requiere === 'sitio' ? !!dominio : !!negocio.instagram,
  );
  const recomendado = disponibles[0]?.method ?? null;
  const [abierto, setAbierto] = useState<VerificationMethod | null>(verificada ? null : recomendado);

  // Con una verificación hecha ya no hay nada que recomendar: todos van juntos.
  const destacado = verificada ? null : recomendado;
  const grupos = [
    { clave: 'recomendado', metodos: METODOS_VERIFICACION.filter((m) => m.method === destacado) },
    { clave: 'otros', metodos: METODOS_VERIFICACION.filter((m) => m.method !== destacado) },
  ].filter((g) => g.metodos.length > 0);

  return (
    <div>
      {verificada && <BannerVerificada v={verificada} />}

      {grupos.map((g, gi) => (
        <section key={g.clave} className={cn(gi > 0 && 'mt-6')}>
          <Eyebrow className="mb-1 block">{t(g.clave)}</Eyebrow>
          {g.metodos.map((m, i) => (
            <FilaMetodo
              key={m.method}
              negocio={negocio}
              metodo={m.method}
              fuerza={m.fuerza}
              requiere={m.requiere}
              dominio={dominio}
              estado={porMetodo.get(m.method) ?? null}
              abierto={abierto === m.method}
              onToggle={() => setAbierto((a) => (a === m.method ? null : m.method))}
              puedeEditar={puedeEditar}
              primera={i === 0}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function BannerVerificada({ v }: { v: VerificacionNegocio }) {
  const t = useTranslations('negocio.verificacion');
  const f = useFormatter();
  return (
    <div className="mb-6 flex items-start gap-3 border-y border-hairline py-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-small font-semibold">{t('listo')}</p>
        <p className="text-caption text-muted-foreground">
          {t('listoDetalle', {
            metodo: t(`metodos.${v.method}.nombre`),
            fecha: v.verified_at ? f.dateTime(new Date(v.verified_at), { day: 'numeric', month: 'long', year: 'numeric' }) : '',
          })}
        </p>
      </div>
    </div>
  );
}

function FilaMetodo({
  negocio,
  metodo,
  fuerza,
  requiere,
  dominio,
  estado,
  abierto,
  onToggle,
  puedeEditar,
  primera,
}: {
  negocio: NegocioDetalle;
  metodo: VerificationMethod;
  fuerza: 'fuerte' | 'media';
  requiere: 'sitio' | 'instagram';
  dominio: string | null;
  estado: VerificacionNegocio | null;
  abierto: boolean;
  onToggle: () => void;
  puedeEditar: boolean;
  primera: boolean;
}) {
  const t = useTranslations('negocio.verificacion');
  const te = useTranslations('negocio.errores');
  const router = useRouter();
  const token = negocio.verify_token;
  const disponible = requiere === 'sitio' ? !!dominio : !!negocio.instagram;
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const ahora = useAhora();

  const verificado = estado?.status === 'verificado';
  const enRevision = metodo === 'social_token' && estado?.tiene_captura && !verificado;

  // `ahora` es null hasta montar: el servidor no sabe qué hora ve el cliente.
  const esperaMin =
    ahora !== null && estado?.ultimo_intento_at && metodo !== 'social_token'
      ? Math.ceil(REINTENTO_MINUTOS - (ahora - new Date(estado.ultimo_intento_at).getTime()) / 60_000)
      : 0;
  const limite = (estado?.intentos_hoy ?? 0) >= REINTENTOS_POR_DIA;
  const bloqueado = !verificado && (esperaMin > 0 || limite);

  // Desde la fase 2, `social_token` también tiene `ultimo_error`: lo que la
  // lectura de la captura encontró que falta.
  const error = mensaje ?? (estado && !verificado ? estado.ultimo_error : null);

  async function verificar() {
    setOcupado(true);
    setMensaje(null);
    const r = await verificarNegocio(negocio.id, metodo);
    setOcupado(false);
    if (!r.ok) {
      setMensaje(te.has(r.error ?? 'error') ? te(r.error ?? 'error') : te('error'));
    } else if (r.status === 'verificado') {
      useToastStore.getState().push({
        variant: 'success',
        title: t('exito', { destino: metodo === 'social_token' ? `@${negocio.instagram}` : dominio ?? '' }),
      });
    } else if (r.mensaje) {
      setMensaje(r.mensaje);
    }
    router.refresh();
  }

  async function subir(archivo: File) {
    setOcupado(true);
    setMensaje(null);
    const up = await subirCaptura(negocio.id, archivo);
    if (!up.ok) {
      setOcupado(false);
      setMensaje(te(up.error));
      return;
    }
    const r = await registrarCaptura(negocio.id, up.ruta);
    if (!r.ok) {
      setOcupado(false);
      setMensaje(te.has(r.error) ? te(r.error) : te('error'));
      return;
    }

    // La captura se lee en el momento (fase 2 §9). Si los cuatro chequeos dan
    // bien queda verificada sola; si no, sigue el camino de siempre —revisión
    // manual— y además se dice qué arreglar para la próxima.
    const lectura = await verificarNegocio(negocio.id, 'social_token');
    setOcupado(false);
    if (lectura.ok && lectura.status === 'verificado') {
      useToastStore.getState().push({
        variant: 'success',
        title: t('exito', { destino: `@${negocio.instagram ?? ''}` }),
      });
    } else {
      useToastStore.getState().push({ variant: 'success', title: t('metodos.social_token.subida') });
      if (lectura.mensaje) setMensaje(lectura.mensaje);
    }
    router.refresh();
  }

  const snippet =
    metodo === 'dominio_meta'
      ? `<meta name="brote-site-verification" content="${token}">`
      : metodo === 'dominio_dns'
        ? `brote-site-verification=${token}`
        : token;

  return (
    <div className={cn('border-b border-hairline', primera && 'border-t')}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        className="group flex w-full items-center gap-3 py-3.5 text-left transition-colors duration-150"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-small font-semibold">
              <span className="link-underline">{t(`metodos.${metodo}.nombre`)}</span>
            </span>
            <span
              className={cn(
                'rounded-pill border px-2 py-px text-[11px] font-semibold uppercase tracking-[0.08em]',
                fuerza === 'fuerte'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-surface-2 text-muted-foreground',
              )}
            >
              {t(fuerza)}
            </span>
          </span>
          {(verificado || enRevision) && (
            <span
              className={cn(
                'mt-0.5 flex items-center gap-1 text-caption',
                verificado ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {verificado ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              {verificado ? t('estado.verificado') : t('estado.enRevision')}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground',
            abierto && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 pb-4">
            {!disponible ? (
              <p className="text-small text-muted-foreground">
                {requiere === 'sitio' ? t('requiereSitio') : t('requiereInstagram')}
              </p>
            ) : (
              <>
                <p className="text-small leading-relaxed text-muted-foreground">
                  {t.rich(`metodos.${metodo}.como`, {
                    dominio: dominio ?? '',
                    handle: negocio.instagram ?? '',
                    code: (c) => <code className="rounded bg-surface-2 px-1 py-px font-mono text-[0.85em]">{c}</code>,
                  })}
                </p>

                {metodo === 'dominio_archivo' && (
                  <p className="break-all font-mono text-caption text-foreground">
                    https://{dominio}/.well-known/brote-verify.txt
                  </p>
                )}

                {!verificado && <Snippet texto={snippet} />}

                {puedeEditar && !verificado && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    {metodo === 'social_token' ? (
                      <>
                        <input
                          ref={archivoRef}
                          type="file"
                          accept="image/png,image/jpeg"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) void subir(f);
                          }}
                        />
                        <Button size="sm" variant="secondary" loading={ocupado} onClick={() => archivoRef.current?.click()}>
                          <ImageUp className="h-4 w-4" />
                          {estado?.tiene_captura ? t('metodos.social_token.cambiar') : t('metodos.social_token.boton')}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" loading={ocupado} disabled={bloqueado} onClick={() => void verificar()}>
                        {t(`metodos.${metodo}.boton`)}
                      </Button>
                    )}
                    {estado?.ultimo_intento_at && ahora !== null && (
                      <span className="text-caption text-muted-foreground">
                        {t('ultimoIntento', { hace: haceTexto(t, ahora, estado.ultimo_intento_at) })}
                      </span>
                    )}
                  </div>
                )}

                {!verificado && limite && <p className="text-caption text-muted-foreground">{t('limiteDia')}</p>}
                {!verificado && !limite && esperaMin > 0 && (
                  <p className="text-caption text-muted-foreground">{t('esperar', { min: esperaMin })}</p>
                )}

                {error && !verificado && (
                  <p
                    role="status"
                    className="flex items-start gap-2 text-small leading-relaxed text-brote-coral motion-safe:animate-in motion-safe:fade-in-0"
                  >
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Snippet({ texto }: { texto: string }) {
  const t = useTranslations('negocio.verificacion');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const id = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(id);
  }, [copiado]);

  return (
    <div className="flex items-stretch gap-2">
      <code className="min-w-0 flex-1 break-all rounded-button border border-border bg-surface-2 px-3 py-2.5 font-mono text-caption leading-relaxed text-foreground">
        {texto}
      </code>
      <Button
        size="sm"
        variant="secondary"
        className="h-auto shrink-0"
        onClick={() => {
          void navigator.clipboard?.writeText(texto).then(() => setCopiado(true));
        }}
        aria-live="polite"
      >
        {copiado ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        {copiado ? t('copiado') : t('copiar')}
      </Button>
    </div>
  );
}

/** El reloj que decide cuánto falta para reintentar; late cada 30 s. */
function useAhora(): number | null {
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

function haceTexto(
  t: ReturnType<typeof useTranslations<'negocio.verificacion'>>,
  ahora: number,
  iso: string,
): string {
  const min = Math.floor((ahora - new Date(iso).getTime()) / 60_000);
  if (min < 1) return t('hace.recien');
  if (min < 60) return t('hace.min', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('hace.h', { n: h });
  return t('hace.d', { n: Math.floor(h / 24) });
}
