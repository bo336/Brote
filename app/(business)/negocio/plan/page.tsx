import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PlanNegocio } from '@/components/negocio/plan/PlanNegocio';
import { getActiveBusiness } from '@/lib/negocio/context';
import { getEstadoPlan } from '@/lib/negocio/plan-servidor';

export const metadata: Metadata = { title: 'Plan' };

/**
 * `/negocio/plan`. El estado real sale de la base: el plan, la prueba, la
 * suscripción y los topes que se están usando. La vuelta de MercadoPago
 * (`?estado=pendiente`) es informativa y NUNCA fuente de verdad: eso lo decide
 * el webhook (09 §4.3).
 */
export default async function PlanPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const estado = await getEstadoPlan(activo.id);
  if (!estado) redirect('/negocio');

  return (
    <Suspense fallback={null}>
      <PlanNegocio estado={estado} negocioId={activo.id} />
    </Suspense>
  );
}
