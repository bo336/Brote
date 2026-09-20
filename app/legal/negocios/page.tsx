import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { LegalTitle, Section, Bullets, PlainSummary } from '@/components/legal/LegalDoc';

export const metadata: Metadata = {
  title: 'Términos para empresas',
  description: `Términos y condiciones del programa de empresas de ${BRAND.name}.`,
};

const UPDATED = '20 de septiembre de 2026';
/** Tiene que coincidir con `app_settings.negocios_terminos_version` (0109). */
const VERSION = '2026-09-20';

/**
 * Los términos del programa de empresas (08_LEGAL_Y_CONFIANZA.md §7).
 *
 * Las diez cláusulas mínimas del documento, en el orden en que las pide. Lo
 * más importante de todo el texto es lo que NO promete: Brote no vende, no
 * intermedia pagos, no certifica, y no garantiza tráfico ni ventas.
 *
 * ESTE TEXTO NECESITA LA REVISIÓN DE UN ABOGADO ARGENTINO DE CONSUMO antes de
 * cobrarle a la primera empresa (08 §10, primera fila del checklist). Está
 * escrito para que esa revisión sea barata —las cláusulas ya están, con el
 * lenguaje del producto— no para reemplazarla.
 */
export default function NegociosLegalPage() {
  return (
    <article>
      <LegalTitle
        title="Términos para empresas"
        updated={UPDATED}
        intro={`Estos Términos regulan la participación de una empresa en el programa de ${BRAND.name}: el programa de mejora, la ficha pública y el Mercado. Al enviar una empresa a revisión, quien la administra acepta estos Términos en su totalidad.`}
      />

      <PlainSummary>
        <p>
          Brote es una plataforma de difusión. No vendemos tus productos, no cobramos por vos y no certificamos nada:
          revisamos la documentación que presentás y mostramos qué nivel de evidencia tiene cada afirmación.
        </p>
        <p>
          Vos respondés por lo que afirmás. Si algo no se sostiene, lo bajamos. Lo que cargues es tuyo, tu dossier no
          se publica nunca, y si dejás de pagar no borramos nada: tus listados salen del Mercado y te esperan.
        </p>
      </PlainSummary>

      <Section n="1" title="Qué es Brote y qué no es">
        <p>
          {BRAND.name} es una <strong>plataforma de difusión</strong>. Publicamos fichas de productos y servicios de
          empresas que están en el programa, con información que esas empresas nos dan.
        </p>
        <Bullets
          items={[
            <>
              <strong>No somos vendedores.</strong> Ninguna compra se hace en Brote: cada listado lleva al sitio del
              comercio, y la operación es entre esa empresa y la persona.
            </>,
            <>
              <strong>No intermediamos pagos</strong> entre una persona y una empresa del Mercado.
            </>,
            <>
              <strong>No somos certificadores.</strong> Revisamos documentación; no emitimos certificaciones ni
              auditamos procesos.
            </>,
          ]}
        />
        <p>
          La cuota que la empresa paga es por el acceso a la plataforma y al programa de mejora, nunca por un
          resultado comercial.
        </p>
      </Section>

      <Section n="2" title="Declaración de veracidad e indemnidad">
        <p>
          La empresa declara que <strong>toda afirmación que carga es cierta</strong>, que cuenta con la documentación
          que la respalda y que la aportará si se la pedimos, en cualquier momento.
        </p>
        <p>
          La empresa mantiene indemne a {BRAND.name} frente a cualquier reclamo de terceros —personas consumidoras,
          competidores, autoridades de aplicación— originado en sus propias afirmaciones, datos, imágenes o precios.{' '}
          Si {BRAND.name} debiera afrontar un reclamo por ese motivo, la empresa responderá por los costos.
        </p>
      </Section>

      <Section n="3" title="Los niveles de evidencia no son una certificación">
        <p>
          El nivel que mostramos —Nivel 1 a Nivel 4— describe <strong>qué documentación revisamos</strong>, no la
          calidad del producto ni su desempeño ambiental. Está explicado en{' '}
          <Link href="/legal/niveles">cómo funcionan los niveles</Link>.
        </p>
        <p>
          Un nivel <strong>puede bajar</strong>: si un certificado vence, si la documentación se desmiente o si un
          reporte fundado se confirma. No es un premio permanente.
        </p>
      </Section>

      <Section n="4" title="Derecho a despublicar">
        <p>
          {BRAND.name} puede despublicar un listado o suspender una empresa, <strong>sin aviso previo</strong>, cuando:
        </p>
        <Bullets
          items={[
            'un reporte fundado quede confirmado;',
            'venza la documentación que sostenía una afirmación y no se reemplace;',
            'el enlace de destino deje de responder;',
            'la empresa deje de pagar, según la cláusula 8;',
            'se afirme algo prohibido por la normativa de lealtad comercial o de publicidad.',
          ]}
        />
        <p>
          Despublicar no borra: el contenido queda guardado y vuelve al Mercado cuando el motivo se corrige.
        </p>
      </Section>

      <Section n="5" title="Sin garantía de tráfico ni de ventas">
        <p>
          No garantizamos visitas, clics, ventas ni posición en el catálogo. El orden del Mercado responde a evidencia,
          actividad y salud del listado, y <strong>el plan contratado no influye en ese orden</strong>.
        </p>
      </Section>

      <Section n="6" title="Contenido de la empresa">
        <p>
          Todo lo que la empresa carga —textos, imágenes, logos, documentación— <strong>le pertenece</strong>. Al
          cargarlo nos otorga una licencia no exclusiva, gratuita y revocable para mostrarlo dentro de {BRAND.name} y
          en comunicaciones de la plataforma sobre el programa.
        </p>
        <p>La licencia termina cuando la empresa da de baja el contenido o cierra su cuenta.</p>
      </Section>

      <Section n="7" title="Los datos del dossier son confidenciales">
        <p>
          El dossier de mejora —consumos, procesos, restricciones, lo que la empresa ya hizo— es{' '}
          <strong>confidencial</strong>. Concretamente:
        </p>
        <Bullets
          items={[
            'no se publica nunca, ni entero ni en partes, ni siquiera agregado o anonimizado, sin consentimiento expreso;',
            'no se vende ni se cede a terceros;',
            'no se usa para otra cosa que generar y ajustar los objetivos de esa empresa;',
            'ninguna otra empresa ni persona usuaria puede leerlo.',
          ]}
        />
        <p>
          Cuando usamos un modelo de inteligencia artificial para proponer objetivos, le enviamos únicamente el
          contenido operativo necesario. <strong>Nunca</strong> el CUIT, datos de contacto personales ni el nombre de
          quien administra la cuenta. El detalle está en la{' '}
          <Link href="/legal/privacidad">Política de Privacidad</Link>.
        </p>
      </Section>

      <Section n="8" title="Cobro, prueba y falta de pago">
        <p>
          La prueba inicial es de <strong>14 días sin tarjeta</strong>. Terminada la prueba, el acceso al Mercado
          requiere un plan activo.
        </p>
        <Bullets
          items={[
            'Si un cobro falla, hay 7 días de gracia con aviso: durante ese plazo los listados siguen publicados.',
            'Vencida la gracia, los listados se despublican y el programa de mejora queda en modo lectura.',
            'No se borra nada. Los datos se conservan 90 días, durante los cuales la empresa puede retomar donde estaba o descargarlos.',
            'Las empresas fundadoras conservan el precio bloqueado por 12 meses.',
          ]}
        />
      </Section>

      <Section n="9" title="Baja y conservación de datos">
        <p>
          La empresa puede darse de baja cuando quiera, desde su espacio de trabajo. Al hacerlo: se despublican sus
          listados, se corta el cobro y puede descargar todo lo que cargó.
        </p>
        <p>
          Los datos se conservan <strong>90 días</strong> por si decide volver, y luego se eliminan. Si pide el borrado
          inmediato, se aplica el mismo procedimiento que para una cuenta personal.
        </p>
      </Section>

      <Section n="10" title="Cambios de precio">
        <p>
          Cualquier aumento se avisa con <strong>30 días</strong> de anticipación, dentro de la plataforma y por la
          campana de la empresa. Las empresas con precio de fundador mantienen su precio durante los 12 meses
          comprometidos, aunque el precio general cambie antes.
        </p>
      </Section>

      <Section n="11" title="Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República Argentina. Para cualquier controversia, las partes se
          someten a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, sin perjuicio de los derechos que
          la normativa de defensa del consumidor reconozca a quienes usan la aplicación.
        </p>
        <p className="text-caption text-muted-foreground">Versión del documento: {VERSION}</p>
      </Section>
    </article>
  );
}
