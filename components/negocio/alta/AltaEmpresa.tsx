'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Loader2, Store, Target, Trophy } from 'lucide-react';
import { Field, Input, Select } from '@/components/ui/input';
import { crearEmpresa, type ValoresEmpresa } from '@/lib/negocio/acciones';
import { RUBROS, TAMANOS, claveTamano } from '@/lib/negocio/catalogo';
import { PROVINCES } from '@/lib/data/cities';
import { cn } from '@/lib/utils/cn';

/**
 * Dos cuentas de empresa distintas (0121), y la primera pregunta es para qué.
 *
 * Una TIENDA vende en el Mercado: es todo lo que necesita y es lo que ve. Una
 * EMPRESA QUE MEJORA viene a bajar su huella: cuenta cómo trabaja, recibe
 * objetivos y acciones a su medida y compite en la Liga. Mezclarlas en un solo
 * alta era lo que confundía a las dos.
 */
export function ElegirTipoNegocio() {
  const t = useTranslations('negocio.tipo');
  return (
    <div className="pt-2">
      <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
      <h1 className="mt-1.5 font-display text-display-l font-bold leading-tight">{t('titulo')}</h1>
      <p className="mt-2 max-w-prose text-body leading-relaxed text-muted-foreground">{t('bajada')}</p>

      <div className="mt-6 grid gap-3">
        <Opcion
          href="/negocio/alta?nuevo=1&tipo=vender"
          icono={<Store className="h-6 w-6" aria-hidden />}
          color="#FFB23E"
          titulo={t('venderTitulo')}
          cuerpo={t('venderCuerpo')}
          puntos={[t('vender1'), t('vender2'), t('vender3')]}
        />
        <Opcion
          href="/negocio/alta?nuevo=1&tipo=mejorar"
          icono={<Target className="h-6 w-6" aria-hidden />}
          color="#1FB57A"
          titulo={t('mejorarTitulo')}
          cuerpo={t('mejorarCuerpo')}
          puntos={[t('mejorar1'), t('mejorar2'), t('mejorar3')]}
        />
      </div>
      <p className="mt-4 text-caption text-muted-foreground">{t('ambas')}</p>
    </div>
  );
}

function Opcion({
  href,
  icono,
  color,
  titulo,
  cuerpo,
  puntos,
}: {
  href: string;
  icono: React.ReactNode;
  color: string;
  titulo: string;
  cuerpo: string;
  puntos: string[];
}) {
  return (
    <Link
      href={href}
      className="press group block rounded-card border border-border bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: `${color}1f`, color }}
        >
          {icono}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-h3 font-bold leading-snug">{titulo}</p>
          <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">{cuerpo}</p>
          <ul className="mt-2 space-y-1">
            {puntos.map((p) => (
              <li key={p} className="flex items-start gap-2 text-small">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

/** El alta de una empresa que mejora: seis datos, y al programa. */
export function AltaEmpresa() {
  const t = useTranslations('negocio');
  const te = useTranslations('negocio.empresa');
  const router = useRouter();
  const [v, setV] = useState<ValoresEmpresa>({
    nombre_comercial: '',
    rubro: '',
    tamano: '2-10',
    provincia: '',
    ciudad: '',
    sitio_web: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campo, setCampo] = useState<string | null>(null);

  const set = (k: keyof ValoresEmpresa) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setError(null);
    setCampo(null);
    if (v.nombre_comercial.trim().length < 2) return setCampo('nombre_comercial');
    if (!v.rubro) return setCampo('rubro');
    if (!v.provincia) return setCampo('provincia');
    setEnviando(true);
    const r = await crearEmpresa(v);
    if (!r.ok) {
      setEnviando(false);
      if (r.campo) setCampo(r.campo);
      else setError(t.has(`errores.${r.error}`) ? t(`errores.${r.error}`) : t('errores.error'));
      return;
    }
    // Straight into the programme: telling how it works is the first step.
    router.push('/negocio/mejora/dossier');
    router.refresh();
  }

  const mal = (k: string) => campo === k;

  return (
    <form onSubmit={enviar} noValidate className="pt-2">
      <span className="eyebrow text-primary">{te('eyebrow')}</span>
      <h1 className="mt-1.5 font-display text-display-l font-bold leading-tight">{te('titulo')}</h1>
      <p className="mt-2 max-w-prose text-body leading-relaxed text-muted-foreground">{te('bajada')}</p>

      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
        {[
          { i: <Target className="h-4 w-4" />, txt: te('paso1') },
          { i: <ArrowRight className="h-4 w-4" />, txt: te('paso2') },
          { i: <Trophy className="h-4 w-4" />, txt: te('paso3') },
        ].map((p, n) => (
          <li key={n} className="flex items-start gap-2 rounded-card border border-border bg-surface-2 p-3 text-caption leading-relaxed">
            <span className="mt-0.5 text-primary">{p.i}</span>
            {p.txt}
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-3">
        <Field label={t('alta.paso1.nombre')} htmlFor="emp-nombre">
          <Input
            id="emp-nombre"
            autoComplete="organization"
            value={v.nombre_comercial}
            onChange={set('nombre_comercial')}
            invalid={mal('nombre_comercial')}
            placeholder={t('alta.paso1.nombrePh')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('alta.paso1.rubro')} htmlFor="emp-rubro">
            <Select id="emp-rubro" value={v.rubro} onChange={set('rubro')} className={cn(mal('rubro') && 'border-brote-coral')}>
              <option value="" disabled>
                {t('alta.paso1.elegir')}
              </option>
              {RUBROS.map((r) => (
                <option key={r} value={r}>
                  {t(`rubros.${r}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('alta.paso1.tamano')} htmlFor="emp-tamano" help={te('tamanoAyuda')}>
            <Select id="emp-tamano" value={v.tamano} onChange={set('tamano')}>
              {TAMANOS.map((s) => (
                <option key={s} value={s}>
                  {t(`tamanosCorto.${claveTamano(s)}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('alta.paso1.provincia')} htmlFor="emp-provincia">
            <Select
              id="emp-provincia"
              value={v.provincia}
              onChange={set('provincia')}
              className={cn(mal('provincia') && 'border-brote-coral')}
            >
              <option value="" disabled>
                {t('alta.paso1.elegir')}
              </option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('alta.paso1.ciudad')} htmlFor="emp-ciudad">
            <Input id="emp-ciudad" autoComplete="address-level2" value={v.ciudad} onChange={set('ciudad')} invalid={mal('ciudad')} />
          </Field>
        </div>
        <Field label={te('sitio')} htmlFor="emp-sitio" help={te('sitioAyuda')}>
          <Input
            id="emp-sitio"
            inputMode="url"
            placeholder="tuempresa.com.ar"
            value={v.sitio_web}
            onChange={set('sitio_web')}
            invalid={mal('sitio_web')}
          />
        </Field>
      </div>

      {(error || campo) && (
        <p role="alert" className="mt-3 text-small font-medium text-brote-coral">
          {error ?? te('revisar')}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="press mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-primary px-6 text-body font-semibold text-primary-foreground shadow-crisp disabled:opacity-60 sm:w-auto"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {te('crear')}
        {!enviando && <ArrowRight className="h-4 w-4" aria-hidden />}
      </button>
    </form>
  );
}
