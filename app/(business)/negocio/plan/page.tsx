import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PlanNegocio } from '@/components/negocio/plan/PlanNegocio';
import { PlanVendedor } from '@/components/negocio/vendedor/PlanVendedor';
import { getActiveBusiness } from '@/lib/negocio/context';
import { getEstadoPlan } from '@/lib/negocio/plan-servidor';

export const metadata: Metadata = { title: 'Plan' };

/**
 * `/negocio/plan`. El estado real sale de la base: el plan, la suscripción y
 * los topes que se están usando. La vuelta de Mercado Pago es informativa y
 * NUNCA fuente de verdad: eso lo decide el webhook (09 §4.3).
 *
 * Una tienda nueva (Mercado v2) tiene un solo plan; lo dado de alta con el
 * flujo anterior sigue viendo sus tres.
 */
export default async function PlanPage() {
  const activo = await getActiveBusiness();
  if (!activo) redirect('/negocio/alta');
  const estado = await getEstadoPlan(activo.id);
  if (!estado) redirect('/negocio');
  if (estado.modelo === 'vendedor') return <PlanVendedor estado={estado} negocioId={activo.id} />;

  return (
    <Suspense fallback={null}>
      <PlanNegocio estado={estado} negocioId={activo.id} />
    </Suspense>
  );
}
