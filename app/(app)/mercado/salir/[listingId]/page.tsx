import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SalidaMercado } from '@/components/mercado/SalidaMercado';
import { getCuentaMercado, getSalida } from '@/lib/mercado/servidor';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORIGENES = new Set(['catalogo', 'accion', 'perfil_negocio', 'busqueda', 'ficha']);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mercado.salida');
  return { title: t('titulo'), robots: { index: false, follow: false } };
}

/**
 * `/mercado/salir/[listingId]` — el interstitial (fase 3 §7.4). El render NO
 * registra el clic: un prefetch lo contaría dos veces. Lo registra el cliente,
 * una vez, y recién entonces recibe la dirección.
 */
export default async function SalirPage({ params, searchParams }: { params: { listingId: string }; searchParams: { o?: string } }) {
  const cuenta = await getCuentaMercado();
  if (!cuenta || cuenta.tipo === 'kid') notFound();
  if (!UUID.test(params.listingId)) notFound();
  const salida = await getSalida(params.listingId);
  if (!salida) notFound();
  const origen = searchParams.o && ORIGENES.has(searchParams.o) ? searchParams.o : 'ficha';
  return (
    <div className="min-h-[60vh]">
      <SalidaMercado listingId={params.listingId} salida={salida} origen={origen} />
    </div>
  );
}
