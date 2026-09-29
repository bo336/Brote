'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, CheckSquare, Square, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { PayloadMultiple, PayloadOpcion, PayloadVF } from '@/lib/academia/modelo';
import { Adjuntos, Enunciado, Ficha, claveArray, useAnuncio, useReportar, type Marca, type PropsPaso } from './piezas';
import { cn } from '@/lib/utils/cn';

const LETRAS = 'ABCDEFG';

/** Opción única. */
export function Opcion({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadOpcion>) {
  const t = useTranslations('arbol');
  const [elegida, setElegida] = useState<string | null>(null);
  const clave = claveArray(correccion);
  useReportar(onCambio, elegida ? { elegido: elegida } : null);

  const marca = (id: string): Marca => {
    if (!correccion) return 'ninguna';
    if (clave.includes(id)) return id === elegida ? 'bien' : 'era';
    return id === elegida ? 'mal' : 'ninguna';
  };

  return (
    <div>
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? null} />
      <div role="radiogroup" aria-label={payload.enunciado} className="grid gap-2.5">
        {payload.opciones.map((o, i) => (
          <Ficha
            key={o.id}
            role="radio"
            aria-checked={elegida === o.id}
            seleccionada={elegida === o.id}
            marca={marca(o.id)}
            disabled={bloqueado}
            color={color}
            onClick={() => setElegida(o.id)}
            className="w-full gap-3"
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-caption font-bold',
                elegida === o.id && !correccion ? 'border-transparent text-white' : 'border-border text-muted-foreground',
              )}
              style={elegida === o.id && !correccion ? { backgroundColor: color } : undefined}
              aria-hidden
            >
              {marca(o.id) === 'bien' || marca(o.id) === 'era' ? <Check className="h-3.5 w-3.5 text-brote-green" /> : LETRAS[i]}
            </span>
            <span className="min-w-0 flex-1">{o.texto}</span>
          </Ficha>
        ))}
      </div>
      {!correccion ? <span className="sr-only">{t('ayudaOpcion')}</span> : null}
    </div>
  );
}

/** Selección múltiple: todas las que correspondan. */
export function Multiple({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadMultiple>) {
  const t = useTranslations('arbol');
  const { anunciar, region } = useAnuncio();
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const clave = claveArray(correccion);
  useReportar(onCambio, marcadas.length ? { marcados: marcadas } : null);

  const alternar = (id: string, texto: string) => {
    setMarcadas((m) => {
      const ya = m.includes(id);
      anunciar(ya ? t('desmarcada', { cosa: texto }) : t('marcada', { cosa: texto }));
      return ya ? m.filter((x) => x !== id) : [...m, id];
    });
  };

  const marca = (id: string): Marca => {
    if (!correccion) return 'ninguna';
    const debia = clave.includes(id);
    const puso = marcadas.includes(id);
    if (debia && puso) return 'bien';
    if (debia && !puso) return 'era';
    if (!debia && puso) return 'mal';
    return 'ninguna';
  };

  return (
    <div>
      {region}
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaMultiple')} />
      <div role="group" aria-label={payload.enunciado} className="grid gap-2.5">
        {payload.opciones.map((o) => {
          const puesta = marcadas.includes(o.id);
          const Icono = puesta ? CheckSquare : Square;
          return (
            <Ficha
              key={o.id}
              role="checkbox"
              aria-checked={puesta}
              seleccionada={puesta}
              marca={marca(o.id)}
              disabled={bloqueado}
              color={color}
              onClick={() => alternar(o.id, o.texto)}
              className="w-full gap-3"
            >
              <Icono className="h-5 w-5 shrink-0" style={puesta && !correccion ? { color } : undefined} aria-hidden />
              <span className="min-w-0 flex-1">{o.texto}</span>
              {correccion && marca(o.id) === 'era' ? (
                <span className="shrink-0 text-caption font-semibold text-brote-green">{t('faltoMarcar')}</span>
              ) : null}
            </Ficha>
          );
        })}
      </div>
    </div>
  );
}

/** Verdadero o falso, y —si el paso lo pide— por qué. */
export function VF({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadVF>) {
  const t = useTranslations('arbol');
  const [valor, setValor] = useState<boolean | null>(null);
  const [razon, setRazon] = useState<string | null>(null);
  const conRazones = !!payload.razones?.length;
  const completa = valor !== null && (!conRazones || razon !== null);
  useReportar(onCambio, completa ? (conRazones ? { valor: valor!, razon: razon! } : { valor: valor! }) : null);

  const verdad = correccion?.clave_cruda && typeof correccion.clave_cruda.valor === 'boolean' ? correccion.clave_cruda.valor : null;
  const claveRazon = claveArray(correccion);

  const marcaValor = (v: boolean): Marca => {
    if (!correccion || verdad === null) return 'ninguna';
    if (v === verdad) return v === valor ? 'bien' : 'era';
    return v === valor ? 'mal' : 'ninguna';
  };
  const marcaRazon = (id: string): Marca => {
    if (!correccion) return 'ninguna';
    if (claveRazon.includes(id)) return id === razon ? 'bien' : 'era';
    return id === razon ? 'mal' : 'ninguna';
  };

  return (
    <div>
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <p className="eyebrow" style={{ color }}>
        {payload.enunciado}
      </p>
      <blockquote className="mt-2 rounded-card border border-hairline bg-surface-2 p-4 font-display text-h2 font-bold leading-snug">
        «{payload.afirmacion}»
      </blockquote>

      <div role="radiogroup" aria-label={payload.enunciado} className="mt-4 grid grid-cols-2 gap-2.5">
        {[true, false].map((v) => {
          const Icono = v ? ThumbsUp : ThumbsDown;
          return (
            <Ficha
              key={String(v)}
              role="radio"
              aria-checked={valor === v}
              seleccionada={valor === v}
              marca={marcaValor(v)}
              disabled={bloqueado}
              color={color}
              onClick={() => {
                setValor(v);
                setRazon(null);
              }}
              className="w-full justify-center gap-2 py-4 font-display text-h3 font-bold"
            >
              <Icono className="h-5 w-5" aria-hidden />
              {v ? t('verdadero') : t('falso')}
            </Ficha>
          );
        })}
      </div>

      {conRazones && (valor !== null || correccion) ? (
        <div className="mt-5">
          <p className="mb-2.5 font-display text-h3 font-bold">{t('porQue')}</p>
          <div role="radiogroup" aria-label={t('porQue')} className="grid gap-2">
            {payload.razones!.map((r) => (
              <Ficha
                key={r.id}
                role="radio"
                aria-checked={razon === r.id}
                seleccionada={razon === r.id}
                marca={marcaRazon(r.id)}
                disabled={bloqueado}
                color={color}
                onClick={() => setRazon(r.id)}
                className="w-full"
              >
                {r.texto}
              </Ficha>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
