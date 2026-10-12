'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ListChecks, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { adminAcciones, adminAccionesReglasGuardar, adminDashboard, type FilaAccionPanel, type PanelAcciones } from '@/lib/api/admin';
import { getDomainName } from '@/lib/domains';
import { CONTEXTO_POR_CLAVE, REGLAS, type ContextoClave, type Pesos, type Reglas } from '@/lib/acciones/reglas';
import { toast } from '@/stores/toast';

/** Qué es cada regla, en palabras del dueño (docs/ACCIONES.md §5). */
const CAMPOS: { k: keyof Omit<Reglas, 'pesos'>; label: string; ayuda: string }[] = [
  { k: 'tamano', label: 'Acciones por día', ayuda: 'Cuántas trae el set de cada persona.' },
  { k: 'rapidas_min', label: 'Rápidas mínimas', ayuda: 'Cuántas, como mínimo, se hacen en pocos minutos.' },
  { k: 'rapida_minutos', label: 'Minutos de una rápida', ayuda: 'Hasta cuántos minutos cuenta como rápida.' },
  { k: 'larga_minutos', label: 'Minutos de una larga', ayuda: 'Desde cuántos minutos cuenta como larga.' },
  { k: 'max_largas', label: 'Largas máximas', ayuda: 'Cuántas largas puede tener un día.' },
  { k: 'max_por_dominio', label: 'Máximo por tema', ayuda: 'Cuántas del mismo tema en un día (se relaja si no alcanza).' },
  { k: 'max_temporada', label: 'Máximo de temporada', ayuda: 'Para que la estación no se coma la variedad.' },
  { k: 'ventana_dias', label: 'Días sin repetir', ayuda: 'Una acción ofrecida no vuelve antes de esto (se relaja si no alcanza).' },
  { k: 'cambios_por_dia', label: 'Cambios por día', ayuda: 'Cuántas acciones puede cambiar cada persona por día.' },
  { k: 'ya_lo_hago_dias', label: 'Días de "ya lo hago"', ayuda: 'Cuánto tiempo se esconde una acción que la persona ya hace.' },
  { k: 'hoy_no_dias', label: 'Días de "hoy no"', ayuda: 'Cuánto pesa en contra un "hoy no puedo".' },
  { k: 'hecha_reciente_dias', label: 'Días de "hecha hace poco"', ayuda: 'No repetir lo que hizo hace tan poco.' },
];
const PESOS: { k: keyof Pesos; label: string }[] = [
  { k: 'interes', label: 'Tema de sus intereses' },
  { k: 'afinidad', label: 'Tema que más hace' },
  { k: 'nueva', label: 'Nunca la hizo' },
  { k: 'temporada', label: 'De esta estación' },
  { k: 'efemeride', label: 'Efeméride de la semana' },
  { k: 'contexto', label: 'Pide algo que tiene' },
  { k: 'impacto_medio', label: 'Impacto medio' },
  { k: 'impacto_alto', label: 'Impacto alto' },
  { k: 'ofrecida', label: 'Ya ofrecida (en contra)' },
  { k: 'hoy_no', label: '"Hoy no" reciente (en contra)' },
  { k: 'hecha_reciente', label: 'Hecha hace poco (en contra)' },
  { k: 'azar', label: 'Azar (0 a este número)' },
];

/**
 * `/panel/acciones` — cómo funcionan las acciones con la gente real, y las
 * reglas del día a mano (sin deploy). Es la herramienta para equilibrar: lo
 * que nadie hace, lo que todos cambian y por qué, lo que falta saber.
 */
export default function PanelAccionesPage() {
  const { pass, setPass } = usePanelPass();
  const [datos, setDatos] = useState<PanelAcciones | null>(null);
  const [borrador, setBorrador] = useState<Reglas>(REGLAS);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!pass) return;
    const r = await adminAcciones(pass);
    if (!r.ok) {
      toast.error('No se pudo', r.error);
      if (r.error === 'Contraseña incorrecta') setPass('');
      return;
    }
    setDatos(r);
    setBorrador(r.reglas);
  }, [pass, setPass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!pass) {
    return <CandadoPanel verificar={async (p) => (await adminDashboard(p)).ok} />;
  }

  async function guardar(reglas: Record<string, unknown>) {
    setGuardando(true);
    const r = await adminAccionesReglasGuardar(pass, reglas);
    setGuardando(false);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success('Reglas guardadas', 'Se aplican a los días que se armen desde ahora.');
    setBorrador(r.reglas);
    void cargar();
  }

  /** Sólo lo que difiere de los valores por omisión. */
  function diferencias(b: Reglas): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const c of CAMPOS) if (b[c.k] !== REGLAS[c.k]) out[c.k] = b[c.k];
    const pesos: Record<string, number> = {};
    for (const p of PESOS) if (b.pesos[p.k] !== REGLAS.pesos[p.k]) pesos[p.k] = b.pesos[p.k];
    if (Object.keys(pesos).length) out.pesos = pesos;
    return out;
  }

  const d = datos;
  return (
    <div className="space-y-6 pb-10">
      <Link href="/panel" className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Panel
      </Link>
      <header>
        <span className="eyebrow text-primary">Acciones</span>
        <h1 className="mt-1 flex items-center gap-2 font-display text-h1 font-bold">
          <ListChecks className="h-6 w-6 text-primary" /> Cómo funcionan las acciones
        </h1>
        <p className="mt-1 text-small text-muted-foreground">
          El catálogo, lo que la gente cambia y por qué, lo que se ofrece y no se hace, y las reglas del día.
        </p>
      </header>

      {!d ? (
        <Card className="p-4 text-small text-muted-foreground">Cargando…</Card>
      ) : (
        <>
          <section>
            <h2 className="mb-2 font-display text-h3 font-bold">El catálogo</h2>
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-small">
                <thead className="text-caption text-muted-foreground">
                  <tr className="border-b border-hairline">
                    <th className="p-2.5 text-left font-medium">Tema</th>
                    <th className="p-2.5 text-right font-medium">Del día</th>
                    <th className="p-2.5 text-right font-medium">Catálogo</th>
                    <th className="p-2.5 text-right font-medium">Chicos</th>
                    <th className="p-2.5 text-right font-medium">Piden algo</th>
                    <th className="p-2.5 text-right font-medium">Temporada</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {d.catalogo.map((c) => (
                    <tr key={c.dominio} className="border-b border-hairline last:border-b-0">
                      <td className="p-2.5">{getDomainName(c.dominio)}</td>
                      <td className="p-2.5 text-right">{c.dia}</td>
                      <td className="p-2.5 text-right">{c.catalogo}</td>
                      <td className="p-2.5 text-right">{c.chicos}</td>
                      <td className="p-2.5 text-right">{c.con_contexto}</td>
                      <td className="p-2.5 text-right">{c.de_temporada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <p className="mt-1.5 text-caption text-muted-foreground">
              El contenido se edita en <code>scripts/acciones/catalogo/</code> y se publica con{' '}
              <code>node scripts/acciones/generar.mjs</code> (genera la migración).
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-h3 font-bold">Últimos 30 días</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Dato n={d.ofrecidas.sets} label="Días armados" />
              <Dato n={d.ofrecidas.cambios} label="Acciones cambiadas" />
              <Dato n={d.contexto.respondieron} label={`De ${d.contexto.personas} contaron su casa`} />
              <Dato n={d.caminos.reduce((s, c) => s + c.terminados, 0)} label="Caminos terminados" />
            </div>
          </section>

          <Lista
            titulo="Las más cambiadas (60 días)"
            vacio="Nadie cambió acciones todavía."
            filas={d.cambiadas}
            detalle={(f) =>
              `${f.total} · hoy no ${f.hoy_no} · no aplica ${f.no_aplica} · ya lo hace ${f.ya_lo_hago} · no le interesa ${f.no_me_gusta}`
            }
            ayuda="Mucho 'no aplica' = le falta un requisito de contexto. Mucho 'no le interesa' = revisar el texto o sacarla."
          />
          <Lista
            titulo="Se ofrecen y casi no se hacen"
            vacio="Todavía no hay datos (cada una tiene que haberse ofrecido 3 veces)."
            filas={d.ofrecidas.menos_hechas}
            detalle={(f) => `${Math.round((f.tasa ?? 0) * 100)}% · ${f.hecha} de ${f.ofrecida}`}
            ayuda="Candidatas a reescribir, a pedir contexto o a bajar de esfuerzo."
          />
          <Lista
            titulo="Las que más se hacen"
            vacio="Todavía no hay datos."
            filas={d.ofrecidas.mas_hechas}
            detalle={(f) => `${Math.round((f.tasa ?? 0) * 100)}% · ${f.hecha} de ${f.ofrecida}`}
            ayuda="Buenas candidatas para la rutina (si no lo son ya)."
          />

          <section>
            <h2 className="mb-2 font-display text-h3 font-bold">Lo que dice la gente de su casa</h2>
            <Card className="flex flex-wrap gap-1.5 p-3.5">
              {Object.keys(d.contexto.claves).length === 0 ? (
                <span className="text-small text-muted-foreground">Nadie lo contestó todavía.</span>
              ) : (
                Object.entries(d.contexto.claves)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, n]) => (
                    <span key={k} className="rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-caption tnum">
                      {CONTEXTO_POR_CLAVE[k as ContextoClave]?.label ?? k} · {n}
                    </span>
                  ))
              )}
            </Card>
          </section>

          <section>
            <h2 className="mb-1 font-display text-h3 font-bold">Reglas del día</h2>
            <p className="mb-2 text-small text-muted-foreground">
              Se aplican a los días que se arman desde que guardás (el de hoy de cada persona no cambia).
            </p>
            <Card className="space-y-3 p-4">
              {CAMPOS.map((c) => (
                <Numero
                  key={c.k}
                  label={c.label}
                  ayuda={c.ayuda}
                  valor={borrador[c.k]}
                  porOmision={REGLAS[c.k]}
                  onChange={(n) => setBorrador({ ...borrador, [c.k]: n })}
                />
              ))}
              <h3 className="pt-2 text-small font-semibold">Pesos del puntaje</h3>
              {PESOS.map((p) => (
                <Numero
                  key={p.k}
                  label={p.label}
                  valor={borrador.pesos[p.k]}
                  porOmision={REGLAS.pesos[p.k]}
                  onChange={(n) => setBorrador({ ...borrador, pesos: { ...borrador.pesos, [p.k]: n } })}
                />
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" disabled={guardando} onClick={() => guardar({})}>
                  <RotateCcw className="h-4 w-4" /> Volver a los de fábrica
                </Button>
                <Button variant="primary" className="flex-[2]" loading={guardando} onClick={() => guardar(diferencias(borrador))}>
                  Guardar reglas
                </Button>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function Dato({ n, label }: { n: number; label: string }) {
  return (
    <Card className="p-3.5">
      <span className="block font-display text-h2 font-bold tnum">{n}</span>
      <span className="block text-caption text-muted-foreground">{label}</span>
    </Card>
  );
}

function Lista({
  titulo,
  ayuda,
  vacio,
  filas,
  detalle,
}: {
  titulo: string;
  ayuda: string;
  vacio: string;
  filas: FilaAccionPanel[];
  detalle: (f: FilaAccionPanel) => string;
}) {
  return (
    <section>
      <h2 className="mb-1 font-display text-h3 font-bold">{titulo}</h2>
      <p className="mb-2 text-caption text-muted-foreground">{ayuda}</p>
      <Card className="divide-y divide-hairline overflow-hidden p-0">
        {filas.length === 0 ? (
          <p className="p-3.5 text-small text-muted-foreground">{vacio}</p>
        ) : (
          filas.map((f) => (
            <Link key={f.slug} href={`/acciones/${f.slug}`} className="block p-3 hover:bg-surface-2">
              <span className="block text-small font-medium">{f.titulo}</span>
              <span className="block text-caption text-muted-foreground tnum">{detalle(f)}</span>
            </Link>
          ))
        )}
      </Card>
    </section>
  );
}

function Numero({
  label,
  ayuda,
  valor,
  porOmision,
  onChange,
}: {
  label: string;
  ayuda?: string;
  valor: number;
  porOmision: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="min-w-0 flex-1">
        <span className="block text-small font-medium">{label}</span>
        {ayuda && <span className="block text-caption leading-snug text-muted-foreground">{ayuda}</span>}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-20 rounded-button border border-border bg-surface px-2 text-right text-small tnum"
      />
      <span className="w-14 text-right text-caption text-muted-foreground tnum" title="Valor de fábrica">
        {valor !== porOmision ? `(${porOmision})` : ''}
      </span>
    </label>
  );
}
