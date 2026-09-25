'use client';

import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flag } from 'lucide-react';
import type { PayloadCompletar, PayloadDetectar, PayloadEstimar, PayloadNumero } from '@/lib/academia/modelo';
import { Adjuntos, Enunciado, Ficha, claveArray, useAnuncio, useReportar, type Marca, type PropsPaso } from './piezas';
import { cn } from '@/lib/utils/cn';

const fmt = (n: number, dec = 2) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: dec }).format(n);

// ── Completar ────────────────────────────────────────────────────────────────

/**
 * Completar una frase con palabras de un banco. Se toca una palabra y va al
 * primer hueco libre (o al hueco elegido); se toca un hueco lleno y se vacía.
 * La frase se lee entera, con los huecos adentro: completar fuera de contexto
 * sería otro ejercicio.
 */
export function Completar({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadCompletar>) {
  const t = useTranslations('arbol');
  const { anunciar, region } = useAnuncio();
  const partes = useMemo(() => payload.texto.split(/(\{\{\d+\}\})/g), [payload.texto]);
  const nHuecos = partes.filter((p) => /^\{\{\d+\}\}$/.test(p)).length;
  const [huecos, setHuecos] = useState<(string | null)[]>(() => Array(nHuecos).fill(null));
  const [activo, setActivo] = useState<number | null>(null);
  const porId = useMemo(() => new Map(payload.banco.map((b) => [b.id, b])), [payload.banco]);
  const usadas = new Set(huecos.filter(Boolean) as string[]);
  const clave = claveArray(correccion);

  useReportar(onCambio, huecos.every(Boolean) ? { huecos: huecos as string[] } : null);

  function poner(id: string) {
    if (bloqueado) return;
    const destino = activo ?? huecos.findIndex((h) => h === null);
    if (destino < 0) return;
    setHuecos((h) => h.map((x, i) => (i === destino ? id : x === id ? null : x)));
    setActivo(null);
    anunciar(t('colocado', { cosa: porId.get(id)?.texto ?? '', n: destino + 1 }));
  }

  function tocarHueco(i: number) {
    if (bloqueado) return;
    if (huecos[i]) {
      anunciar(t('quitado', { cosa: porId.get(huecos[i]!)?.texto ?? '' }));
      setHuecos((h) => h.map((x, k) => (k === i ? null : x)));
      setActivo(i);
      return;
    }
    setActivo((a) => (a === i ? null : i));
  }

  const marca = (i: number): Marca => {
    if (!correccion || !clave.length) return 'ninguna';
    return clave[i] === huecos[i] ? 'bien' : 'mal';
  };

  return (
    <div>
      {region}
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaCompletar')} />
      <p className="rounded-card border border-hairline bg-surface-2 p-4 text-h3 leading-[2.4]">
        {partes.map((p, k) => {
          const m = p.match(/^\{\{(\d+)\}\}$/);
          if (!m) return <span key={k}>{p}</span>;
          const i = Number(m[1]);
          const id = huecos[i];
          const mk = marca(i);
          return (
            <button
              key={k}
              type="button"
              disabled={bloqueado}
              onClick={() => tocarHueco(i)}
              aria-label={id ? `${t('huecoN', { n: i + 1 })}: ${porId.get(id)?.texto}. ${t('quitar')}` : `${t('huecoN', { n: i + 1 })}. ${t('vacio')}`}
              className={cn(
                'mx-0.5 inline-flex min-h-10 min-w-[5.5rem] items-center justify-center rounded-button border-2 px-2.5 align-middle text-small font-semibold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                !id && 'border-dashed border-border text-muted-foreground',
                id && mk === 'ninguna' && 'border-border bg-surface',
                activo === i && 'border-solid',
                mk === 'bien' && 'border-brote-green bg-brote-green/15',
                mk === 'mal' && 'border-brote-coral bg-brote-coral/10',
                !bloqueado && 'active:scale-[0.97]',
              )}
              style={activo === i && !bloqueado ? { borderColor: color } : undefined}
            >
              {id ? porId.get(id)?.texto : `${i + 1}`}
            </button>
          );
        })}
      </p>

      {!bloqueado ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {payload.banco.map((b) => (
            <Ficha key={b.id} disabled={usadas.has(b.id)} onClick={() => poner(b.id)} className={cn(usadas.has(b.id) && 'opacity-35')}>
              {b.texto}
            </Ficha>
          ))}
        </div>
      ) : null}

      {correccion && !correccion.correcto && clave.length ? (
        <p className="mt-3 text-small text-brote-green">
          {t('laRespuesta', { respuesta: clave.map((id) => porId.get(id)?.texto ?? '').join(' · ') })}
        </p>
      ) : null}
    </div>
  );
}

// ── Número ───────────────────────────────────────────────────────────────────

/**
 * Leer un número escrito por una persona de acá. En Argentina "1.500" es mil
 * quinientos y "2,5" es dos y medio, pero en un teclado de teléfono mucha gente
 * escribe "2.5". La regla que evita adivinar mal:
 *   · con coma, la coma es el decimal y los puntos son miles;
 *   · sin coma, si la respuesta es entera el punto es de miles; si lleva
 *     decimales, el punto es el decimal.
 * Y debajo del campo se muestra cómo se leyó, para que no haya sorpresas.
 */
export function leerNumero(texto: string, decimales: number): number | null {
  const s = texto.replace(/\s/g, '').replace(/[^\d.,-]/g, '');
  if (!s || s === '-' || s === ',' || s === '.') return null;
  let normal: string;
  if (s.includes(',')) normal = s.replace(/\./g, '').replace(',', '.');
  else if (decimales === 0) normal = s.replace(/\./g, '');
  else {
    const puntos = (s.match(/\./g) ?? []).length;
    normal = puntos > 1 ? s.replace(/\./g, '') : s;
  }
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}

export function Numero({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadNumero>) {
  const t = useTranslations('arbol');
  const id = useId();
  const [texto, setTexto] = useState('');
  const valor = leerNumero(texto, payload.decimales);
  useReportar(onCambio, valor !== null ? { valor } : null);

  const verdad = correccion?.clave_cruda && typeof correccion.clave_cruda.valor === 'number' ? correccion.clave_cruda.valor : null;

  return (
    <div>
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? null} />
      <label htmlFor={id} className="eyebrow text-muted-foreground">
        {t('tuRespuesta')}
      </label>
      <div
        className={cn(
          'mt-1.5 flex items-center gap-3 rounded-card border-2 bg-surface px-4 py-2 transition-colors',
          !correccion && 'focus-within:border-primary',
          correccion?.correcto && 'border-brote-green bg-brote-green/10',
          correccion && !correccion.correcto && 'border-brote-coral bg-brote-coral/10',
        )}
      >
        <input
          id={id}
          type="text"
          inputMode={payload.decimales > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          enterKeyHint="done"
          disabled={bloqueado}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="0"
          className="tnum min-w-0 flex-1 bg-transparent py-1.5 font-display text-display-l font-extrabold outline-none placeholder:text-muted-foreground/40"
        />
        <span className="shrink-0 text-right font-display text-h3 font-bold text-muted-foreground">{payload.unidad}</span>
      </div>
      <p className="tnum mt-1.5 min-h-5 text-caption text-muted-foreground" aria-live="polite">
        {valor !== null && texto.trim() ? t('leemos', { valor: fmt(valor, 4), unidad: payload.unidad }) : t('ayudaNumero')}
      </p>
      {correccion && verdad !== null && !correccion.correcto ? (
        <p className="mt-2 text-small font-semibold text-brote-green">
          {t('laRespuesta', { respuesta: `${fmt(verdad, 4)} ${payload.unidad}` })}
        </p>
      ) : null}
    </div>
  );
}

// ── Estimar ──────────────────────────────────────────────────────────────────

/**
 * Estimar con un deslizador. Es para intuición de magnitud, no para cuentas:
 * por eso la corrección da crédito por acercarse, y después muestra el valor
 * verdadero sobre la misma regla, al lado de lo que se estimó.
 *
 * No se reporta respuesta hasta que la persona mueve el deslizador: con el
 * valor inicial al medio, "comprobar" sin tocar nada sería apostar al centro.
 */
export function Estimar({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadEstimar>) {
  const t = useTranslations('arbol');
  const log = payload.escala === 'log' && payload.min > 0;
  const aCrudo = (v: number) => (log ? Math.log10(v) : v);
  const aValor = (c: number) => (log ? Math.pow(10, c) : c);
  const min = aCrudo(payload.min);
  const max = aCrudo(payload.max);
  const paso = log ? (max - min) / 240 : payload.paso;
  const [crudo, setCrudo] = useState((min + max) / 2);
  const [tocado, setTocado] = useState(false);

  const valor = useMemo(() => {
    const v = aValor(crudo);
    if (log) {
      // Dos cifras significativas: un deslizador logarítmico da 3418,7, y esa
      // falsa precisión no es lo que se está estimando.
      const orden = Math.pow(10, Math.floor(Math.log10(Math.max(1e-9, v))) - 1);
      return Math.round(v / orden) * orden;
    }
    return Math.round(v / payload.paso) * payload.paso;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crudo, log, payload.paso]);

  useReportar(onCambio, tocado ? { valor } : null);

  const verdad = correccion?.clave_cruda && typeof correccion.clave_cruda.valor === 'number' ? correccion.clave_cruda.valor : null;
  const pos = (v: number) => ((aCrudo(Math.max(payload.min, Math.min(payload.max, v))) - min) / (max - min)) * 100;

  return (
    <div>
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? (log ? t('ayudaEstimarLog') : t('ayudaEstimar'))} />

      <p className="mb-3 font-display text-display-l font-extrabold leading-none">
        <span className={cn('tnum', !tocado && 'text-muted-foreground/50')}>{fmt(valor)}</span>
        <span className="ml-1.5 text-h3 font-bold text-muted-foreground">{payload.unidad}</span>
      </p>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={paso}
          value={crudo}
          disabled={bloqueado}
          onChange={(e) => {
            setCrudo(Number(e.target.value));
            setTocado(true);
          }}
          aria-label={payload.enunciado}
          aria-valuetext={`${fmt(valor)} ${payload.unidad}`}
          className={cn(
            'h-11 w-full cursor-pointer accent-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            bloqueado && 'cursor-default opacity-70',
          )}
        />
        {verdad !== null ? (
          <span
            className="pointer-events-none absolute -top-1 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${pos(verdad)}%` }}
            aria-hidden
          >
            <Flag className="h-4 w-4 text-brote-green" fill="currentColor" />
          </span>
        ) : null}
      </div>
      <div className="tnum flex justify-between text-caption text-muted-foreground">
        <span>
          {fmt(payload.min)} {payload.unidad}
        </span>
        <span>
          {fmt(payload.max)} {payload.unidad}
        </span>
      </div>

      {correccion && verdad !== null ? (
        <p className="mt-3 text-small">
          <span className="font-semibold text-brote-green">{t('valorReal', { valor: fmt(verdad), unidad: payload.unidad })}</span>
          <span className="text-muted-foreground"> · {t('tuEstimacion', { valor: fmt(valor), unidad: payload.unidad })}</span>
        </p>
      ) : null}
    </div>
  );
}

// ── Detectar ─────────────────────────────────────────────────────────────────

/**
 * Leer un texto y marcar los tramos que tienen un problema: una afirmación
 * vaga, un número sin fuente, un razonamiento que no cierra. Los tramos se
 * marcan DENTRO del texto: sacarlos a una lista le quitaría el contexto, que
 * es justamente lo que se está aprendiendo a leer.
 */
export function Detectar({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadDetectar>) {
  const t = useTranslations('arbol');
  const { anunciar, region } = useAnuncio();
  const [marcados, setMarcados] = useState<string[]>([]);
  const [tocado, setTocado] = useState(false);
  const clave = claveArray(correccion);
  // No marcar nada puede ser una respuesta, pero solo si se decidió: hasta
  // tocar algo, no se reporta.
  useReportar(onCambio, tocado ? { marcados } : null);

  const marca = (id: string): Marca => {
    if (!correccion) return 'ninguna';
    const debia = clave.includes(id);
    const puso = marcados.includes(id);
    if (debia && puso) return 'bien';
    if (debia && !puso) return 'era';
    if (!debia && puso) return 'mal';
    return 'ninguna';
  };

  return (
    <div>
      {region}
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaDetectar')} />
      <p className="rounded-card border border-hairline bg-surface-2 p-4 text-body leading-[2]">
        {payload.segmentos.map((s) => {
          const puesto = marcados.includes(s.id);
          const mk = marca(s.id);
          return (
            <button
              key={s.id}
              type="button"
              disabled={bloqueado}
              aria-pressed={puesto}
              onClick={() => {
                setTocado(true);
                setMarcados((m) => (m.includes(s.id) ? m.filter((x) => x !== s.id) : [...m, s.id]));
                anunciar(puesto ? t('desmarcada', { cosa: s.texto }) : t('marcada', { cosa: s.texto }));
              }}
              className={cn(
                'mr-1 rounded-md px-1 py-0.5 text-left transition-colors duration-150 [box-decoration-break:clone]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                mk === 'ninguna' && !puesto && 'hover:bg-foreground/5',
                mk === 'ninguna' && puesto && 'underline decoration-2 underline-offset-4',
                mk === 'bien' && 'bg-brote-green/15 underline decoration-brote-green decoration-2 underline-offset-4',
                mk === 'era' && 'bg-brote-green/10 underline decoration-brote-green decoration-dashed decoration-2 underline-offset-4',
                mk === 'mal' && 'bg-brote-coral/15 line-through decoration-brote-coral',
              )}
              style={mk === 'ninguna' && puesto ? { backgroundColor: `${color}26`, textDecorationColor: color } : undefined}
            >
              {s.texto}
            </button>
          );
        })}
      </p>
      {!bloqueado ? (
        <button
          type="button"
          onClick={() => {
            setTocado(true);
            setMarcados([]);
          }}
          className={cn(
            'mt-3 text-caption font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tocado && marcados.length === 0 ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {t('nadaQueMarcar')}
        </button>
      ) : null}
    </div>
  );
}
