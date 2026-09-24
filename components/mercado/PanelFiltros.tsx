'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Select } from '@/components/ui/input';
import { SUBCATEGORIAS, CATEGORIAS, CATEGORIAS_SENSIBLES, CONDICIONES, type Categoria } from '@/lib/mercado/categorias';
import type { FiltrosURL } from '@/lib/mercado/busqueda';
import type { Busqueda } from '@/lib/supabase/rows-mercado';
import { PROVINCES } from '@/lib/data/cities';
import { cn } from '@/lib/utils/cn';

/**
 * Los filtros de la búsqueda: los mismos en la hoja del teléfono y en la
 * barra lateral de escritorio. Cada cambio va a la URL (la búsqueda se
 * comparte y se vuelve atrás igual), y cada opción dice cuántos productos hay
 * — una opción que lleva a cero resultados no se ofrece como si nada.
 */
export function PanelFiltros({
  f,
  facetas,
  esTeen,
  cambiar,
}: {
  f: FiltrosURL;
  facetas: Busqueda['facetas'];
  esTeen: boolean;
  cambiar: (parcial: Partial<FiltrosURL>) => void;
}) {
  const t = useTranslations('mercado.filtros');
  const tc = useTranslations('mercado.categorias');
  const tm = useTranslations('mercado');
  const tco = useTranslations('mercado.condicion');
  const [desde, setDesde] = useState(f.precioMin?.toString() ?? '');
  const [hasta, setHasta] = useState(f.precioMax?.toString() ?? '');

  useEffect(() => {
    setDesde(f.precioMin?.toString() ?? '');
    setHasta(f.precioMax?.toString() ?? '');
  }, [f.precioMin, f.precioMax]);

  const cats = CATEGORIAS.filter((c) => !esTeen || !CATEGORIAS_SENSIBLES.includes(c));
  const conteoCat = facetas.categorias ?? {};
  const conteoSub = facetas.subcategorias ?? {};
  const conteoCond = facetas.condicion ?? {};

  function aplicarPrecio() {
    const n = (s: string) => {
      const v = Number(s.replace(/\./g, '').replace(',', '.'));
      return s.trim() && Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
    };
    cambiar({ precioMin: n(desde), precioMax: n(hasta) });
  }

  return (
    <div className="space-y-6">
      <Grupo titulo={t('categoria')}>
        {f.categoria ? (
          <ul className="space-y-0.5">
            <li>
              <Opcion activa={false} onClick={() => cambiar({ categoria: null, subcategoria: null })}>
                {t('todasCategorias')}
              </Opcion>
            </li>
            <li>
              <Opcion activa={!f.subcategoria} onClick={() => cambiar({ subcategoria: null })} n={Object.values(conteoSub).reduce((a, b) => a + b, 0)}>
                <span className="font-semibold">{tc(f.categoria)}</span>
              </Opcion>
            </li>
            {SUBCATEGORIAS[f.categoria as Categoria].map((s) => {
              const n = conteoSub[s] ?? 0;
              if (n === 0 && f.subcategoria !== s) return null;
              return (
                <li key={s} className="pl-3">
                  <Opcion activa={f.subcategoria === s} onClick={() => cambiar({ subcategoria: s })} n={n}>
                    {tm(`subcategorias.${f.categoria}.${s}`)}
                  </Opcion>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="space-y-0.5">
            {cats
              .filter((c) => (conteoCat[c] ?? 0) > 0)
              .map((c) => (
                <li key={c}>
                  <Opcion activa={false} onClick={() => cambiar({ categoria: c, subcategoria: null })} n={conteoCat[c]}>
                    {tc(c)}
                  </Opcion>
                </li>
              ))}
          </ul>
        )}
      </Grupo>

      <Grupo titulo={t('estado')}>
        <ul className="space-y-0.5">
          {CONDICIONES.map((c) => {
            const n = conteoCond[c] ?? 0;
            if (n === 0 && f.condicion !== c) return null;
            return (
              <li key={c}>
                <Opcion activa={f.condicion === c} onClick={() => cambiar({ condicion: f.condicion === c ? null : c })} n={n}>
                  {tco(c)}
                </Opcion>
              </li>
            );
          })}
        </ul>
      </Grupo>

      <Grupo titulo={t('comoSeConsigue')}>
        <ul className="space-y-0.5">
          {(['online', 'local'] as const).map((m) => (
            <li key={m}>
              <Opcion activa={f.modalidad === m} onClick={() => cambiar({ modalidad: f.modalidad === m ? null : m })}>
                {t(m === 'online' ? 'conEnvio' : 'retiro')}
              </Opcion>
            </li>
          ))}
        </ul>
      </Grupo>

      <Grupo titulo={t('zona')}>
        <Select
          value={f.zona ?? ''}
          onChange={(e) => cambiar({ zona: e.target.value || null })}
          aria-label={t('zona')}
          className="h-10 text-small"
        >
          <option value="">{t('todoElPais')}</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {t('llegaA', { zona: p })}
            </option>
          ))}
        </Select>
      </Grupo>

      <Grupo titulo={t('nivel')} ayuda={t('nivelAyuda')}>
        <ul className="space-y-0.5">
          {([null, 'e1', 'e2', 'e3'] as const).map((n) => (
            <li key={n ?? 'todos'}>
              <Opcion activa={f.nivel === n} onClick={() => cambiar({ nivel: n })}>
                {n ? t('nivelDesde', { n: Number(n.slice(1)) }) : t('cualquierNivel')}
              </Opcion>
            </li>
          ))}
        </ul>
      </Grupo>

      {!esTeen && (
        <Grupo titulo={t('precio')}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              aplicarPrecio();
            }}
            className="flex items-center gap-2"
          >
            <input
              inputMode="numeric"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              placeholder={t('desde')}
              aria-label={t('desde')}
              className="h-10 min-w-0 flex-1 rounded-button border border-border bg-surface px-3 text-small outline-none focus:border-primary/60"
            />
            <span className="text-muted-foreground">–</span>
            <input
              inputMode="numeric"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              placeholder={t('hasta')}
              aria-label={t('hasta')}
              className="h-10 min-w-0 flex-1 rounded-button border border-border bg-surface px-3 text-small outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              className="press h-10 shrink-0 rounded-button bg-surface-2 px-3 text-small font-semibold hover:bg-border/60"
            >
              {t('aplicar')}
            </button>
          </form>
        </Grupo>
      )}
    </div>
  );
}

function Grupo({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{titulo}</legend>
      {ayuda && <p className="-mt-1 mb-2 text-caption text-muted-foreground">{ayuda}</p>}
      {children}
    </fieldset>
  );
}

function Opcion({
  activa,
  onClick,
  n,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  n?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={cn(
        'flex w-full items-center gap-2 rounded-button px-2.5 py-2 text-left text-small transition-colors duration-150',
        activa ? 'bg-primary/10 font-semibold text-foreground' : 'hover:bg-surface-2',
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {typeof n === 'number' && <span className="shrink-0 text-caption text-muted-foreground tnum">{n}</span>}
      {activa && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}
