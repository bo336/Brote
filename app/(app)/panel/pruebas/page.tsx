'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, FlaskConical, Mail, RefreshCw, Smartphone, Trash2, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import {
  adminCuentaPrueba,
  adminCuentaPruebaBorrar,
  adminCuentasPrueba,
  adminDashboard,
  adminMundoErrores,
  type CuentaPrueba,
  type ErrorMundo,
} from '@/lib/api/admin';
import { RANK_BY_TIER } from '@/lib/ranks';
import { toast } from '@/stores/toast';

type Tipo = 'kid' | 'teen' | 'adult';
type Negocio = 'ninguno' | 'vender' | 'mejorar' | 'ambos';

const TIPOS: { v: Tipo; label: string }[] = [
  { v: 'kid', label: 'Chico (hasta 12)' },
  { v: 'teen', label: 'Adolescente (13 a 17)' },
  { v: 'adult', label: 'Adulto' },
];

const NEGOCIOS: { v: Negocio; label: string }[] = [
  { v: 'ninguno', label: 'Sin negocio' },
  { v: 'vender', label: 'Tienda (vende en el Mercado)' },
  { v: 'mejorar', label: 'Empresa que mejora (objetivos y liga)' },
  { v: 'ambos', label: 'Las dos' },
];

/** One tap fills the form with a case worth checking. */
const ATAJOS: { label: string; tipo: Tipo; tier: number; negocio: Negocio; alias: string }[] = [
  { label: 'Chico nuevo', tipo: 'kid', tier: 1, negocio: 'ninguno', alias: 'chico' },
  { label: 'Adolescente · Retoño', tipo: 'teen', tier: 4, negocio: 'ninguno', alias: 'adolescente' },
  { label: 'Adulto · Arbusto (crea proyectos)', tipo: 'adult', tier: 5, negocio: 'ninguno', alias: 'adulto' },
  { label: 'Adulto · Gaia (isla completa)', tipo: 'adult', tier: 11, negocio: 'ninguno', alias: 'gaia' },
  { label: 'Tienda', tipo: 'adult', tier: 3, negocio: 'vender', alias: 'tienda' },
  { label: 'Empresa que mejora', tipo: 'adult', tier: 3, negocio: 'mejorar', alias: 'empresa' },
];

/**
 * `/panel/pruebas` — probar la app como cada tipo de cuenta, sin tocar SQL.
 *
 * Las cuentas las crea el dueño (alias de Gmail que llegan a su casilla, enlace
 * por mail, sin contraseñas); acá se elige qué es cada una. La base sólo deja
 * configurar mails con "+" o ya marcados de prueba (0122), así que un error de
 * tipeo nunca cambia una cuenta real.
 */
export default function PruebasPage() {
  const { pass, setPass } = usePanelPass();
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<Tipo>('adult');
  const [tier, setTier] = useState(5);
  const [negocio, setNegocio] = useState<Negocio>('ninguno');
  const [aplicando, setAplicando] = useState(false);
  const [cuentas, setCuentas] = useState<CuentaPrueba[] | null>(null);
  const [errores, setErrores] = useState<{ resumen: Record<string, number>; filas: ErrorMundo[] } | null>(null);

  const cargar = useCallback(async () => {
    if (!pass) return;
    const [c, e] = await Promise.all([adminCuentasPrueba(pass), adminMundoErrores(pass)]);
    if (c.ok) setCuentas(c.cuentas);
    else setCuentas([]);
    if (e.ok) setErrores({ resumen: e.resumen, filas: e.filas });
  }, [pass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!pass) {
    return (
      <CandadoPanel
        verificar={async (p) => {
          const r = await adminDashboard(p);
          return r.ok;
        }}
      />
    );
  }

  const base = email.includes('@') ? email.split('@') : null;
  function atajo(a: (typeof ATAJOS)[number]) {
    setTipo(a.tipo);
    setTier(a.tier);
    setNegocio(a.negocio);
    if (base) setEmail(`${base[0]!.split('+')[0]}+${a.alias}@${base[1]}`);
  }

  async function aplicar() {
    if (!email.trim() || aplicando) return;
    setAplicando(true);
    const r = await adminCuentaPrueba(pass, email.trim(), tipo, tier, tipo === 'adult' ? negocio : 'ninguno');
    setAplicando(false);
    if (!r.ok) {
      toast.error('No se pudo', r.error);
      if (r.error === 'Contraseña incorrecta') setPass('');
      return;
    }
    toast.success('Listo', `@${r.usuario ?? 'cuenta'} ahora es ${TIPOS.find((x) => x.v === tipo)?.label} · ${RANK_BY_TIER[tier]?.name_es}`);
    void cargar();
  }

  async function borrar(c: CuentaPrueba) {
    if (!confirm(`¿Borrar para siempre la cuenta de prueba ${c.email}? Se borra todo lo que hizo.`)) return;
    const r = await adminCuentaPruebaBorrar(pass, c.email);
    if (!r.ok) return toast.error('No se pudo borrar', r.error);
    toast.success('Cuenta borrada');
    void cargar();
  }

  return (
    <div className="space-y-6 pb-10">
      <Link href="/panel" className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Panel
      </Link>
      <header>
        <span className="eyebrow text-primary">Pruebas</span>
        <h1 className="mt-1 flex items-center gap-2 font-display text-h1 font-bold">
          <FlaskConical className="h-6 w-6 text-primary" /> Probar cada tipo de cuenta
        </h1>
      </header>

      <Card className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 font-display text-h3 font-bold">
          <Mail className="h-4 w-4 text-primary" /> Cómo se arma, una vez
        </h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-small leading-relaxed">
          <li>
            Abrí una <b>ventana de incógnito</b> (o un perfil de navegador) por cada cuenta que quieras probar.
          </li>
          <li>
            Entrá a la app con un <b>alias de tu mail</b>: <code>tucorreo+chico@gmail.com</code>,{' '}
            <code>tucorreo+tienda@gmail.com</code>… Gmail los manda a tu misma casilla. Entrás con el enlace, sin
            contraseña.
          </li>
          <li>Hacé el onboarding con cualquier respuesta.</li>
          <li>Volvé acá, escribí ese mail y elegí qué tiene que ser. Recargá la otra ventana.</li>
        </ol>
        <p className="text-caption text-muted-foreground">
          Sólo se configuran mails con “+”: nunca se toca una cuenta real. Quedan con el perfil privado y se borran desde
          la lista de abajo cuando termines.
        </p>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="flex items-center gap-2 font-display text-h3 font-bold">
          <Users className="h-4 w-4 text-primary" /> Configurar una cuenta
        </h2>
        <div className="flex flex-wrap gap-2">
          {ATAJOS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => atajo(a)}
              className="press rounded-pill border border-border bg-surface-2 px-3 py-1.5 text-caption font-medium hover:border-primary/40"
            >
              {a.label}
            </button>
          ))}
        </div>
        <Field label="Mail de la cuenta" htmlFor="prueba-mail" help="Con un + : tucorreo+chico@gmail.com">
          <Input id="prueba-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo+chico@gmail.com" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Tipo de cuenta" htmlFor="prueba-tipo">
            <Select id="prueba-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
              {TIPOS.map((x) => (
                <option key={x.v} value={x.v}>
                  {x.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rango (cambia la isla)" htmlFor="prueba-rango">
            <Select id="prueba-rango" value={tier} onChange={(e) => setTier(Number(e.target.value))}>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} · {RANK_BY_TIER[n]?.name_es}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Negocio" htmlFor="prueba-negocio" help={tipo !== 'adult' ? 'Sólo cuentas adultas' : undefined}>
            <Select id="prueba-negocio" value={tipo === 'adult' ? negocio : 'ninguno'} disabled={tipo !== 'adult'} onChange={(e) => setNegocio(e.target.value as Negocio)}>
              {NEGOCIOS.map((x) => (
                <option key={x.v} value={x.v}>
                  {x.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button variant="primary" onClick={() => void aplicar()} loading={aplicando} disabled={!email.trim()}>
          Aplicar
        </Button>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-h3 font-bold">Tus cuentas de prueba</h2>
          <button type="button" onClick={() => void cargar()} aria-label="Actualizar" className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-2">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {cuentas === null ? (
          <p className="mt-2 text-small text-muted-foreground">Cargando…</p>
        ) : cuentas.length === 0 ? (
          <p className="mt-2 text-small text-muted-foreground">Todavía ninguna.</p>
        ) : (
          <ul className="mt-2 divide-y divide-hairline">
            {cuentas.map((c) => (
              <li key={c.email} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium">{c.email}</span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {TIPOS.find((x) => x.v === c.tipo)?.label} · {c.tier} {RANK_BY_TIER[c.tier]?.name_es}
                    {c.negocios.length ? ` · ${c.negocios.map((n) => n.nombre).join(', ')}` : ''}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(c.email);
                    setTipo(c.tipo);
                    setTier(c.tier);
                  }}
                  className="text-caption font-semibold text-primary"
                >
                  Editar
                </button>
                <button type="button" onClick={() => void borrar(c)} aria-label={`Borrar ${c.email}`} className="rounded-full p-1.5 text-muted-foreground hover:text-brote-coral">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-display text-h3 font-bold">Ver el mundo en cada rango, sin cuenta</h2>
        <p className="text-small text-muted-foreground">
          Abre la isla tal como la ve alguien de ese rango. No guarda nada.
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={`/offline/mundo-preview?tier=${n}`}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex items-center gap-1 rounded-pill border border-border px-3 py-1.5 text-caption font-medium hover:border-primary/40"
            >
              {n} · {RANK_BY_TIER[n]?.name_es} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
        <p className="text-caption text-muted-foreground">
          Extras en la dirección: <code>&amp;tod=noche</code> (amanecer, dia, atardecer, noche), <code>&amp;q=0</code> a{' '}
          <code>q=3</code> (calidad), <code>&amp;first=1</code> (la primera vez), <code>&amp;tierup=7</code> (la ceremonia de subir de rango).
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="flex items-center gap-2 font-display text-h3 font-bold">
          <Smartphone className="h-4 w-4 text-primary" /> El mundo en teléfonos
        </h2>
        <p className="text-small text-muted-foreground">
          Cuando la isla no puede abrir en un teléfono, queda anotado acá con el modelo y el navegador.
        </p>
        {!errores ? (
          <p className="text-small text-muted-foreground">Sin datos todavía.</p>
        ) : errores.filas.length === 0 ? (
          <p className="text-small text-muted-foreground">Ningún fallo registrado. 🎉</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {errores.filas.slice(0, 20).map((f, i) => (
              <li key={i} className="py-2 text-caption">
                <span className="font-semibold">{f.kind}</span> · {new Date(f.at).toLocaleString('es-AR')}
                {f.usuario ? ` · @${f.usuario}` : ''}
                <span className="block truncate text-muted-foreground">{f.message}</span>
                <span className="block truncate text-muted-foreground">{String(f.info.ua ?? '')}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
