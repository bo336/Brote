import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalTitle, PlainSummary } from '@/components/legal/LegalDoc';
import { PedidoConsumidor } from '@/components/consumidor/PedidoConsumidor';

export const metadata: Metadata = {
  title: 'Botón de baja de servicio',
  description: 'Dá de baja Brote+ o el plan de tu negocio, sin cuenta y sin trámites.',
};

/** Disposición 954/2025, art. 4, y Ley 24.240, art. 10 ter: la baja, por el mismo medio y sin trámites. */
export default function BajaPage({ searchParams }: { searchParams: { codigo?: string } }) {
  return (
    <article>
      <LegalTitle
        title="Botón de baja de servicio"
        updated="7 de noviembre de 2026"
        intro="Podés dar de baja cualquier servicio que contrataste en Brote —Brote+, la suscripción de tu tienda o el plan de tu empresa— por este mismo medio, cuando quieras y sin costo (Ley 24.240, art. 10 ter)."
      />
      <PlainSummary>
        <p>No necesitás cuenta ni iniciar sesión. Te damos el código del pedido en el momento.</p>
        <p>
          Con la sesión iniciada, la baja se hace ahí mismo: no se te vuelve a cobrar y seguís con los beneficios hasta el final de lo que
          ya pagaste. No cobramos nada por darte de baja.
        </p>
        <p>
          Si lo contrataste hace 10 días o menos y querés que te devolvamos lo pagado, usá el{' '}
          <Link href="/legal/arrepentimiento">botón de arrepentimiento</Link>.
        </p>
      </PlainSummary>
      <PedidoConsumidor tipo="baja" codigoInicial={searchParams.codigo} />
    </article>
  );
}
