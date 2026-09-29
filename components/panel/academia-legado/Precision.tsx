'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Map as MapIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  Opcion,
  PayloadCompletarFrase,
  PayloadDetectarGreenwashing,
  PayloadEstimacionNumerica,
  PayloadMapaLocalizar,
} from '@/lib/academia/types';
import {
  Enunciado,
  Ficha,
  Ranura,
  claveArray,
  useAnuncio,
  useReportar,
  type Marca,
  type PropsEjercicio,
} from './piezas';
import { cn } from '@/lib/utils/cn';

/**
 * Los cuatro tipos que piden precisión: un número, unas palabras marcadas, unos
 * huecos y un lugar.
 */

// ── Estimación numérica ──────────────────────────────────────────────────────

/**
 * Un `<input type="range">` de verdad, no un slider dibujado a mano.
 *
 * Eso trae gratis las flechas, Home/End, Re Pág/Av Pág y el gesto que ya
 * conoce cualquier lector de pantalla. Lo único que se agrega es
 * `aria-valuetext` en castellano, porque "343" a secas no dice nada y
 * "343 especies" sí.
 *
 * En escala logarítmica el control se mueve sobre el exponente y el valor se
 * traduce al leerlo: sin eso, en un rango de 1 a 100.000 el 90 % del recorrido
 * del pulgar cubriría un solo orden de magnitud.
 */
export function EstimacionNumerica({
  payload,
  onCambio,
  bloqueado,
  correccion,
}: PropsEjercicio<PayloadEstimacionNumerica>) {
  const t = useTranslations('academia');
  const log = payload.escala === 'log' && payload.min > 0;

  const aCrudo = (v: number) => (log ? Math.log10(v) : v);
  const aValor = (c: number) => (log ? Math.pow(10, c) : c);

  const min = aCrudo(payload.min);
  const max = aCrudo(payload.max);
  const paso = log ? (max - min) / 200 : payload.paso;
  const [crudo, setCrudo] = useState((min + max) / 2);

  const valor = useMemo(() => {
    const v = aValor(crudo);
    if (log) {
      // Redondeo a dos cifras significativas: un logarítmico da 3418,7 y ese
      // nivel de falsa precisión no es lo que se está estimando.
      const orden = Math.pow(10, Math.floor(Math.log10(Math.max(1, v))) - 1);
      return Math.round(v / orden) * orden;
    }
    return Math.round(v / payload.paso) * payload.paso;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crudo, log, payload.paso]);

  useReportar(onCambio, { valor });

  const formato = (n: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n);

  // El valor verdadero llega en `clave_cruda` (migración 0080: hasta entonces la
  // solución guardaba `valor` pero no `clave`, y este tipo solo podía decir en
  // qué banda de tolerancia cayó la estimación, nunca cuánto era).
  const objetivo = typeof correccion?.clave_cruda === 'number' ? correccion.clave_cruda : null;
  const banda = correccion
    ? correccion.parcial >= 1
      ? t('bien')
      : correccion.parcial > 0
        ? t('casi')
        : t('mal')
    : null;

  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaRango')} />

      <p className="mb-4 font-display text-display-s font-extrabold leading-none">
        <span className="tnum">{formato(valor)}</span>
        <span className="ml-1.5 text-h3 font-bold text-muted-foreground">{payload.unidad}</span>
      </p>

      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={crudo}
        disabled={bloqueado}
        onChange={(e) => setCrudo(Number(e.target.value))}
        aria-label={payload.enunciado}
        aria-valuetext={`${formato(valor)} ${payload.unidad}`}
        className={cn(
          'h-11 w-full cursor-pointer accent-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          bloqueado && 'cursor-default opacity-70',
        )}
      />

      <div className="tnum flex justify-between text-caption text-muted-foreground">
        <span>{formato(payload.min)}</span>
        <span>{formato(payload.max)}</span>
      </div>

      {banda ? (
        <div className="mt-3">
          <p
            className={cn(
              'text-small font-semibold',
              correccion?.parcial === 1
                ? 'text-brote-green'
                : (correccion?.parcial ?? 0) > 0
                  ? 'text-brote-sun'
                  : 'text-brote-coral',
            )}
          >
            {banda} · {t('tuValor', { valor: formato(valor), unidad: payload.unidad })}
          </p>
          {objetivo !== null && objetivo !== valor ? (
            <p className="mt-1 text-small text-brote-green">
              {t('laRespuesta', { respuesta: `${formato(objetivo)} ${payload.unidad}` })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Detectar greenwashing ────────────────────────────────────────────────────

type Trozo = { tipo: 'texto'; texto: string } | { tipo: 'span'; span: Opcion };

/**
 * Parte el claim en texto y spans marcables.
 *
 * Devuelve `null` si algún span no aparece literalmente en el claim: en ese
 * caso se cae a una lista de chips, que es peor pero sigue siendo correcta.
 * Marcar frases DENTRO de la frase es todo el ejercicio; hacerlo en una lista
 * aparte le saca el contexto que es justamente lo que se está enseñando a leer.
 */
function partirClaim(claim: string, spans: Opcion[]): Trozo[] | null {
  const marcas: { ini: number; fin: number; span: Opcion }[] = [];
  for (const s of spans) {
    const i = claim.indexOf(s.texto);
    if (i < 0 || s.texto.length === 0) return null;
    if (marcas.some((m) => i < m.fin && i + s.texto.length > m.ini)) return null;
    marcas.push({ ini: i, fin: i + s.texto.length, span: s });
  }
  marcas.sort((a, b) => a.ini - b.ini);
  const trozos: Trozo[] = [];
  let cursor = 0;
  for (const m of marcas) {
    if (m.ini > cursor) trozos.push({ tipo: 'texto', texto: claim.slice(cursor, m.ini) });
    trozos.push({ tipo: 'span', span: m.span });
    cursor = m.fin;
  }
  if (cursor < claim.length) trozos.push({ tipo: 'texto', texto: claim.slice(cursor) });
  return trozos;
}

export function DetectarGreenwashing({
  payload,
  onCambio,
  bloqueado,
  correccion,
}: PropsEjercicio<PayloadDetectarGreenwashing>) {
  const t = useTranslations('academia');
  const [marcados, setMarcados] = useState<string[]>([]);
  const trozos = useMemo(() => partirClaim(payload.claim, payload.spans), [payload.claim, payload.spans]);
  const clave = claveArray(correccion);
  const hayCorreccion = correccion !== null;

  useReportar(onCambio, { marcados });

  function alternar(id: string) {
    if (bloqueado) return;
    setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  const marcaDe = (id: string): Marca => {
    if (!hayCorreccion) return 'ninguna';
    const esClave = clave.includes(id);
    if (marcados.includes(id)) return esClave ? 'bien' : 'mal';
    return esClave ? 'era' : 'ninguna';
  };

  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaGreenwashing')} />

      {trozos ? (
        <p className="rounded-card border border-hairline bg-surface-2 p-4 text-body leading-loose">
          {trozos.map((tr, i) =>
            tr.tipo === 'texto' ? (
              <span key={i}>{tr.texto}</span>
            ) : (
              <button
                key={tr.span.id}
                type="button"
                disabled={bloqueado}
                aria-pressed={marcados.includes(tr.span.id)}
                onClick={() => alternar(tr.span.id)}
                className={cn(
                  'mx-0.5 rounded-[6px] px-1 py-0.5 underline decoration-dotted underline-offset-4 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  marcaDe(tr.span.id) === 'ninguna' &&
                    (marcados.includes(tr.span.id)
                      ? 'bg-primary/20 font-semibold decoration-primary'
                      : 'decoration-muted-foreground/60 hover:bg-surface'),
                  marcaDe(tr.span.id) === 'bien' && 'bg-brote-green/20 font-semibold decoration-brote-green',
                  marcaDe(tr.span.id) === 'mal' && 'bg-brote-coral/20 decoration-brote-coral line-through',
                  marcaDe(tr.span.id) === 'era' && 'bg-brote-green/10 decoration-brote-green',
                )}
              >
                {tr.span.texto}
              </button>
            ),
          )}
        </p>
      ) : (
        <>
          <p className="rounded-card border border-hairline bg-surface-2 p-4 text-body leading-relaxed">
            {payload.claim}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {payload.spans.map((s) => (
              <Ficha
                key={s.id}
                seleccionada={marcados.includes(s.id)}
                marca={marcaDe(s.id)}
                disabled={bloqueado}
                onClick={() => alternar(s.id)}
              >
                {s.texto}
              </Ficha>
            ))}
          </div>
        </>
      )}

      <p className="mt-3 text-caption text-muted-foreground">{t('marcados', { n: marcados.length })}</p>
    </div>
  );
}

// ── Completar la frase ───────────────────────────────────────────────────────

export function CompletarFrase({ payload, onCambio, bloqueado, correccion }: PropsEjercicio<PayloadCompletarFrase>) {
  const t = useTranslations('academia');
  const { anunciar, region } = useAnuncio();

  const partes = useMemo(() => payload.frase.split(/\{\{(\d+)\}\}/), [payload.frase]);
  const cantidadHuecos = useMemo(
    () => partes.filter((_, i) => i % 2 === 1).length,
    [partes],
  );

  const [huecos, setHuecos] = useState<(string | null)[]>(() => Array(cantidadHuecos).fill(null));
  const [activo, setActivo] = useState(0);

  const porId = useMemo(() => new Map(payload.banco.map((b) => [b.id, b])), [payload.banco]);
  const clave = claveArray(correccion);
  const hayCorreccion = correccion !== null;
  const usados = new Set(huecos.filter((h): h is string => h !== null));

  useReportar(onCambio, huecos.every((h) => h !== null) ? { huecos: huecos as string[] } : null);

  function poner(id: string) {
    if (bloqueado) return;
    const i = huecos[activo] === null ? activo : huecos.findIndex((h) => h === null);
    const destino = i >= 0 ? i : activo;
    setHuecos((h) => h.map((v, k) => (k === destino ? id : v === id ? null : v)));
    setActivo(Math.min(destino + 1, cantidadHuecos - 1));
    anunciar(t('huecoLleno', { n: destino + 1, palabra: porId.get(id)?.texto ?? '' }));
  }

  function vaciar(i: number) {
    if (bloqueado) return;
    setHuecos((h) => h.map((v, k) => (k === i ? null : v)));
    setActivo(i);
    anunciar(t('huecoVacio', { n: i + 1 }));
  }

  const marcaHueco = (i: number): Marca => {
    if (!hayCorreccion || clave.length === 0) return 'ninguna';
    return clave[i] === huecos[i] ? 'bien' : 'mal';
  };

  let hueco = -1;
  return (
    <div>
      {region}
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaCompletar')} />

      <p className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-card border border-hairline bg-surface-2 p-4 text-body leading-loose">
        {partes.map((p, i) => {
          if (i % 2 === 0) return <span key={i}>{p}</span>;
          hueco += 1;
          const k = hueco;
          const id = huecos[k];
          return (
            <Ranura
              key={i}
              vacia={!id}
              activa={activo === k && !bloqueado}
              marca={marcaHueco(k)}
              disabled={bloqueado && !id}
              onClick={() => (id ? vaciar(k) : setActivo(k))}
              className="min-w-[6rem] px-2 py-1 text-center"
              aria-label={id ? t('huecoLleno', { n: k + 1, palabra: porId.get(id)?.texto ?? '' }) : t('huecoVacio', { n: k + 1 })}
            >
              {id ? porId.get(id)?.texto : '·····'}
            </Ranura>
          );
        })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {payload.banco.map((b) => (
          <Ficha
            key={b.id}
            disabled={bloqueado || usados.has(b.id)}
            onClick={() => poner(b.id)}
            className={cn(usados.has(b.id) && 'opacity-40')}
          >
            {b.texto}
          </Ficha>
        ))}
      </div>

      {hayCorreccion && !correccion.correcto && clave.length > 0 ? (
        <p className="mt-3 text-small text-brote-green">
          {t('laRespuesta', { respuesta: clave.map((c) => porId.get(c)?.texto ?? c).join(' · ') })}
        </p>
      ) : null}
    </div>
  );
}

// ── Localizar en el mapa ─────────────────────────────────────────────────────

const MapaLazy = dynamic(() => import('@/components/plaza/ProjectMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[220px] w-full" />,
});

/**
 * El mapa es el contexto; la respuesta son las regiones con nombre.
 *
 * Podría parecer que lo natural sería tocar el mapa, pero no tenemos los
 * polígonos de las ecorregiones, así que un toque en el mapa no se puede
 * convertir en una región sin inventar. Y una versión que solo se resuelva
 * tocando un punto exacto no se puede completar con teclado ni con lector de
 * pantalla, que es la razón por la que `alternativas` es obligatorio en el
 * esquema (11-exercise-types.md §5).
 *
 * El mapa se carga bajo demanda: Leaflet más sus mosaicos es un montón de red
 * para alguien que va a contestar leyendo los nombres.
 */
export function MapaLocalizar({ payload, onCambio, bloqueado, correccion }: PropsEjercicio<PayloadMapaLocalizar>) {
  const t = useTranslations('academia');
  const [elegida, setElegida] = useState<string | null>(null);
  const [verMapa, setVerMapa] = useState(false);

  useReportar(onCambio, elegida ? { region: elegida } : null);

  const clave = claveArray(correccion);
  const hayCorreccion = correccion !== null;
  const marcaDe = (id: string): Marca => {
    if (!hayCorreccion) return 'ninguna';
    const esClave = clave.includes(id);
    if (id === elegida) return esClave ? 'bien' : 'mal';
    return esClave ? 'era' : 'ninguna';
  };

  return (
    <div>
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaMapa')} />

      {verMapa ? (
        <div className="mb-4">
          <MapaLazy lat={payload.centro[0]} lng={payload.centro[1]} height={220} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setVerMapa(true)}
          className="mb-4 inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-surface-2 px-3 py-1.5 text-small text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
        >
          <MapIcon className="h-4 w-4" aria-hidden />
          {t('verMapa')}
        </button>
      )}

      <div role="radiogroup" aria-label={t('sinMapa')} className="grid gap-2">
        {payload.alternativas.map((a) => (
          <Ficha
            key={a.id}
            role="radio"
            aria-checked={elegida === a.id}
            seleccionada={elegida === a.id}
            marca={marcaDe(a.id)}
            disabled={bloqueado}
            onClick={() => setElegida(a.id)}
            className="w-full"
          >
            {a.texto}
          </Ficha>
        ))}
      </div>
    </div>
  );
}
