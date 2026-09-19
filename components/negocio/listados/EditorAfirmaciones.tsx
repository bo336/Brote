'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, FileUp, Link2, Pencil, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChipRail } from '@/components/ui/chip-rail';
import { Input, Select } from '@/components/ui/input';
import { NivelBadge } from '@/components/mercado/NivelBadge';
import { subirDocumento } from '@/lib/api/mercado';
import { engancharAfirmaciones, guardarAfirmacion } from '@/lib/mercado/acciones';
import {
  CLAIMS,
  CLAIM_KINDS,
  MAX_AFIRMACIONES,
  SIN_E1,
  alcanceDe,
  type Campo,
  type ClaimKind,
  type Datos,
} from '@/lib/mercado/claims';
import { nivelAfirmacion, proximoPaso } from '@/lib/negocio/niveles';
import type { AfirmacionFila, CertificacionFila } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface Borrador {
  id: string | null;
  kind: ClaimKind;
  alcance: string;
  datos: Datos;
  cert_slug: string;
  cert_numero: string;
  cert_vence: string;
  evidencia_path: string | null;
  /** Ya tenía documento (editando una guardada): la ruta no vuelve al cliente. */
  evidencia_previa: boolean;
}

function vacio(kind: ClaimKind): Borrador {
  return { id: null, kind, alcance: '', datos: {}, cert_slug: '', cert_numero: '', cert_vence: '', evidencia_path: null, evidencia_previa: false };
}

/**
 * El paso de afirmaciones — el corazón del formulario (fase 3 §5.2, 07 §4.6).
 *
 * Tres decisiones que importan:
 * 1. La vista previa en vivo: la empresa ve exactamente qué va a leer el
 *    usuario, con la etiqueta de nivel. Nadie se sorprende después.
 * 2. El camino a subir de nivel está a la vista: "→ sube a Nivel 2" al lado
 *    del botón de subir el documento. La escalera se enseña sola.
 * 3. No hay un campo de texto libre para LA AFIRMACIÓN. No hay dónde escribir
 *    "es ecológico". Ese es todo el mecanismo.
 */
export function EditorAfirmaciones({
  negocioId,
  listingId,
  categoria,
  cargadas,
  disponibles,
  certs,
  verificacionFuerte,
  onCambio,
}: {
  negocioId: string;
  listingId: string;
  categoria: string;
  cargadas: AfirmacionFila[];
  disponibles: AfirmacionFila[];
  certs: CertificacionFila[];
  verificacionFuerte: boolean;
  onCambio: () => void;
}) {
  const t = useTranslations('mercado.afirmaciones');
  const tn = useTranslations('mercado.nivel');
  const te = useTranslations('mercado.afirmaciones.errores');
  const [b, setB] = useState<Borrador | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  const ids = cargadas.map((c) => c.id);
  const lleno = cargadas.length >= MAX_AFIRMACIONES;
  const reutilizables = disponibles.filter((c) => c.status === 'aprobada' && !ids.includes(c.id));
  const spec = b ? CLAIMS[b.kind] : null;
  const certsDelTipo = useMemo(() => (b ? certs.filter((c) => c.claims.includes(b.kind)) : []), [b, certs]);
  const cert = b ? certs.find((c) => c.slug === b.cert_slug) ?? null : null;

  const aviso = (title: string) => useToastStore.getState().push({ variant: 'error', title });
  const set = (k: string, v: unknown) => setB((prev) => (prev ? { ...prev, datos: { ...prev.datos, [k]: v } } : prev));

  // La vista previa: el texto público con el nivel que tendría si se aprueba.
  const preview = useMemo(() => {
    if (!b || !spec) return null;
    const a = {
      kind: b.kind,
      alcance: alcanceDe(b.kind, b.alcance, b.datos),
      datos: b.datos,
      cert_slug: b.cert_slug || null,
      cert_numero: b.cert_numero || null,
      cert_vence: b.cert_vence || null,
      evidencia: !!b.evidencia_path || b.evidencia_previa,
      cert: cert ? { nombre: cert.nombre, emisor: cert.emisor } : null,
    };
    const nivel = nivelAfirmacion(a, {
      aprobada: true,
      cert: cert ? { ...cert, claims: cert.claims } : null,
      verificacionFuerte,
    });
    let texto = '';
    try {
      texto = spec.textoPublico(a, nivel === 'e0' ? 'e1' : nivel);
    } catch {
      texto = '';
    }
    return { nivel, texto, paso: proximoPaso(a, nivel, verificacionFuerte) };
  }, [b, spec, cert, verificacionFuerte]);

  async function vincular(nuevos: string[]) {
    const r = await engancharAfirmaciones(listingId, nuevos);
    if (!r.ok) aviso(te.has(r.error) ? te(r.error) : te('error'));
    onCambio();
    return r.ok;
  }

  async function guardar() {
    if (!b) return;
    setGuardando(true);
    setErrores({});
    const r = await guardarAfirmacion(negocioId, b.id, {
      kind: b.kind,
      alcance: b.alcance,
      datos: b.datos,
      cert_slug: b.cert_slug || null,
      cert_numero: b.cert_numero || null,
      cert_vence: b.cert_vence || null,
      evidencia_path: b.evidencia_path,
      categoria,
    });
    if (!r.ok) {
      setGuardando(false);
      const porCampo: Record<string, string> = {};
      for (const e of r.errores ?? [{ campo: 'general', codigo: r.error }]) porCampo[e.campo] ??= e.codigo;
      setErrores(porCampo);
      aviso(te.has(r.error) ? te(r.error) : te('error'));
      return;
    }
    const ok = b.id ? (onCambio(), true) : await vincular([...ids, r.id]);
    setGuardando(false);
    if (ok) setB(null);
  }

  async function subir(f: File) {
    if (!b) return;
    setSubiendo(true);
    const r = await subirDocumento(negocioId, 'afirmaciones', f);
    setSubiendo(false);
    if (!r.ok) return aviso(te.has(r.error) ? te(r.error) : te('error'));
    setB({ ...b, evidencia_path: r.ruta });
  }

  function editar(c: AfirmacionFila) {
    setErrores({});
    setB({
      id: c.id,
      kind: c.kind,
      alcance: c.alcance,
      datos: c.datos,
      cert_slug: c.cert_slug ?? '',
      cert_numero: c.cert_numero ?? '',
      cert_vence: c.cert_vence ?? '',
      evidencia_path: null,
      evidencia_previa: c.evidencia,
    });
  }

  const error = (campo: string) => (errores[campo] ? <p className="mt-1 text-caption text-brote-coral">{te.has(errores[campo]!) ? te(errores[campo]!) : te('campo_invalido')}</p> : null);

  return (
    <section>
      <span className="eyebrow text-muted-foreground">{t('titulo')}</span>
      <p className="mt-1.5 max-w-prose text-small leading-relaxed text-muted-foreground">{t('intro')}</p>

      {/* Las cargadas: cada una con su propio nivel. */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow text-muted-foreground">{t('cargadas')}</span>
          <span className="text-caption text-muted-foreground tnum">
            {cargadas.length}/{MAX_AFIRMACIONES}
          </span>
        </div>
        {cargadas.length === 0 ? (
          <p className="mt-2 border-y border-hairline py-4 text-small text-muted-foreground">{t('ninguna')}</p>
        ) : (
          <ul className="mt-2 border-y border-hairline divide-hairline">
            {cargadas.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="eyebrow flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
                    <span>{CLAIMS[c.kind].nombre}</span>
                    <span aria-hidden>·</span>
                    <span className={cn(c.status === 'rechazada' && 'text-brote-coral', c.status === 'aprobada' && 'text-primary')}>
                      {t(`estado.${c.status}`)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-small leading-relaxed">{c.enunciado}</span>
                  {c.observacion && <span className="mt-1 block text-caption text-brote-sun">{c.observacion}</span>}
                  {/* Debajo del texto y no al lado: en un teléfono, al lado lo aplasta a una palabra por renglón. */}
                  {c.status === 'aprobada' && c.tier !== 'e0' && <NivelBadge nivel={c.tier} tamano="sm" className="mt-1.5" />}
                </span>
                {(c.status === 'borrador' || c.status === 'rechazada') && (
                  <button type="button" onClick={() => editar(c)} aria-label={t('editar')} className="press rounded-button p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void vincular(ids.filter((x) => x !== c.id))}
                  aria-label={t('quitar')}
                  className="press rounded-button p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-brote-coral"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reutilizar una aprobada: se engancha sin volver a revisarse. */}
      {!lleno && reutilizables.length > 0 && (
        <div className="mt-6">
          <span className="eyebrow text-muted-foreground">{t('reutilizar')}</span>
          <p className="mt-1 text-caption text-muted-foreground">{t('reutilizarAyuda')}</p>
          <ul className="mt-2 space-y-1.5">
            {reutilizables.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-card border border-border bg-surface px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-small">{c.enunciado}</span>
                  {c.tier !== 'e0' && <NivelBadge nivel={c.tier} tamano="sm" enlace={false} className="mt-1.5" />}
                </span>
                <Button size="sm" variant="secondary" onClick={() => void vincular([...ids, c.id])}>
                  <Link2 className="h-4 w-4" />
                  {t('enganchar')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Una nueva: el tipo primero, y los campos de ESE tipo. */}
      {!lleno && (
        <div className="mt-7">
          <ChipRail
            layoutId="afirmacion-tipo"
            value={b && !b.id ? b.kind : null}
            onChange={(k) => {
              setErrores({});
              setB(vacio(k as ClaimKind));
            }}
            options={CLAIM_KINDS.map((k) => ({ value: k, label: CLAIMS[k].nombre }))}
          />
          <p className="mt-2 text-caption text-muted-foreground">{t('maximo')}</p>
        </div>
      )}

      {b && spec && (
        <div className="mt-4 rounded-card border border-border bg-surface p-4 shadow-soft motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2.5">
            <span className="font-display text-h3 font-bold">{spec.nombre}</span>
            {preview && preview.nivel !== 'e0' && <NivelBadge nivel={preview.nivel} tamano="sm" enlace={false} />}
          </div>
          <p className="mt-2 text-small leading-relaxed text-muted-foreground">{spec.ayuda}</p>
          {SIN_E1.includes(b.kind) && b.kind !== 'certificacion_tercero' && (
            <p className="mt-2 text-small font-medium text-brote-sun">{t('sinE1')}</p>
          )}

          <div className="mt-4 space-y-3.5">
            {'etiqueta' in spec.alcance && (
              <div>
                <label htmlFor="af-alcance" className="mb-1.5 block text-small font-medium">
                  {spec.alcance.etiqueta}
                </label>
                <Input
                  id="af-alcance"
                  value={b.alcance}
                  placeholder={spec.alcance.placeholder}
                  invalid={!!errores.alcance}
                  onChange={(e) => setB({ ...b, alcance: e.target.value })}
                />
                {error('alcance')}
              </div>
            )}

            {spec.campos
              .filter((c) => !c.mostrarSi || c.mostrarSi(b.datos))
              .map((c) => (
                <CampoAfirmacion key={c.clave} campo={c} valor={b.datos[c.clave]} onChange={(v) => set(c.clave, v)} error={error(c.clave)} si={t('si')} no={t('no')} />
              ))}

            {/* El documento: sube a Nivel 2. */}
            {b.kind !== 'certificacion_tercero' && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
                <input
                  ref={archivo}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void subir(f);
                  }}
                />
                <Button size="sm" variant="secondary" loading={subiendo} onClick={() => archivo.current?.click()}>
                  <FileUp className="h-4 w-4" />
                  {b.evidencia_path || b.evidencia_previa ? t('cambiarDocumento') : t('subirDocumento', { documento: spec.documento })}
                </Button>
                {b.evidencia_path || b.evidencia_previa ? (
                  <span className="inline-flex items-center gap-1 text-caption text-primary">
                    <Check className="h-3.5 w-3.5" />
                    {t('documentoListo')}
                  </span>
                ) : (
                  preview?.paso === 'subir_documento' && <span className="text-caption font-semibold text-nivel-2">{t('subeANivel2')}</span>
                )}
                {error('evidencia')}
              </div>
            )}
            {preview?.paso === 'verificar_dominio' && (
              <p className="text-caption leading-relaxed text-muted-foreground">
                {t('verificarDominio')}{' '}
                <a href="/negocio/verificacion" className="font-medium text-primary">
                  <span className="link-underline">{t('irAVerificar')}</span>
                </a>
              </p>
            )}

            {/* La certificación: sube a Nivel 3. Solo las del registro que habilitan ESTE tipo. */}
            {certsDelTipo.length > 0 && (
              <div className="border-t border-hairline pt-3.5">
                <label htmlFor="af-cert" className="mb-1.5 flex items-baseline justify-between gap-2 text-small font-medium">
                  {t('certificacion')}
                  {preview?.paso === 'cargar_certificacion' && <span className="text-caption font-semibold text-nivel-3">{t('subeANivel3')}</span>}
                </label>
                <p className="-mt-1 mb-1.5 text-caption text-muted-foreground">{t('certificacionAyuda')}</p>
                <Select id="af-cert" value={b.cert_slug} onChange={(e) => setB({ ...b, cert_slug: e.target.value })}>
                  <option value="">{t('sinCertificacion')}</option>
                  {certsDelTipo.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.nombre} · {c.emisor}
                    </option>
                  ))}
                </Select>
                {error('cert_slug')}
                {cert && (
                  <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                    {cert.tiene_numero && (
                      <div>
                        <label htmlFor="af-num" className="mb-1 block text-caption font-medium">
                          {t('numero')}
                        </label>
                        <Input id="af-num" value={b.cert_numero} invalid={!!errores.cert_numero} onChange={(e) => setB({ ...b, cert_numero: e.target.value })} />
                        {error('cert_numero')}
                      </div>
                    )}
                    {cert.vence && (
                      <div>
                        <label htmlFor="af-vence" className="mb-1 block text-caption font-medium">
                          {t('vence')}
                        </label>
                        <Input id="af-vence" type="date" value={b.cert_vence} invalid={!!errores.cert_vence} onChange={(e) => setB({ ...b, cert_vence: e.target.value })} />
                        {error('cert_vence')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Así se va a ver. */}
          {preview && preview.texto && (
            <div className="mt-4 rounded-[14px] bg-surface-2 px-3.5 py-3">
              <span className="eyebrow text-muted-foreground">{t('asiSeVe')}</span>
              <p className="mt-1 text-small leading-relaxed">
                &ldquo;{preview.texto} · {preview.nivel === 'e0' ? tn('e0.corto') : tn(`${preview.nivel}.corto`)}&rdquo;
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-pill" loading={guardando} onClick={() => void guardar()}>
              {b.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {b.id ? t('actualizar') : t('agregar')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setB(null)}>
              {t('cancelar')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Un campo de una afirmación, según su tipo. Nunca texto libre para la afirmación en sí. */
function CampoAfirmacion({
  campo,
  valor,
  onChange,
  error,
  si,
  no,
}: {
  campo: Campo;
  valor: unknown;
  onChange: (v: unknown) => void;
  error: React.ReactNode;
  si: string;
  no: string;
}) {
  const id = `af-${campo.clave}`;
  const etiqueta = (
    <>
      <label htmlFor={id} className="mb-1.5 block text-small font-medium">
        {campo.etiqueta}
      </label>
      {campo.ayuda && <p className="-mt-1 mb-1.5 text-caption leading-relaxed text-muted-foreground">{campo.ayuda}</p>}
    </>
  );

  switch (campo.tipo) {
    case 'texto':
      return (
        <div>
          {etiqueta}
          <Input id={id} value={typeof valor === 'string' ? valor : ''} placeholder={campo.placeholder} maxLength={campo.max} onChange={(e) => onChange(e.target.value)} />
          {error}
        </div>
      );
    case 'numero':
      return (
        <div>
          {etiqueta}
          <div className="flex items-center gap-2">
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              className="max-w-[10rem] tnum"
              value={typeof valor === 'number' ? String(valor) : ''}
              onChange={(e) => onChange(e.target.value === '' ? undefined : Math.round(Number(e.target.value)))}
            />
            {campo.sufijo && <span className="text-small text-muted-foreground">{campo.sufijo}</span>}
          </div>
          {error}
        </div>
      );
    case 'opcion':
      return (
        <div>
          {etiqueta}
          <Select id={id} value={typeof valor === 'string' ? valor : ''} onChange={(e) => onChange(e.target.value || undefined)}>
            <option value="" disabled>
              —
            </option>
            {campo.opciones.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </Select>
          {error}
        </div>
      );
    case 'si_no':
      return (
        <fieldset>
          <legend className="mb-1.5 text-small font-medium">{campo.etiqueta}</legend>
          {campo.ayuda && <p className="-mt-1 mb-1.5 text-caption leading-relaxed text-muted-foreground">{campo.ayuda}</p>}
          <div className="flex gap-1.5">
            {[
              { v: true, l: si },
              { v: false, l: no },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                aria-pressed={valor === o.v}
                onClick={() => onChange(o.v)}
                className={cn(
                  'press rounded-pill border px-3.5 py-1.5 text-small font-medium transition-colors duration-150',
                  valor === o.v ? 'border-primary bg-primary/12 text-primary' : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
          {error}
        </fieldset>
      );
    case 'meses': {
      const actual = Array.isArray(valor) ? (valor as number[]) : [];
      return (
        <fieldset>
          <legend className="mb-1.5 text-small font-medium">{campo.etiqueta}</legend>
          <div className="flex flex-wrap gap-1.5">
            {MESES_CORTOS.map((m, i) => {
              const n = i + 1;
              const on = actual.includes(n);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(on ? actual.filter((x) => x !== n) : [...actual, n].sort((a, b) => a - b))}
                  className={cn(
                    'press w-11 rounded-pill border py-1 text-caption font-medium transition-colors duration-150',
                    on ? 'border-primary bg-primary/12 text-primary' : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
          {error}
        </fieldset>
      );
    }
  }
}
