import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ResumenNegocio } from '@/components/negocio/ResumenNegocio';
import { InicioTienda } from '@/components/negocio/vendedor/InicioTienda';
import { InicioEmpresa } from '@/components/negocio/empresa/InicioEmpresa';
import { SumarObjetivo } from '@/components/negocio/empresa/SumarObjetivo';
import { getMisListados } from '@/lib/mercado/servidor';
import { getActiveBusiness, getMejoraEstado, getMiPuestoLiga, getNegocioDetalle } from '@/lib/negocio/context';
import { normalizarObjetivo } from '@/lib/negocio/objetivo';
import { getEstadoVendedor } from '@/lib/negocio/vendedor-acciones';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio');
  return { title: t('marca') };
}

/**
 * `/negocio` — el inicio del espacio de la tienda.
 *
 * Una tienda del alta nueva que todavía no abrió vuelve al alta (lo único que
 * puede hacer es terminarla); una abierta ve cómo le va. Lo dado de alta con
 * el flujo anterior sigue con su resumen de siempre.
 */
export default async function ResumenPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const objetivo = normalizarObjetivo(activo.objetivo, activo.modelo);

  // A company that came to improve (0121) starts on its programme and its league.
  if (objetivo === 'mejorar' || activo.modelo === 'empresa') {
    const [mejora, liga] = await Promise.all([getMejoraEstado(activo.id), getMiPuestoLiga(activo.id)]);
    if (!mejora) redirect('/negocio/contexto');
    return <InicioEmpresa estado={mejora} liga={liga} esOwner={activo.role === 'owner'} />;
  }

  const estado = await getEstadoVendedor(activo.id);
  if (estado?.modelo === 'vendedor') {
    if (!estado.abierta) redirect('/negocio/alta');
    const datos = await getMisListados(activo.id);
    if (!datos) redirect('/negocio/contexto');
    return (
      <>
        <InicioTienda estado={estado} datos={datos} />
        {/* A store that only sells can also join the programme. */}
        {objetivo === 'vender' && activo.role === 'owner' && (
          <div className="mt-8 max-w-3xl">
            <SumarObjetivo negocioId={activo.id} sumar="mejorar" />
          </div>
        )}
      </>
    );
  }
  const negocio = await getNegocioDetalle(activo.id);
  if (!negocio) redirect('/negocio/contexto');
  return <ResumenNegocio negocio={negocio} />;
}
