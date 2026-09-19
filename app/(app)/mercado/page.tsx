import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CatalogoMercado } from '@/components/mercado/CatalogoMercado';
import { esCategoria } from '@/lib/mercado/categorias';
import { getCatalogo, getCuentaMercado, type FiltrosCatalogo } from '@/lib/mercado/servidor';
import { PROVINCES } from '@/lib/data/cities';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mercado.catalogo');
  return { title: t('eyebrow') };
}

/**
 * `/mercado`. Un `kid` recibe 404, no una pantalla vacía (fase 3 §8). El
 * filtro real está en la base (RPC y RLS); esto es solo la puerta.
 */
export default async function MercadoPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') notFound();

  const filtros: FiltrosCatalogo = {
    categoria: esCategoria(searchParams.categoria) ? searchParams.categoria : null,
    dominio: typeof searchParams.dominio === 'string' && /^[a-z_]{3,20}$/.test(searchParams.dominio) ? searchParams.dominio : null,
    nivel: searchParams.nivel === 'e2' || searchParams.nivel === 'e3' ? searchParams.nivel : null,
    zona: searchParams.zona && (PROVINCES as readonly string[]).includes(searchParams.zona) ? searchParams.zona : null,
    modalidad: searchParams.modalidad === 'online' || searchParams.modalidad === 'local' ? searchParams.modalidad : null,
    orden: searchParams.orden === 'nivel' ? 'nivel' : 'recomendados',
  };
  const pagina = await getCatalogo(filtros, null, cuenta);
  return <CatalogoMercado inicial={pagina} filtros={filtros} esTeen={cuenta.tipo === 'teen'} />;
}
