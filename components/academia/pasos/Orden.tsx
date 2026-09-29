'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, X } from 'lucide-react';
import type { Correccion, Ficha as FichaT, PayloadCadena, PayloadOrden, Respuesta } from '@/lib/academia/modelo';
import { Adjuntos, Enunciado, Ficha, ItemAnimado, Ranura, claveArray, useAnuncio, useReportar, type Marca, type PropsPaso } from './piezas';
import { cn } from '@/lib/utils/cn';

/**
 * Lo que se resuelve poniendo cosas en orden: una secuencia, un ranking por
 * magnitud o una cadena de causas.
 *
 * Sin arrastre: se toca un fragmento y va a la primera ranura libre; se toca
 * uno ya puesto y vuelve al banco. El movimiento lo hace `layout`: la ficha
 * viaja del banco a su lugar en vez de desaparecer y reaparecer, que es lo
 * que hace que se entienda qué pasó.
 */
function Secuenciador({
  fragmentos,
  ranuras,
  bloqueado,
  correccion,
  onCambio,
  idAnimacion,
  extremos,
  cadena,
  color,
}: {
  fragmentos: FichaT[];
  ranuras: number;
  bloqueado: boolean;
  correccion: Correccion | null;
  onCambio: (r: Respuesta | null) => void;
  idAnimacion: string;
  extremos?: [string, string];
  cadena?: boolean;
  color: string;
}) {
  const t = useTranslations('arbol');
  const { anunciar, region } = useAnuncio();
  const [puestos, setPuestos] = useState<string[]>([]);
  const porId = useMemo(() => new Map(fragmentos.map((f) => [f.id, f])), [fragmentos]);
  const banco = fragmentos.filter((f) => !puestos.includes(f.id));
  const clave = claveArray(correccion);
  const revela = correccion?.revela ?? null;

  useReportar(onCambio, puestos.length === ranuras ? { orden: puestos } : null);

  function poner(id: string) {
    if (bloqueado || puestos.length >= ranuras) return;
    setPuestos((p) => [...p, id]);
    anunciar(t('colocado', { cosa: porId.get(id)?.texto ?? '', n: puestos.length + 1 }));
  }

  function sacar(id: string) {
    if (bloqueado) return;
    setPuestos((p) => p.filter((x) => x !== id));
    anunciar(t('quitado', { cosa: porId.get(id)?.texto ?? '' }));
  }

  const marca = (i: number, id: string): Marca => {
    if (!correccion || !clave.length) return 'ninguna';
    return clave[i] === id ? 'bien' : 'mal';
  };

  return (
    <div>
      {region}
      {extremos ? (
        <p className="eyebrow mb-2 text-muted-foreground" aria-hidden>
          {extremos[0]}
        </p>
      ) : null}
      <ol className="grid gap-2">
        {Array.from({ length: ranuras }, (_, i) => {
          const id = puestos[i];
          const frag = id ? porId.get(id) : undefined;
          return (
            <li key={i} className="relative">
              <ItemAnimado id={id ? `${idAnimacion}-${id}` : `${idAnimacion}-hueco-${i}`}>
                <Ranura
                  vacia={!id}
                  disabled={bloqueado || !id}
                  marca={id ? marca(i, id) : 'ninguna'}
                  onClick={() => id && sacar(id)}
                  className="flex w-full items-center gap-2.5"
                  aria-label={frag ? `${t('lugarN', { n: i + 1 })}: ${frag.texto}. ${t('quitar')}` : `${t('lugarN', { n: i + 1 })}. ${t('vacio')}`}
                >
                  <span
                    className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-bold text-white"
                    style={{ backgroundColor: id ? color : 'rgb(var(--muted-fg) / 0.5)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">{frag?.texto ?? t('tocaParaPoner')}</span>
                  {frag && !bloqueado ? <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
                </Ranura>
              </ItemAnimado>
              {cadena && i < ranuras - 1 ? (
                <ArrowDown className="mx-auto -my-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
      {extremos ? (
        <p className="eyebrow mt-2 text-muted-foreground" aria-hidden>
          {extremos[1]}
        </p>
      ) : null}

      {banco.length > 0 && !bloqueado ? (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="mb-2 text-caption text-muted-foreground">{cadena ? t('bancoCadena') : t('bancoOrden')}</p>
          <div className="flex flex-wrap gap-2">
            {banco.map((f) => (
              <ItemAnimado key={f.id} id={`${idAnimacion}-${f.id}`}>
                <Ficha disabled={bloqueado || puestos.length >= ranuras} onClick={() => poner(f.id)} color={color}>
                  {f.texto}
                </Ficha>
              </ItemAnimado>
            ))}
          </div>
        </div>
      ) : null}

      {/* El orden correcto, con los valores reales si es un ranking. Marcar el
          error sin mostrar cuál era deja a la persona sabiendo que falló y
          nada más. */}
      {correccion && clave.length > 0 && (!correccion.correcto || revela) ? (
        <div className="mt-4 border-t border-hairline pt-3">
          <p className="eyebrow mb-2 text-brote-green">{correccion.correcto ? t('asiEs') : t('elOrdenEra')}</p>
          <ol className="space-y-1.5">
            {clave.map((id, i) => (
              <li key={id} className="flex items-start gap-2 text-small">
                <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brote-green/15 text-caption font-bold text-brote-green">
                  {i + 1}
                </span>
                <span className={cn('min-w-0 flex-1', puestos[i] === id && 'text-muted-foreground')}>{porId.get(id)?.texto ?? id}</span>
                {revela?.[id] ? <span className="tnum shrink-0 text-right text-caption font-semibold">{revela[id]}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

export function Ordenar({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadOrden>) {
  const t = useTranslations('arbol');
  return (
    <div>
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? (payload.tipo === 'ranking' ? t('ayudaRanking') : t('ayudaOrdenar'))} />
      <Secuenciador
        idAnimacion={payload.tipo}
        fragmentos={payload.items}
        ranuras={payload.items.length}
        bloqueado={bloqueado}
        correccion={correccion}
        onCambio={onCambio}
        extremos={payload.extremos}
        color={color}
      />
    </div>
  );
}

export function Cadena({ payload, onCambio, bloqueado, correccion, color }: PropsPaso<PayloadCadena>) {
  const t = useTranslations('arbol');
  return (
    <div>
      <Adjuntos contexto={payload.contexto} datos={payload.datos} color={color} plegado={!!correccion} />
      <Enunciado texto={payload.enunciado} ayuda={payload.ayuda ?? t('ayudaCadena', { n: payload.largo })} />
      <Secuenciador
        idAnimacion="cadena"
        fragmentos={payload.items}
        ranuras={payload.largo}
        bloqueado={bloqueado}
        correccion={correccion}
        onCambio={onCambio}
        extremos={payload.extremos}
        cadena
        color={color}
      />
    </div>
  );
}
