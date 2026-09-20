import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { FichaObjetivo } from '@/components/negocio/mejora/FichaObjetivo';
import { HistorialPublico } from '@/components/negocio/mejora/HistorialPublico';
import { getActiveBusiness, getObjetivoDetalle } from '@/lib/negocio/context';
import { getEstadoPlan } from '@/lib/negocio/plan-servidor';
import { createClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: { goalId: string } }): Promise<Metadata> {
  if (!UUID.test(params.goalId)) return {};
  const detalle = await getObjetivoDetalle(params.goalId);
  return { title: detalle?.objetivo.titulo };
}

/**
 * `/negocio/mejora/[goalId]` — la ficha de un objetivo (07 §4.5).
 *
 * `objetivo_detalle` ya chequea la membresía: si el objetivo no es de un
 * negocio de esta persona devuelve null, y acá eso es un 404. No hace falta
 * comparar con el contexto activo — y no conviene, porque una versión vieja
 * enlazada desde el historial sigue siendo del mismo negocio.
 */
export default async function ObjetivoPage({ params }: { params: { goalId: string } }) {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  if (!UUID.test(params.goalId)) notFound();

  const detalle = await getObjetivoDetalle(params.goalId);
  if (!detalle) notFound();

  // Un objetivo cerrado con evidencia puede mostrarse en la ficha pública
  // (fase 4 §8). Los demás no: no hay nada terminado que contar todavía.
  const cerrado = detalle.objetivo.status === 'logrado' || detalle.objetivo.status === 'logrado_parcial';
  let publico: { es_publico: boolean; permitido: boolean } | null = null;
  if (cerrado) {
    const [fila, plan] = await Promise.all([
      createClient().from('improvement_goals').select('es_publico').eq('id', params.goalId).maybeSingle(),
      getEstadoPlan(activo.id),
    ]);
    publico = {
      es_publico: Boolean(fila.data?.es_publico),
      permitido: Boolean(plan?.limites.historial_publico),
    };
  }

  return (
    <div className="space-y-6">
      <FichaObjetivo detalle={detalle} />
      {publico && (
        <HistorialPublico
          goalId={params.goalId}
          inicial={publico.es_publico}
          permitido={publico.permitido}
          slugNegocio={activo.slug}
        />
      )}
    </div>
  );
}
