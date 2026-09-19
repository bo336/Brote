import type { Metadata } from 'next';
import Link from 'next/link';
import { Bullets, LegalTitle, PlainSummary, Section } from '@/components/legal/LegalDoc';

// El layout raíz ya agrega "· Brote" con su plantilla de título.
export const metadata: Metadata = {
  title: 'Niveles de evidencia',
  description: 'Qué significa cada nivel de evidencia del Mercado de Brote, qué revisamos y qué no.',
};

const UPDATED = '19 de septiembre de 2026';

/**
 * `/legal/niveles` (fase 3 §10). Pública, sin cuenta, y linkeada desde cada
 * badge de nivel de toda la app: que la escalera sea pública y explícita es
 * parte de la defensa — nadie puede decir que el nivel lo confundió
 * (08 §4.2). Los cuatro textos son los de 08 §4.2, literales.
 */
const NIVELES = [
  {
    n: 1,
    color: '#8A8F98',
    corto: 'Declarado por el comercio',
    explicacion: 'El comercio afirma esto. Brote no verificó documentación de respaldo.',
    exige: 'La afirmación tiene que ser específica y calificada: a qué parte del producto aplica, en qué porcentaje, dónde se recicla, en qué plazo. Sin documento.',
  },
  {
    n: 2,
    color: '#2DB4D4',
    corto: 'Documentación revisada',
    explicacion: 'El comercio presentó documentación de respaldo y Brote la revisó. No es una certificación de tercero.',
    exige: 'Identidad del comercio verificada por su dominio, y un documento de respaldo revisado: ficha técnica, composición, factura de proveedor, foto del proceso.',
  },
  {
    n: 3,
    color: '#0E7A52',
    corto: 'Certificación de tercero',
    explicacion:
      'Hay una certificación de un organismo externo, con número y vigencia. Brote verificó que el certificado exista y esté vigente; no realizó la certificación.',
    exige: 'Una certificación de nuestro registro, que respalde ese tipo de afirmación, con número y fecha de vencimiento vigente.',
  },
  {
    n: 4,
    color: null,
    corto: 'Referente',
    explicacion: 'Certificación de tercero vigente y un historial de mejora verificado por Brote a lo largo del tiempo.',
    exige: 'Es un nivel del comercio, no de una afirmación: al menos una certificación vigente, dos ciclos de mejora cerrados con evidencia aprobada, sin reportes abiertos y una revisión en los últimos 12 meses.',
  },
];

export default function NivelesPage() {
  return (
    <article>
      <LegalTitle
        title="Niveles de evidencia"
        updated={UPDATED}
        intro="Cada afirmación ambiental del Mercado de Brote lleva un nivel. El nivel describe qué documentación revisamos, nunca la calidad de un producto."
      />

      <PlainSummary>
        <p>
          El nivel es de cada <strong>afirmación</strong>, no del producto ni del comercio. Un mismo producto puede tener una
          afirmación en Nivel 3 y otra en Nivel 1: la certificación de un insumo no cubre todo lo demás.
        </p>
        <p>
          Brote no vende, no certifica y no garantiza productos. Revisamos documentos. Si algo no es como dice el listado,
          podés reportarlo.
        </p>
      </PlainSummary>

      <Section n="1" title="Los cuatro niveles">
        <ul className="space-y-5">
          {NIVELES.map((nv) => (
            <li key={nv.n} className="border-l-2 pl-3" style={{ borderColor: nv.color ?? '#1FB57A' }}>
              <p className="font-display text-h3 font-bold">
                Nivel {nv.n} · {nv.corto}
              </p>
              <p className="mt-1">{nv.explicacion}</p>
              <p className="mt-1 text-small text-muted-foreground">{nv.exige}</p>
            </li>
          ))}
        </ul>
        <p className="text-small text-muted-foreground">
          El nivel siempre se muestra con su número y su nombre, no solo con un color.
        </p>
      </Section>

      <Section n="2" title="Qué revisa Brote">
        <Bullets
          items={[
            'Que cada afirmación sea específica: a qué parte del producto aplica y con qué calificación (porcentaje, plazo, lugar, condiciones). No se puede cargar una afirmación vaga como "ecológico": el formulario no tiene dónde escribirla.',
            'Que el documento presentado corresponda a la afirmación, cuando la afirmación es de Nivel 2.',
            'Que la certificación esté en nuestro registro, que respalde ese tipo de afirmación, que tenga número y que esté vigente. Las entidades que certifican producción orgánica se contrastan con el registro de SENASA.',
            'Que el texto del listado no tenga afirmaciones absolutas ("100% ecológico", "impacto cero") ni afirmaciones de salud ("cura", "previene", "desintoxica"). Estas últimas no se publican nunca, tenga el producto la certificación que tenga.',
            'Que el enlace de compra funcione y no lleve a otro dominio que el declarado.',
          ]}
        />
      </Section>

      <Section n="3" title="Qué NO revisa Brote">
        <Bullets
          items={[
            'La calidad, el funcionamiento o la seguridad de un producto o servicio.',
            'El precio: es un precio de referencia informado por el comercio.',
            'La compra, el envío, el cobro y la atención: son responsabilidad del comercio. Brote no vende ni interviene en la operación.',
            'Brote no certifica. Un Nivel 3 significa que un organismo externo certificó y que el certificado existe y está vigente, no que Brote haya hecho esa certificación.',
          ]}
        />
      </Section>

      <Section n="4" title="Cuándo cambia un nivel">
        <Bullets
          items={[
            'Si una certificación vence, la afirmación baja de Nivel 3 a Nivel 2 (o a Nivel 1 si no hay otro documento) de forma automática. Avisamos al comercio 30 días antes.',
            'Si se confirma un reporte, el listado pierde visibilidad y el comercio tiene 30 días para corregirlo. Tres reportes confirmados en un año bajan el nivel del comercio.',
            'Nada se borra: las afirmaciones vencidas o rechazadas quedan registradas, con quién las hizo, con qué texto y con qué documento.',
          ]}
        />
      </Section>

      <Section n="5" title="Cómo reportar">
        <p>
          En cada ficha del <Link href="/mercado">Mercado</Link> hay un enlace &laquo;Reportar este listado&raquo;. Elegís un motivo —una
          afirmación que no es cierta, un enlace que no funciona, una página que no es del producto— y, si querés, contás más.
        </p>
        <p>
          Antes de confirmar un reporte, el comercio recibe el motivo y tiene 7 días para responder con evidencia. Si dos
          personas distintas reportan una afirmación falsa en 30 días, el listado sale del Mercado hasta que lo revisemos. Un
          reporte desestimado no tiene consecuencias para nadie, tampoco para quien reportó de buena fe.
        </p>
      </Section>
    </article>
  );
}
