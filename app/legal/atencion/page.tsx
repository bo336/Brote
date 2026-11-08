import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { LegalTitle, Section, Bullets } from '@/components/legal/LegalDoc';
import { ATENCION, DEFENSA_CONSUMIDOR, ETIQUETA, RUTA } from '@/lib/consumidor/reglas';

export const metadata: Metadata = {
  title: 'Atención al cliente',
  description: `Cómo contactar a ${BRAND.name} para consultas y reclamos.`,
};

/** Disposición 954/2025, art. 6: el canal, el área responsable y el horario, a la vista. */
export default function AtencionPage() {
  return (
    <article>
      <LegalTitle
        title="Atención al cliente"
        updated="7 de noviembre de 2026"
        intro={`Para consultas y reclamos sobre ${BRAND.name}, sus suscripciones y los servicios para empresas.`}
      />

      <Section n="1" title="Cómo contactarnos">
        <Bullets
          items={[
            <>
              Área responsable: <strong>{ATENCION.area}</strong>.
            </>,
            <>
              Correo: <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
            </>,
            <>Horario: {ATENCION.horario}.</>,
            <>{ATENCION.respuesta}</>,
          ]}
        />
      </Section>

      <Section n="2" title="Arrepentirte o darte de baja">
        <p>Las dos cosas se hacen sin cuenta, sin trámites y sin costo, y te damos el código del pedido en el momento:</p>
        <Bullets
          items={[
            <>
              <Link href={RUTA.arrepentimiento}>{ETIQUETA.arrepentimiento}</Link>: dentro de los 10 días corridos desde que contrataste, te
              devolvemos lo pagado.
            </>,
            <>
              <Link href={RUTA.baja}>{ETIQUETA.baja}</Link>: cuando quieras, para que no se te cobre más.
            </>,
          ]}
        />
      </Section>

      <Section n="3" title="Si no quedaste conforme">
        <p>
          Podés hacer un reclamo ante la autoridad de aplicación:{' '}
          <a href={DEFENSA_CONSUMIDOR.url} target="_blank" rel="noopener noreferrer">
            {DEFENSA_CONSUMIDOR.texto}
          </a>
          .
        </p>
      </Section>
    </article>
  );
}
