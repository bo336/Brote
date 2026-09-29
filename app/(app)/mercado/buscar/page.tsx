import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResultadosBusqueda } from '@/components/mercado/ResultadosBusqueda';
import { leerFiltros } from '@/lib/mercado/busqueda';
import { buscar, getCuentaMercado, type FiltrosBusqueda } from '@/lib/mercado/servidor';
import { PROVINCES } from '@/lib/data/cities';

export async function generateMetadata({ searchParams }: { searchParams: Record<string, string | undefined> }): Promise<Metadata> {
  const t = await getTranslations('mercado.resultados');
  const tc = await getTranslations('mercado.categorias');
  const f = leerFiltros(searchParams, PROVINCES);
  const titulo = f.q ? t('resultadosPara', { q: f.q }) : f.categoria ? tc(f.categoria) : t('titulo');
  return { title: titulo, robots: { index: false, follow: true } };
}

/** `/mercado/buscar` — texto, categoría, filtros y orden, todo desde la URL. */
export default async function BuscarPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') notFound();
  const f = leerFiltros(searchParams, PROVINCES);
  const filtros: FiltrosBusqueda = {
    q: f.q,
    categoria: f.categoria,
    subcategoria: f.subcategoria,
    nivel: f.nivel,
    zona: f.zona,
    modalidad: f.modalidad,
    condicion: f.condicion,
    precioMin: f.precioMin,
    precioMax: f.precioMax,
    orden: f.orden,
  };
  const r = await buscar(filtros, 0, cuenta);
  return <ResultadosBusqueda f={f} r={r} esTeen={cuenta.tipo === 'teen'} filtrosServidor={filtros} />;
}
