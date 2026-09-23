'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Droplets, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { Arbol } from '@/components/academia/Arbol';
import { EnPausa } from '@/components/academia/EnPausa';
import { HojaUnidad } from '@/components/academia/HojaUnidad';
import { ListaRamas } from '@/components/academia/ListaRamas';
import { SaviaMedidor } from '@/components/academia/SaviaMedidor';
import { SaviaVacia } from '@/components/academia/SaviaVacia';
import { TarjetaSeguir } from '@/components/academia/TarjetaSeguir';
import { TiraArbol } from '@/components/academia/TiraArbol';
import { fetchMapa } from '@/lib/api/academia';
import { esFallo, type Mapa } from '@/lib/academia/modelo';
import type { NodoUbicado } from '@/lib/academia/geometria';
import { useEmpezar } from '@/lib/academia/usar-empezar';

const CLAVE_COMPLETAS = 'brote.academia.completas';

/**
 * El Árbol: la pantalla identitaria de la Academia.
 *
 * UNA sola llamada a `academia_mapa()`. Todo lo que se ve —el árbol, la tira de
 * cifras, la próxima sesión, el repaso, la savia y la lista de ramas— sale de
 * ese único objeto.
 */
export default function ArbolPage() {
  const t = useTranslations('arbol');
  const q = useQuery({ queryKey: ['academia', 'mapa'], queryFn: fetchMapa, staleTime: 20_000 });
  const [elegido, setElegido] = useState<NodoUbicado | null>(null);
  const recien = useRecienCompletas(q.data && !esFallo(q.data) ? q.data : null);

  if (q.isLoading) return <Esqueleto />;

  if (q.isError || !q.data || esFallo(q.data)) {
    const f = q.data && esFallo(q.data) ? q.data : null;
    return (
      <div data-shell="wide">
        {f?.error === 'pausa' ? (
          <EnPausa mensaje={f.mensaje} />
        ) : (
          <EmptyState
            pipMood="worried"
            title={t('errorTitulo')}
            message={f?.mensaje ?? t('errorCuerpo')}
            action={
              <Button variant="secondary" onClick={() => q.refetch()}>
                <RotateCw className="h-4 w-4" aria-hidden />
                {t('reintentar')}
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const mapa = q.data;
  const hayContenido = mapa.ramas.some((r) => r.unidades.length > 0);
  const sinSavia = !mapa.pro && (mapa.savia?.restante ?? 1) <= 0;
  const ramaSig = mapa.siguiente ? mapa.ramas.find((r) => r.slug === mapa.siguiente!.unidad.rama_slug) : undefined;
  const unidadSig = ramaSig?.unidades.find((u) => u.id === mapa.siguiente!.unidad.id);

  return (
    <div data-shell="wide" className="space-y-5 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-primary">{t('eyebrow')}</p>
          {/* El único momento de gradiente de marca de la pantalla. */}
          <h1 className="mt-1 text-balance font-display text-display-l font-extrabold leading-tight">
            <span className="bg-brand-gradient bg-clip-text text-transparent">{t('titulo')}</span>
          </h1>
          <p className="mt-1.5 max-w-lg text-small leading-relaxed text-muted-foreground">{t('subtitulo')}</p>
        </div>
        <SaviaMedidor savia={mapa.savia} pro={mapa.pro} className="mt-1 shrink-0" />
      </header>

      <TiraArbol mapa={mapa} />

      {!hayContenido ? (
        <EmptyState pipMood="sleepy" title={t('vacioTitulo')} message={t('vacioCuerpo')} />
      ) : (
        <>
          <Reveal>
            <Arbol
              ramas={mapa.ramas}
              siguiente={mapa.siguiente}
              recienCompletas={recien}
              onElegir={setElegido}
              className="h-[68vh] min-h-[440px] lg:h-[74vh]"
            />
          </Reveal>

          {mapa.siguiente ? (
            <Reveal index={1}>
              <TarjetaSeguir
                siguiente={mapa.siguiente}
                unidad={unidadSig}
                ramaNombre={ramaSig?.nombre_es ?? ''}
                sinSavia={sinSavia}
              />
            </Reveal>
          ) : null}

          {sinSavia ? (
            <Reveal index={2}>
              <SaviaVacia savia={mapa.savia} />
            </Reveal>
          ) : null}

          {mapa.repaso > 0 && !sinSavia ? (
            <Reveal index={2}>
              <TarjetaRepaso n={mapa.repaso} />
            </Reveal>
          ) : null}

          <section>
            <SectionHeader eyebrow={t('ramasEyebrow')} title={t('ramasTitulo')} subtitle={t('ramasSub')} />
            <ListaRamas ramas={mapa.ramas} />
          </section>
        </>
      )}

      <HojaUnidad nodo={elegido} onCerrar={() => setElegido(null)} sinSavia={sinSavia} />
    </div>
  );
}

function TarjetaRepaso({ n }: { n: number }) {
  const t = useTranslations('arbol');
  const { repasar, arrancando } = useEmpezar();
  return (
    <section className="flex flex-wrap items-center gap-4 rounded-card border border-brote-aqua/30 bg-brote-aqua/5 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brote-aqua/15 text-brote-aqua">
        <Droplets className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-h3 font-bold leading-tight">{t('repasoTitulo', { n })}</h2>
        <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">{t('repasoCuerpo')}</p>
      </div>
      <Button variant="secondary" loading={arrancando === 'repaso'} onClick={() => void repasar()} className="w-full sm:w-auto">
        {t('repasoCta')}
      </Button>
    </section>
  );
}

/**
 * Las unidades completadas desde la última visita, para que broten con
 * animación. Es una comodidad de este navegador y nada más: si el
 * almacenamiento no está, el árbol se ve igual, solo sin el festejo.
 */
function useRecienCompletas(mapa: Mapa | null): Set<string> {
  const [recien, setRecien] = useState<Set<string>>(new Set());
  const completas = useMemo(
    () =>
      mapa
        ? mapa.ramas.flatMap((r) => r.unidades.filter((u) => u.estado === 'completa' || u.estado === 'repasar').map((u) => u.slug))
        : null,
    [mapa],
  );
  useEffect(() => {
    if (!completas) return;
    try {
      const crudo = window.localStorage.getItem(CLAVE_COMPLETAS);
      const antes = crudo ? new Set<string>(JSON.parse(crudo) as string[]) : null;
      // Primera visita: no se festeja todo lo que ya estaba hecho.
      if (antes) setRecien(new Set(completas.filter((s) => !antes.has(s))));
      window.localStorage.setItem(CLAVE_COMPLETAS, JSON.stringify(completas));
    } catch {
      /* sin almacenamiento, sin festejo */
    }
  }, [completas]);
  return recien;
}

function Esqueleto() {
  return (
    <div data-shell="wide" className="space-y-5 pb-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="-mx-4 h-11 rounded-none lg:mx-0 lg:rounded-card" />
      <Skeleton className="h-[68vh] min-h-[440px] w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
