'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Store, TrendingDown } from 'lucide-react';
import { BotonSeguir } from '@/components/mercado/BotonSeguir';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { ChipRail } from '@/components/ui/chip-rail';
import { EmptyState } from '@/components/ui/empty-state';
import { formatoPrecio, urlLogo } from '@/lib/mercado/imagenes';
import type { Guardados } from '@/lib/supabase/rows-mercado';

type Pestana = 'guardados' | 'vistos' | 'tiendas';

/**
 * `/mercado/guardados` — lo guardado, lo visto hace poco y las tiendas que se
 * siguen. Un producto guardado que bajó su precio de referencia desde que se
 * guardó lo dice, con los dos números (el de entonces y el de hoy). Uno que ya
 * no está publicado se muestra atenuado: guardarlo fue una decisión de la
 * persona, borrarlo no es la nuestra.
 */
export function GuardadosMercado({ g, pestana: inicial }: { g: Guardados; pestana: Pestana }) {
  const t = useTranslations('mercado.guardados');
  const router = useRouter();
  const [pestana, setPestana] = useState<Pestana>(inicial);

  function cambiar(p: Pestana) {
    setPestana(p);
    router.replace(p === 'guardados' ? '/mercado/guardados' : `/mercado/guardados?tab=${p}`, { scroll: false });
  }

  return (
    <div data-shell="wide" className="pb-20">
      <Link href="/mercado" className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('volver')}
      </Link>
      <h1 className="mt-3 font-display text-h1 font-bold">{t('titulo')}</h1>

      <ChipRail
        layoutId="guardados-pestanas"
        value={pestana}
        onChange={(v) => cambiar(v as Pestana)}
        options={[
          { value: 'guardados', label: t('pestanas.guardados', { n: g.favoritos.length }) },
          { value: 'vistos', label: t('pestanas.vistos') },
          { value: 'tiendas', label: t('pestanas.tiendas', { n: g.tiendas.length }) },
        ]}
        className="mt-4"
      />

      <div className="mt-5">
        {pestana === 'guardados' &&
          (g.favoritos.length === 0 ? (
            <EmptyState title={t('vacio.guardadosTitulo')} message={t('vacio.guardados')} pipMood="happy" />
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {g.favoritos.map((item) => {
                const bajo =
                  item.precio !== null && item.precio_al_guardar !== null && Number(item.precio) < Number(item.precio_al_guardar);
                return (
                  <li key={item.id} className={item.disponible ? '' : 'opacity-50'}>
                    <TarjetaListado t={item} />
                    {!item.disponible && <p className="mt-1 text-caption font-semibold text-muted-foreground">{t('noDisponible')}</p>}
                    {item.disponible && bajo && (
                      <p className="mt-1 flex items-center gap-1 text-caption font-semibold text-brote-green">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {t('bajoDesde', { antes: formatoPrecio(Number(item.precio_al_guardar), item.moneda) })}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ))}

        {pestana === 'vistos' &&
          (g.vistos.length === 0 ? (
            <EmptyState title={t('vacio.vistosTitulo')} message={t('vacio.vistos')} pipMood="sleepy" />
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {g.vistos.map((item) => (
                <li key={item.id}>
                  <TarjetaListado t={item} />
                </li>
              ))}
            </ul>
          ))}

        {pestana === 'tiendas' &&
          (g.tiendas.length === 0 ? (
            <EmptyState title={t('vacio.tiendasTitulo')} message={t('vacio.tiendas')} pipMood="happy" />
          ) : (
            <ul className="divide-y divide-hairline border-y border-hairline">
              {g.tiendas.map((s) => {
                const logo = urlLogo(s.logo);
                return (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <Link href={`/mercado/tienda/${s.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2">
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo} alt="" className="h-12 w-12 object-cover" />
                        ) : (
                          <Store className="h-5 w-5 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-small font-semibold">{s.nombre}</span>
                        <span className="block truncate text-caption text-muted-foreground">
                          {t('productosN', { n: s.productos })}
                          {(s.nuevos ?? 0) > 0 && <span className="font-semibold text-brote-green"> · {t('nuevosN', { n: s.nuevos ?? 0 })}</span>}
                        </span>
                      </span>
                    </Link>
                    <BotonSeguir negocioId={s.id} inicial tamano="sm" />
                  </li>
                );
              })}
            </ul>
          ))}
      </div>
    </div>
  );
}
