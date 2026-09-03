'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import type { PayloadClasificarEnCestos, PayloadEmparejar } from '@/lib/academia/types';
import {
  Enunciado,
  Ficha,
  ItemAnimado,
  claveObjeto,
  useAnuncio,
  useReportar,
  type Marca,
  type PropsEjercicio,
} from './piezas';
import { cn } from '@/lib/utils/cn';

/**
 * Los dos tipos que se resuelven asignando: fichas a cestos, y una columna a
 * la otra.
 *
 * Mismo gesto de dos toques que el resto: se toca lo que se quiere mover y
 * después dónde va. Mientras hay algo seleccionado, los destinos se marcan —
 * si no, el segundo toque es a ciegas.
 */

export function ClasificarEnCestos({
  payload,
  onCambio,
  bloqueado,
  correccion,
}: PropsEjercicio<PayloadClasificarEnCestos>) {
  const t = useTranslations('academia');
  const { anunciar, region } = useAnuncio();
  const [elegida, setElegida] = useState<string | null>(null);
  const [asignacion, setAsignacion] = useState<Record<string, string>>({});

  const porId = useMemo(() => new Map(payload.fichas.map((f) => [f.id, f])), [payload.fichas]);
  const sueltas = payload.fichas.filter((f) => !asignacion[f.id]);
  const clave = claveObjeto(correccion);
  const hayCorreccion = correccion !== null;

  useReportar(onCambio, payload.fichas.every((f) => asignacion[f.id]) ? { asignacion } : null);

  function alCesto(cestoId: string, nombre: string) {
    if (bloqueado || !elegida) return;
    const ficha = porId.get(elegida);
    setAsignacion((a) => ({ ...a, [elegida]: cestoId }));
    setElegida(null);
    anunciar(t('colocado', { cosa: ficha?.texto ?? '', lugar: t('cesto', { nombre }) }));
  }

  function sacar(id: string) {
    if (bloqueado) return;
    setAsignacion((a) => {
      const { [id]: _fuera, ...resto } = a;
      return resto;
    });
    anunciar(t('quitado', { cosa: porId.get(id)?.texto ?? '' }));
  }

  const marcaDeFicha = (id: string, cestoId: string): Marca => {
    if (!hayCorreccion || Object.keys(clave).length === 0) return 'ninguna';
    return clave[id] === cestoId ? 'bien' : 'mal';
  };

  return (
    <div>
      {region}
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaCestos')} />

      {sueltas.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {sueltas.map((f) => (
            <ItemAnimado key={f.id} id={`cesto-${f.id}`}>
              <Ficha
                seleccionada={elegida === f.id}
                disabled={bloqueado}
                onClick={() => {
                  const nueva = elegida === f.id ? null : f.id;
                  setElegida(nueva);
                  if (nueva) anunciar(t('seleccionadoPara', { cosa: f.texto }));
                }}
              >
                {f.texto}
              </Ficha>
            </ItemAnimado>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {payload.cestos.map((c) => {
          const dentro = payload.fichas.filter((f) => asignacion[f.id] === c.id);
          return (
            <div
              key={c.id}
              className={cn(
                'rounded-card border p-3 transition-colors duration-150',
                elegida && !bloqueado ? 'border-primary/60 bg-primary/5' : 'border-hairline bg-surface-2',
              )}
            >
              <button
                type="button"
                disabled={bloqueado || !elegida}
                onClick={() => alCesto(c.id, c.nombre)}
                aria-label={
                  dentro.length
                    ? t('cestoCon', { nombre: c.nombre, n: dentro.length })
                    : t('cestoVacio', { nombre: c.nombre })
                }
                className="flex w-full items-center gap-2 text-left text-small font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color ?? 'rgb(var(--primary))' }}
                  aria-hidden
                />
                {c.nombre}
              </button>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {dentro.length === 0 ? (
                  <span className="text-caption text-muted-foreground">{t('sinPoner')}</span>
                ) : (
                  dentro.map((f) => (
                    <ItemAnimado key={f.id} id={`cesto-${f.id}`}>
                      <Ficha
                        marca={marcaDeFicha(f.id, c.id)}
                        disabled={bloqueado}
                        onClick={() => sacar(f.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-caption"
                        aria-label={`${f.texto}. ${t('quitar')}`}
                      >
                        {f.texto}
                        {!bloqueado ? <X className="h-3 w-3 shrink-0 opacity-60" aria-hidden /> : null}
                      </Ficha>
                    </ItemAnimado>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Emparejar({ payload, onCambio, bloqueado, correccion }: PropsEjercicio<PayloadEmparejar>) {
  const t = useTranslations('academia');
  const { anunciar, region } = useAnuncio();
  const [elegido, setElegido] = useState<string | null>(null);
  const [pares, setPares] = useState<Record<string, string>>({});

  const derPorId = useMemo(() => new Map(payload.derecha.map((d) => [d.id, d])), [payload.derecha]);
  const clave = claveObjeto(correccion);
  const hayCorreccion = correccion !== null;
  const tomados = new Set(Object.values(pares));

  useReportar(onCambio, payload.izquierda.every((i) => pares[i.id]) ? { pares } : null);

  function emparejar(derechaId: string) {
    if (bloqueado || !elegido) return;
    setPares((p) => {
      // Un token de la derecha no puede quedar en dos pares: si ya estaba
      // usado, se libera del par anterior.
      const limpio = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== derechaId));
      return { ...limpio, [elegido]: derechaId };
    });
    const izq = payload.izquierda.find((i) => i.id === elegido);
    setElegido(null);
    anunciar(t('colocado', { cosa: izq?.texto ?? '', lugar: derPorId.get(derechaId)?.texto ?? '' }));
  }

  const marcaIzq = (izqId: string): Marca => {
    if (!hayCorreccion || Object.keys(clave).length === 0) return 'ninguna';
    if (!pares[izqId]) return 'mal';
    return clave[izqId] === pares[izqId] ? 'bien' : 'mal';
  };

  const hechos = Object.keys(pares).length;

  return (
    <div>
      {region}
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaEmparejar')} />

      <p className="tnum mb-3 text-caption text-muted-foreground">
        {t('paresHechos', { n: hechos, total: payload.izquierda.length })}
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="grid content-start gap-2">
          {payload.izquierda.map((i) => {
            const par = pares[i.id];
            return (
              <Ficha
                key={i.id}
                seleccionada={elegido === i.id}
                marca={marcaIzq(i.id)}
                disabled={bloqueado}
                onClick={() => {
                  if (par) {
                    setPares((p) => {
                      const { [i.id]: _fuera, ...resto } = p;
                      return resto;
                    });
                    anunciar(t('quitado', { cosa: i.texto }));
                    return;
                  }
                  const nuevo = elegido === i.id ? null : i.id;
                  setElegido(nuevo);
                  if (nuevo) anunciar(t('seleccionadoPara', { cosa: i.texto }));
                }}
                className="w-full"
                aria-label={par ? `${i.texto} — ${derPorId.get(par)?.texto ?? ''}. ${t('quitar')}` : i.texto}
              >
                <span className="block">{i.texto}</span>
                {par ? (
                  <span className="mt-1 block truncate text-caption font-normal text-muted-foreground">
                    → {derPorId.get(par)?.texto}
                  </span>
                ) : null}
                {hayCorreccion && clave[i.id] && clave[i.id] !== par ? (
                  <span className="mt-1 block truncate text-caption font-normal text-brote-green">
                    {t('laRespuesta', { respuesta: derPorId.get(clave[i.id]!)?.texto ?? '' })}
                  </span>
                ) : null}
              </Ficha>
            );
          })}
        </div>

        <div className="grid content-start gap-2">
          {payload.derecha.map((d) => (
            <Ficha
              key={d.id}
              disabled={bloqueado || !elegido}
              onClick={() => emparejar(d.id)}
              className={cn('w-full', tomados.has(d.id) && 'opacity-45')}
            >
              {d.texto}
            </Ficha>
          ))}
        </div>
      </div>
    </div>
  );
}
