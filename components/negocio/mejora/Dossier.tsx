'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress';
import { guardarBloqueDossier, generarObjetivos } from '@/lib/negocio/mejora-acciones';
import {
  BLOQUES,
  type BloqueClave,
  type BooleanODesconocido,
  type Dossier,
  type NumeroODesconocido,
} from '@/lib/mejora/tipos';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * El dossier: ocho bloques, uno por pantalla (fase 2 §4).
 *
 * "No sé" es una respuesta válida y explícita en cada campo numérico, no un
 * campo vacío: dispara objetivos de MEDICIÓN en lugar de reducción. Por eso
 * cada número tiene su botón, y por eso el generador lo distingue de "todavía
 * no contestó".
 *
 * Se guarda bloque por bloque. Al terminar OFRECE replanificar; no lo hace
 * solo, porque cambiar el dossier no significa querer objetivos nuevos.
 */
export function DossierNegocio({
  negocioId,
  inicial,
  completitudInicial,
  puedeEditar,
  bloqueInicial = 0,
}: {
  negocioId: string;
  inicial: Dossier;
  completitudInicial: number;
  puedeEditar: boolean;
  /** Con qué bloque abrir. El dossier se edita siempre, no solo de corrido. */
  bloqueInicial?: number;
}) {
  const t = useTranslations('negocio.mejora.dossier');
  const te = useTranslations('negocio.mejora.errores');
  const router = useRouter();
  const [i, setI] = useState(Math.min(Math.max(bloqueInicial, 0), BLOQUES.length - 1));
  const [d, setD] = useState<Dossier>(inicial);
  const [completitud, setCompletitud] = useState(completitudInicial);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [cambiado, setCambiado] = useState(false);
  const [ofrecer, setOfrecer] = useState(false);
  const [generando, setGenerando] = useState(false);

  const bloque = BLOQUES[i] as BloqueClave;
  const set = <K extends keyof Dossier>(k: K, v: Dossier[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    setCambiado(true);
  };

  async function guardar(): Promise<boolean> {
    setGuardando(true);
    // Lo que nadie contestó no se guarda. La completitud del dossier cuenta
    // CLAVES presentes, así que mandar `null` por cada campo en blanco daría un
    // dossier "completo" que no dice nada — y objetivos armados sobre eso.
    const datos = bloque === 'ya_hecho' ? { texto: d.ya_hecho } : soloContestado(d[bloque]);
    const r = await guardarBloqueDossier(negocioId, bloque, datos);
    setGuardando(false);
    if (!r.ok) {
      useToastStore.getState().push({
        variant: 'error',
        title: te.has(r.error) ? te(r.error) : te('sin_objetivos'),
      });
      return false;
    }
    setCompletitud(r.completitud);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2400);
    return true;
  }

  async function avanzar(paso: number) {
    if (puedeEditar && !(await guardar())) return;
    const siguiente = i + paso;
    if (siguiente >= BLOQUES.length) {
      if (cambiado && puedeEditar) setOfrecer(true);
      else router.push('/negocio/mejora');
      return;
    }
    setI(Math.max(0, siguiente));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function replanificar() {
    setGenerando(true);
    const r = await generarObjetivos(negocioId);
    setGenerando(false);
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: te.has(r.error) ? te(r.error) : te('sin_objetivos') });
      return;
    }
    router.push('/negocio/mejora');
    router.refresh();
  }

  if (ofrecer) {
    return (
      <div className="max-w-xl pt-4">
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1.5 font-display text-h1 font-bold">{t('replanificar.titulo')}</h1>
        <p className="mt-2 text-body leading-relaxed text-muted-foreground">{t('replanificar.cuerpo')}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button className="rounded-pill" loading={generando} onClick={() => void replanificar()}>
            {t('replanificar.boton')}
          </Button>
          <Button variant="secondary" onClick={() => router.push('/negocio/mejora')}>
            {t('replanificar.ahoraNo')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <header className="mb-5">
        <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1 font-display text-h1 font-bold sm:text-display-l">{t('titulo')}</h1>
        <p className="mt-2 text-small leading-relaxed text-muted-foreground">{t('intro')}</p>
        {!puedeEditar && <p className="mt-2 text-small text-brote-sun">{t('soloLectura')}</p>}
      </header>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow text-muted-foreground tnum">{t('bloque', { n: i + 1 })}</span>
          <span className="flex items-center gap-2">
            <span
              aria-live="polite"
              className={cn(
                'inline-flex items-center gap-1 text-caption text-muted-foreground transition-opacity duration-500',
                guardado ? 'opacity-100' : 'opacity-0',
              )}
            >
              <Check className="h-3.5 w-3.5 text-primary" />
              {t('guardado')}
            </span>
            <span className="text-caption text-muted-foreground tnum">{t('completitud', { n: completitud })}</span>
          </span>
        </div>
        {/* 0..1, nunca un porcentaje (07 §2.1, trampa 3). */}
        <ProgressBar value={(i + 1) / BLOQUES.length} height={4} />
      </div>

      <div key={bloque} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 motion-safe:duration-300">
        <h2 className="font-display text-h2 font-bold">{t(`${bloque}.titulo`)}</h2>
        <p className="mb-4 mt-1 text-small leading-relaxed text-muted-foreground">{t(`${bloque}.subtitulo`)}</p>

        {/* Un `fieldset` deshabilitado apaga de una todos los campos y botones
            del bloque: el rol editor puede leer el dossier pero no tocarlo, y
            la base opina lo mismo (`brote_can_write(..., 'admin')`). */}
        <fieldset disabled={!puedeEditar} className="space-y-4">
          {bloque === 'operacion' && (
            <>
              <CampoTextarea
                id="que_produce"
                etiqueta={t('operacion.que_produce')}
                ph={t('operacion.que_producePh')}
                valor={d.operacion.que_produce}
                onChange={(v) => set('operacion', { ...d.operacion, que_produce: v })}
              />
              <CampoTexto
                id="volumen"
                etiqueta={t('operacion.volumen')}
                ph={t('operacion.volumenPh')}
                valor={d.operacion.volumen}
                onChange={(v) => set('operacion', { ...d.operacion, volumen: v })}
              />
              <CampoTexto
                id="estacionalidad"
                etiqueta={t('operacion.estacionalidad')}
                ph={t('operacion.estacionalidadPh')}
                valor={d.operacion.estacionalidad}
                onChange={(v) => set('operacion', { ...d.operacion, estacionalidad: v })}
              />
            </>
          )}

          {bloque === 'energia' && (
            <>
              <CampoSelect
                id="suministro"
                etiqueta={t('energia.suministro')}
                valor={d.energia.suministro ?? ''}
                opciones={[
                  { v: 'electrico', l: t('energia.electrico') },
                  { v: 'electrico_gas', l: t('energia.electrico_gas') },
                  { v: 'otro', l: t('energia.otro') },
                  { v: 'no_se', l: t('noSe') },
                ]}
                onChange={(v) => set('energia', { ...d.energia, suministro: v as Dossier['energia']['suministro'] })}
              />
              <CampoSiNo
                etiqueta={t('energia.tiene_factura')}
                valor={d.energia.tiene_factura}
                onChange={(v) => set('energia', { ...d.energia, tiene_factura: v })}
              />
              <CampoNumero
                id="consumo_mensual"
                etiqueta={t('energia.consumo_mensual')}
                valor={d.energia.consumo_mensual}
                onChange={(v) => set('energia', { ...d.energia, consumo_mensual: v })}
              />
              <CampoTexto
                id="equipos"
                etiqueta={t('energia.equipos')}
                ph={t('energia.equiposPh')}
                valor={d.energia.equipos}
                onChange={(v) => set('energia', { ...d.energia, equipos: v })}
              />
            </>
          )}

          {bloque === 'residuos' && (
            <>
              <CampoTextarea
                id="que_tiran"
                etiqueta={t('residuos.que_tiran')}
                ph={t('residuos.que_tiranPh')}
                valor={d.residuos.que_tiran}
                onChange={(v) => set('residuos', { ...d.residuos, que_tiran: v })}
              />
              <CampoNumero
                id="bolsas_semana"
                etiqueta={t('residuos.bolsas_semana')}
                valor={d.residuos.bolsas_semana}
                onChange={(v) => set('residuos', { ...d.residuos, bolsas_semana: v })}
              />
              <CampoSiNo
                etiqueta={t('residuos.separa')}
                valor={d.residuos.separa}
                onChange={(v) => set('residuos', { ...d.residuos, separa: v })}
              />
              <CampoSiNo
                etiqueta={t('residuos.retiro_reciclables')}
                valor={d.residuos.retiro_reciclables}
                onChange={(v) => set('residuos', { ...d.residuos, retiro_reciclables: v })}
              />
            </>
          )}

          {bloque === 'agua' && (
            <>
              <CampoSiNo
                etiqueta={t('agua.es_relevante')}
                valor={d.agua.es_relevante}
                onChange={(v) => set('agua', { ...d.agua, es_relevante: v })}
              />
              <CampoSelect
                id="medicion"
                etiqueta={t('agua.medicion')}
                valor={d.agua.medicion ?? ''}
                opciones={[
                  { v: 'medidor', l: t('agua.medidor') },
                  { v: 'canilla_libre', l: t('agua.canilla_libre') },
                  { v: 'no_se', l: t('noSe') },
                ]}
                onChange={(v) => set('agua', { ...d.agua, medicion: v as Dossier['agua']['medicion'] })}
              />
              <CampoNumero
                id="agua_consumo"
                etiqueta={t('agua.consumo_mensual')}
                valor={d.agua.consumo_mensual}
                onChange={(v) => set('agua', { ...d.agua, consumo_mensual: v })}
              />
            </>
          )}

          {bloque === 'insumos' && (
            <>
              <CampoTextarea
                id="principales"
                etiqueta={t('insumos.principales')}
                ph={t('insumos.principalesPh')}
                valor={d.insumos.principales}
                onChange={(v) => set('insumos', { ...d.insumos, principales: v })}
              />
              <CampoNumero
                id="proveedores_clave"
                etiqueta={t('insumos.proveedores_clave')}
                valor={d.insumos.proveedores_clave}
                onChange={(v) => set('insumos', { ...d.insumos, proveedores_clave: v })}
              />
              <CampoSiNo
                etiqueta={t('insumos.puede_cambiar_proveedores')}
                valor={d.insumos.puede_cambiar_proveedores}
                onChange={(v) => set('insumos', { ...d.insumos, puede_cambiar_proveedores: v })}
              />
            </>
          )}

          {bloque === 'logistica' && (
            <>
              <CampoTextarea
                id="como_llega"
                etiqueta={t('logistica.como_llega')}
                ph={t('logistica.como_llegaPh')}
                valor={d.logistica.como_llega}
                onChange={(v) => set('logistica', { ...d.logistica, como_llega: v })}
              />
              <CampoSelect
                id="flota"
                etiqueta={t('logistica.flota')}
                valor={d.logistica.flota ?? ''}
                opciones={[
                  { v: 'propia', l: t('logistica.propia') },
                  { v: 'tercerizada', l: t('logistica.tercerizada') },
                  { v: 'retiran', l: t('logistica.retiran') },
                  { v: 'no_aplica', l: t('logistica.no_aplica') },
                  { v: 'no_se', l: t('noSe') },
                ]}
                onChange={(v) => set('logistica', { ...d.logistica, flota: v as Dossier['logistica']['flota'] })}
              />
              <CampoNumero
                id="viajes_mes"
                etiqueta={t('logistica.viajes_mes')}
                valor={d.logistica.viajes_mes}
                onChange={(v) => set('logistica', { ...d.logistica, viajes_mes: v })}
              />
            </>
          )}

          {bloque === 'ya_hecho' && (
            <BloqueYaHecho valor={d.ya_hecho} onChange={(v) => set('ya_hecho', v)} />
          )}

          {bloque === 'restricciones' && (
            <>
              <CampoSelect
                id="presupuesto"
                etiqueta={t('restricciones.presupuesto')}
                valor={d.restricciones.presupuesto}
                opciones={[
                  { v: 'ninguno', l: t('restricciones.ninguno') },
                  { v: 'hasta_x', l: t('restricciones.hasta_x') },
                  { v: 'caso_por_caso', l: t('restricciones.caso_por_caso') },
                ]}
                onChange={(v) =>
                  set('restricciones', { ...d.restricciones, presupuesto: v as Dossier['restricciones']['presupuesto'] })
                }
              />
              {d.restricciones.presupuesto === 'hasta_x' && (
                <CampoNumero
                  id="presupuesto_monto"
                  etiqueta={t('restricciones.presupuesto_monto')}
                  valor={d.restricciones.presupuesto_monto}
                  onChange={(v) => set('restricciones', { ...d.restricciones, presupuesto_monto: v })}
                />
              )}
              <CampoTexto
                id="horas"
                etiqueta={t('restricciones.horas_mes_disponibles')}
                ayuda={t('restricciones.horasAyuda')}
                tipo="number"
                valor={String(d.restricciones.horas_mes_disponibles ?? 6)}
                onChange={(v) =>
                  set('restricciones', {
                    ...d.restricciones,
                    horas_mes_disponibles: Math.max(1, Math.min(40, Number(v) || 6)),
                  })
                }
              />
              <CampoSelect
                id="local"
                etiqueta={t('restricciones.local')}
                ayuda={t('restricciones.localAyuda')}
                valor={d.restricciones.local ?? ''}
                opciones={[
                  { v: 'alquilado', l: t('restricciones.alquilado') },
                  { v: 'propio', l: t('restricciones.propio') },
                  { v: 'no_aplica', l: t('logistica.no_aplica') },
                ]}
                onChange={(v) => set('restricciones', { ...d.restricciones, local: v as Dossier['restricciones']['local'] })}
              />
            </>
          )}
        </fieldset>
      </div>

      <div className="mt-7 flex items-center justify-between gap-3 border-t border-hairline pt-5">
        {i > 0 ? (
          <Button variant="ghost" size="sm" disabled={guardando} onClick={() => void avanzar(-1)}>
            <ArrowLeft className="h-4 w-4" />
            {t('atras')}
          </Button>
        ) : (
          <span />
        )}
        <Button className="rounded-pill" loading={guardando} onClick={() => void avanzar(1)}>
          {i === BLOQUES.length - 1 ? t('terminar') : t('siguiente')}
        </Button>
      </div>
    </div>
  );
}

/** Un bloque sin los campos en blanco: `null` y `''` no son respuestas. */
function soloContestado(bloque: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(bloque).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );
}

// ── Campos ──────────────────────────────────────────────────────────────────

function Etiqueta({ id, children, ayuda }: { id: string; children: ReactNode; ayuda?: string }) {
  return (
    <>
      <label htmlFor={id} className="mb-1.5 block text-small font-medium text-foreground">
        {children}
      </label>
      {ayuda && <p className="-mt-1 mb-1.5 text-caption leading-relaxed text-muted-foreground">{ayuda}</p>}
    </>
  );
}

function CampoTexto({
  id,
  etiqueta,
  ph,
  ayuda,
  valor,
  tipo = 'text',
  onChange,
}: {
  id: string;
  etiqueta: string;
  ph?: string;
  ayuda?: string;
  valor: string;
  tipo?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Etiqueta id={id} ayuda={ayuda}>
        {etiqueta}
      </Etiqueta>
      <Input id={id} type={tipo} value={valor} placeholder={ph} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CampoTextarea({
  id,
  etiqueta,
  ph,
  valor,
  onChange,
}: {
  id: string;
  etiqueta: string;
  ph?: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Etiqueta id={id}>{etiqueta}</Etiqueta>
      <Textarea id={id} value={valor} placeholder={ph} className="min-h-20" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CampoSelect({
  id,
  etiqueta,
  ayuda,
  valor,
  opciones,
  onChange,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  valor: string;
  opciones: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  const t = useTranslations('negocio.mejora.dossier');
  return (
    <div>
      <Etiqueta id={id} ayuda={ayuda}>
        {etiqueta}
      </Etiqueta>
      <Select id={id} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          {t('elegir')}
        </option>
        {opciones.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </Select>
    </div>
  );
}

/**
 * Sí / No / No sé.
 *
 * `null` es "todavía no contestó" y NO deja ningún botón marcado; "No sé" es
 * `'no_se'`, una respuesta explícita que sí se guarda. Si fueran lo mismo, un
 * formulario en blanco se vería contestado y el dossier contaría completitud
 * que nadie declaró.
 */
function CampoSiNo({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: BooleanODesconocido;
  onChange: (v: BooleanODesconocido) => void;
}) {
  const t = useTranslations('negocio.mejora.dossier');
  const opciones: { v: Exclude<BooleanODesconocido, null>; l: string }[] = [
    { v: true, l: t('si') },
    { v: false, l: t('no') },
    { v: 'no_se', l: t('noSe') },
  ];
  return (
    <fieldset>
      <legend className="mb-1.5 text-small font-medium text-foreground">{etiqueta}</legend>
      <div className="flex gap-1.5">
        {opciones.map((o) => {
          const activo = valor === o.v;
          return (
            <button
              key={String(o.v)}
              type="button"
              aria-pressed={activo}
              onClick={() => onChange(o.v)}
              className={cn(
                'press rounded-pill border px-3.5 py-1.5 text-small font-medium transition-colors duration-150',
                activo
                  ? 'border-primary bg-primary/12 text-primary'
                  : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
              )}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Un número, o "No sé" — que es información y dispara objetivos de medición. */
function CampoNumero({
  id,
  etiqueta,
  ayuda,
  valor,
  onChange,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  valor: NumeroODesconocido;
  onChange: (v: NumeroODesconocido) => void;
}) {
  const t = useTranslations('negocio.mejora.dossier');
  const noSe = valor === 'no_se';
  return (
    <div>
      <Etiqueta id={id} ayuda={ayuda}>
        {etiqueta}
      </Etiqueta>
      <div className="flex gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          className="flex-1 tnum"
          value={typeof valor === 'number' ? String(valor) : ''}
          disabled={noSe}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
        <button
          type="button"
          aria-pressed={noSe}
          onClick={() => onChange(noSe ? null : 'no_se')}
          className={cn(
            'press shrink-0 rounded-pill border px-3.5 text-small font-medium transition-colors duration-150',
            noSe
              ? 'border-primary bg-primary/12 text-primary'
              : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground',
          )}
        >
          {t('noSe')}
        </button>
      </div>
    </div>
  );
}

/**
 * El bloque más importante del dossier: proponerle a alguien algo que ya hizo
 * es la forma más rápida de perder credibilidad (fase 2 §4.2).
 */
function BloqueYaHecho({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const t = useTranslations('negocio.mejora.dossier.ya_hecho');
  const chips = useMemo(() => ['energia', 'residuos', 'envases', 'proveedores'] as const, []);

  return (
    <div>
      <p className="mb-2 text-small leading-relaxed text-muted-foreground">{t('ayuda')}</p>
      <Textarea
        id="ya_hecho"
        aria-label={t('titulo')}
        value={valor}
        placeholder={t('placeholder')}
        className="min-h-36"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-3">
        <span className="eyebrow text-muted-foreground">{t('sugerencias')}</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(`${valor.trimEnd()}${valor.trim() ? '\n' : ''}${t(`chips.${c}`)}: `)}
              className="press inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 px-3 py-1.5 text-caption font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              {t(`chips.${c}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
