import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalTitle, PlainSummary } from '@/components/legal/LegalDoc';
import { PedidoConsumidor } from '@/components/consumidor/PedidoConsumidor';
import { DIAS_ARREPENTIMIENTO } from '@/lib/consumidor/reglas';

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento',
  description: 'Revocá una compra o una suscripción dentro de los 10 días, sin cuenta y sin trámites.',
};

/** Disposición 954/2025, art. 1: se usa sin registración previa ni trámite adicional. */
export default function ArrepentimientoPage({ searchParams }: { searchParams: { codigo?: string } }) {
  return (
    <article>
      <LegalTitle
        title="Botón de arrepentimiento"
        updated="7 de noviembre de 2026"
        intro={`Si contrataste algo en Brote a distancia —Brote+, el plan de tu tienda o de tu empresa, o un anuncio— tenés ${DIAS_ARREPENTIMIENTO} días corridos desde que lo contrataste para arrepentirte, sin decir por qué y sin costo (Ley 24.240, art. 34, y Código Civil y Comercial, art. 1110).`}
      />
      <PlainSummary>
        <p>No necesitás cuenta ni iniciar sesión. Completás tu nombre y tu correo, y te damos el código del pedido en el momento.</p>
        <p>
          Si tenés la sesión iniciada y Brote+ lo contrataste hace {DIAS_ARREPENTIMIENTO} días o menos, se da de baja y te devolvemos lo
          cobrado por Mercado Pago ahí mismo. Lo demás lo resolvemos dentro de las 24 h hábiles.
        </p>
        <p>
          ¿Sólo querés que no te cobren más? Eso es la <Link href="/legal/baja">baja de servicio</Link>.
        </p>
      </PlainSummary>
      <PedidoConsumidor tipo="arrepentimiento" codigoInicial={searchParams.codigo} />
    </article>
  );
}
