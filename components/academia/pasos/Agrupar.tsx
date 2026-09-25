'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, X } from 'lucide-react';
import type { PayloadClasificar, PayloadEmparejar } from '@/lib/academia/modelo';
import { Adjuntos, Enunciado, Ficha, ItemAnimado, Ranura, claveObjeto, useAnuncio, useReportar, type Marca, type PropsPaso } from './piezas';
import { cn } from '@/lib/utils/cn';

/**
 * Los dos tipos que se resuelven asignando: fichas a grupos, y cada cosa de
 * una lista con su pareja.
 *
 * El mismo gesto de dos toques que el resto: se toca lo que se quiere mover y
 * después dónde va. Mientras hay algo elegido, los destinos se marcan — si no,
 * el segundo toque es a ciegas.
 */

export function Clasificar({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadClasificar>) {
  const t = useTranslations('arbol');
  const { anunciar, region } = useAnuncio();
  const [elegida, setElegida] = useState<string | null>(null);
  const [asignacion, setAsignacion] = useState<Record<string, string>>({});
  const porId = useMemo(() => new Map(payload.items.map((f) => [f.id, f])), [payload.items]);
  const grupoPorId = useMemo(() => new Map(payload.grupos.map((g) => [g.id, g])), [payload.grupos]);
  const sueltas = payload.items.filter((f) => !asignacion[f.id]);
  const clave = claveObjeto(correccion);

  useReportar(onCambio, payload.items.every((f) => asignacion[f.id]) ? { asignacion } : null);

  function alGrupo(grupoId: string, nombre: string) {
    if (bloqueado || !elegida) return;
    const ficha = porId.get(elegida);
    setAsignacion((a) => ({ ...a, [elegida]: grupoId }));
    setElegida(null);
    anunciar(t('colocadoEn', { cosa: ficha?.texto ?? '', lugar: nombre }));
  }

  function sacar(id: string) {
    if (bloqueado) return;
    setAsignacion((a) => {
      const { [id]: _fuera, ...resto } = a;
      return resto;
    });
    anunciar(t('quitado', { cosa: porId.get(id)?.texto ?? '' }));
  }

  const marca = (id: string, grupoId: string): Marca => {
    if (!correccion || !Object.keys(clave).length) return 'ninguna';
    return clave[id] === grupoId ? 'bien' : 'mal';
  };

  return (
    <div>
      {region}
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaClasificar')} />

      {sueltas.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {sueltas.map((f) => (
            <ItemAnimado key={f.id} id={`clas-${f.id}`}>
              <Ficha
                seleccionada={elegida === f.id}
                disabled={bloqueado}
                color={color}
                onClick={() => {
                  const nueva = elegida === f.id ? null : f.id;
                  setElegida(nueva);
                  if (nueva) anunciar(t('elegidaPara', { cosa: f.texto }));
                }}
              >
                {f.texto}
              </Ficha>
            </ItemAnimado>
          ))}
        </div>
      ) : null}

      <div className={cn('grid gap-2.5', payload.grupos.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
        {payload.grupos.map((g) => {
          const dentro = payload.items.filter((f) => asignacion[f.id] === g.id);
          const destino = !!elegida && !bloqueado;
          return (
            <div
              key={g.id}
              className={cn('rounded-card border-2 p-3 transition-colors duration-150', destino ? 'border-dashed' : 'border-hairline bg-surface-2')}
              style={destino ? { borderColor: color, backgroundColor: `${color}0F` } : undefined}
            >
              <button
                type="button"
                disabled={bloqueado || !elegida}
                onClick={() => alGrupo(g.id, g.nombre)}
                aria-label={dentro.length ? t('grupoCon', { nombre: g.nombre, n: dentro.length }) : t('grupoVacio', { nombre: g.nombre })}
                className="flex min-h-11 w-full items-center gap-2 text-left text-small font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                <span className="flex-1">{g.nombre}</span>
                {destino ? <span className="text-caption font-semibold" style={{ color }}>{t('tocaAca')}</span> : null}
              </button>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {dentro.length === 0 ? (
                  <span className="text-caption text-muted-foreground">{t('vacio')}</span>
                ) : (
                  dentro.map((f) => (
                    <ItemAnimado key={f.id} id={`clas-${f.id}`}>
                      <Ficha
                        marca={marca(f.id, g.id)}
                        disabled={bloqueado}
                        onClick={() => sacar(f.id)}
                        className="flex min-h-9 items-center gap-1.5 px-2.5 py-1.5 text-caption"
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

      {correccion && !correccion.correcto ? (
        <ul className="mt-4 space-y-1 border-t border-hairline pt-3">
          {payload.items
            .filter((f) => clave[f.id] && clave[f.id] !== asignacion[f.id])
            .map((f) => (
              <li key={f.id} className="text-small">
                <span className="font-semibold">{f.texto}</span>{' '}
                <span className="text-brote-green">→ {grupoPorId.get(clave[f.id]!)?.nombre}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Emparejar como filas: cada elemento de la izquierda tiene su ranura, y las
 * parejas posibles esperan abajo. En un teléfono, dos columnas de frases
 * largas se vuelven ilegibles; filas con una ranura no.
 */
export function Emparejar({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadEmparejar>) {
  const t = useTranslations('arbol');
  const { anunciar, region } = useAnuncio();
  const [pares, setPares] = useState<Record<string, string>>({});
  const [elegidaDer, setElegidaDer] = useState<string | null>(null);
  const [elegidaIzq, setElegidaIzq] = useState<string | null>(null);
  const derPorId = useMemo(() => new Map(payload.derecha.map((d) => [d.id, d])), [payload.derecha]);
  const clave = claveObjeto(correccion);
  const tomadas = new Set(Object.values(pares));
  const libres = payload.derecha.filter((d) => !tomadas.has(d.id));

  useReportar(onCambio, payload.izquierda.every((i) => pares[i.id]) ? { pares } : null);

  function unir(izq: string, der: string) {
    setPares((p) => {
      const limpio = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== der));
      return { ...limpio, [izq]: der };
    });
    setElegidaDer(null);
    setElegidaIzq(null);
    anunciar(
      t('unido', {
        a: payload.izquierda.find((x) => x.id === izq)?.texto ?? '',
        b: derPorId.get(der)?.texto ?? '',
      }),
    );
  }

  function tocarFila(izqId: string) {
    if (bloqueado) return;
    if (pares[izqId]) {
      setPares((p) => {
        const { [izqId]: _fuera, ...resto } = p;
        return resto;
      });
      anunciar(t('quitado', { cosa: derPorId.get(pares[izqId]!)?.texto ?? '' }));
      return;
    }
    if (elegidaDer) return unir(izqId, elegidaDer);
    setElegidaIzq((x) => (x === izqId ? null : izqId));
  }

  function tocarPareja(derId: string) {
    if (bloqueado) return;
    if (elegidaIzq) return unir(elegidaIzq, derId);
    setElegidaDer((x) => (x === derId ? null : derId));
    anunciar(t('elegidaPara', { cosa: derPorId.get(derId)?.texto ?? '' }));
  }

  const marca = (izqId: string): Marca => {
    if (!correccion || !Object.keys(clave).length) return 'ninguna';
    return clave[izqId] === pares[izqId] ? 'bien' : 'mal';
  };

  return (
    <div>
      {region}
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaEmparejar')} />

      <ul className="space-y-2">
        {payload.izquierda.map((i) => {
          const par = pares[i.id];
          const activa = elegidaIzq === i.id || (!!elegidaDer && !par);
          return (
            <li key={i.id}>
              <Ranura
                vacia={!par}
                activa={activa && !bloqueado}
                marca={par ? marca(i.id) : correccion ? 'mal' : 'ninguna'}
                disabled={bloqueado}
                onClick={() => tocarFila(i.id)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 py-2.5"
                aria-label={par ? `${i.texto} — ${derPorId.get(par)?.texto ?? ''}. ${t('quitar')}` : `${i.texto}. ${t('sinPareja')}`}
              >
                <span className="font-semibold text-foreground">{i.texto}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className={cn('min-w-0', par ? 'text-foreground' : 'italic text-muted-foreground')}>
                  {par ? derPorId.get(par)?.texto : t('tocaParaUnir')}
                  {correccion && clave[i.id] && clave[i.id] !== par ? (
                    <span className="mt-1 block text-caption not-italic text-brote-green">
                      {t('eraEsta', { texto: derPorId.get(clave[i.id]!)?.texto ?? '' })}
                    </span>
                  ) : null}
                </span>
              </Ranura>
            </li>
          );
        })}
      </ul>

      {libres.length > 0 && !bloqueado ? (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="mb-2 text-caption text-muted-foreground">{t('bancoParejas')}</p>
          <div className="flex flex-wrap gap-2">
            {libres.map((d) => (
              <Ficha key={d.id} seleccionada={elegidaDer === d.id} color={color} onClick={() => tocarPareja(d.id)}>
                {d.texto}
              </Ficha>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
