import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { FichaObjetivo } from '@/components/negocio/mejora/FichaObjetivo';
import { getActiveBusiness, getObjetivoDetalle } from '@/lib/negocio/context';

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
  return <FichaObjetivo detalle={detalle} />;
}
