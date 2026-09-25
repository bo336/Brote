import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { InicioMercado } from '@/components/mercado/InicioMercado';
import { urlBusqueda, leerFiltros } from '@/lib/mercado/busqueda';
import { buscar, getCuentaMercado, getInicio, type FiltrosBusqueda } from '@/lib/mercado/servidor';
import { PROVINCES } from '@/lib/data/cities';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mercado.catalogo');
  return { title: t('eyebrow') };
}

const DESCUBRI: FiltrosBusqueda = {
  q: null, categoria: null, subcategoria: null, nivel: null, zona: null, modalidad: null, condicion: null,
  precioMin: null, precioMax: null, orden: 'recomendados',
};

/**
 * `/mercado`. Un `kid` recibe 404, no una pantalla vacía (fase 3 §8); el
 * filtro real está en la base.
 *
 * Los enlaces viejos al catálogo con filtros (`/mercado?categoria=…`, de antes
 * del Mercado v2, compartidos por WhatsApp) siguen andando: van a la búsqueda.
 */
export default async function MercadoPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') notFound();

  if (searchParams.categoria || searchParams.q || searchParams.zona || searchParams.modalidad || searchParams.nivel) {
    redirect(urlBusqueda(leerFiltros(searchParams, PROVINCES)));
  }

  const [inicio, descubri] = await Promise.all([getInicio(), buscar(DESCUBRI, 0, cuenta)]);
  if (!inicio) notFound();
  return <InicioMercado inicio={inicio} descubri={descubri} filtrosDescubri={DESCUBRI} />;
}
