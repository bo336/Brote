import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { LegalTitle, Section, Bullets, PlainSummary } from '@/components/legal/LegalDoc';

export const metadata: Metadata = {
  title: 'Términos para tiendas y empresas',
  description: `Términos y condiciones para vender en el Mercado de ${BRAND.name} y para el programa de empresas.`,
};

const UPDATED = '24 de septiembre de 2026';
/** Tiene que coincidir con `app_settings.negocios_terminos_version` (0114 la sube a esta). */
const VERSION = '2026-09-24';

/**
 * Los términos para vender en el Mercado (tiendas, Mercado v2) y para el
 * programa de empresas (08_LEGAL_Y_CONFIANZA.md §7).
 *
 * Una sola página, porque las dos cosas comparten lo esencial —Brote no vende,
 * no intermedia pagos, no certifica y no garantiza ventas— y las dos se
 * aceptan con el mismo registro (`business_terms`). Lo que es de un solo lado
 * lo dice en la cláusula.
 *
 * ESTE TEXTO NECESITA LA REVISIÓN DE UN ABOGADO ARGENTINO DE CONSUMO antes de
 * cobrarle a la primera tienda (08 §10, primera fila del checklist). Está
 * escrito para que esa revisión sea barata —las cláusulas ya están, con el
 * lenguaje del producto— no para reemplazarla.
 */
export default function NegociosLegalPage() {
  return (
    <article>
      <LegalTitle
        title="Términos para tiendas y empresas"
        updated={UPDATED}
        intro={`Estos Términos regulan la venta en el Mercado de ${BRAND.name} —la tienda de una persona o de una empresa— y el programa de empresas: el programa de mejora y la ficha pública. Al abrir una tienda o enviar una empresa a revisión, quien la administra acepta estos Términos en su totalidad.`}
      />

      <PlainSummary>
        <p>
          Brote es una vidriera. No vendemos tus productos, no cobramos por vos y no certificamos nada: te mostramos a
          quien busca, y la compra la hacen entre vos y esa persona, por tu WhatsApp, tu Instagram o tu sitio.
        </p>
        <p>
          Vos respondés por lo que afirmás y por lo que declarás de tu compromiso. Si algo no se sostiene, lo bajamos.
          La suscripción de tienda es de USD 5 por mes, en pesos, por Mercado Pago. Si dejás de pagar no borramos
          nada: tus productos salen del Mercado y te esperan.
        </p>
      </PlainSummary>

      <Section n="1" title="Qué es Brote y qué no es">
        <p>
          {BRAND.name} es una <strong>plataforma de difusión</strong>. Publicamos productos y servicios de tiendas y
          empresas, con la información que ellas nos dan.
        </p>
        <Bullets
          items={[
            <>
              <strong>No somos vendedores.</strong> Ninguna compra se hace en Brote: cada producto lleva al canal que
              la tienda eligió (WhatsApp, Instagram o su sitio), y la operación —precio final, pago, envío, cambios y
              garantía— es entre la tienda y la persona.
            </>,
            <>
              <strong>No intermediamos pagos</strong> entre una persona y una tienda. El precio que se muestra es un{' '}
              <strong>precio de referencia</strong> que informa la tienda.
            </>,
            <>
              <strong>No somos certificadores.</strong> Revisamos documentación y fotos; no emitimos certificaciones ni
              auditamos procesos.
            </>,
          ]}
        />
        <p>
          La suscripción que paga una tienda o una empresa es por el acceso a la plataforma, nunca por un resultado
          comercial. {BRAND.name} no cobra comisiones por venta.
        </p>
      </Section>

      <Section n="2" title="Quién puede vender">
        <p>
          Puede abrir una tienda <strong>cualquier persona mayor de edad</strong>, por su cuenta o en nombre de una
          empresa, con una cuenta de {BRAND.name} a su nombre. Para abrir hace falta:
        </p>
        <Bullets
          items={[
            'completar los datos de la tienda y al menos un canal de contacto que funcione;',
            'declarar su compromiso ambiental (cláusula 4) y aprobar la prueba verde sobre cómo comunicar lo ambiental;',
            'vincular una cuenta de Mercado Pago de Argentina, activa y con la identidad cargada: es como confirmamos quién vende;',
            'suscribirse (cláusula 10).',
          ]}
        />
        <p>
          Quien administra la tienda responde por todo lo que se publique en ella, también por lo que publiquen otras
          personas a las que les dé acceso.
        </p>
      </Section>

      <Section n="3" title="Declaración de veracidad e indemnidad">
        <p>
          La tienda o empresa declara que <strong>todo lo que carga es cierto</strong> —datos, fotos, precios de
          referencia, afirmaciones ambientales y prácticas de su compromiso— y que aportará la documentación que lo
          respalde si se la pedimos, en cualquier momento.
        </p>
        <p>
          La tienda o empresa mantiene indemne a {BRAND.name} frente a cualquier reclamo de terceros —personas
          consumidoras, competidores, autoridades de aplicación— originado en sus productos, sus ventas, sus
          afirmaciones, datos, imágenes o precios. Si {BRAND.name} debiera afrontar un reclamo por ese motivo, la
          tienda o empresa responderá por los costos.
        </p>
      </Section>

      <Section n="4" title="El compromiso ambiental de una tienda">
        <p>
          Al abrir, la tienda elige entre dos y seis <strong>prácticas concretas que ya hace</strong> y muestra al
          menos una con una foto real. Eso es una <strong>declaración jurada</strong>: se publica en la tienda tal como
          la tienda la declaró.
        </p>
        <Bullets
          items={[
            'El equipo de Brote revisa las fotos. Mientras tanto, la práctica se muestra como «declarada, con foto».',
            'Una práctica que no se sostiene se rechaza y deja de mostrarse. Declarar algo falso a sabiendas es motivo de suspensión.',
            'El compromiso describe a la tienda; no es una afirmación sobre un producto. Lo ambiental de un producto se afirma en el producto, con su nivel (cláusula 5).',
          ]}
        />
      </Section>

      <Section n="5" title="Afirmaciones ambientales: los niveles no son una certificación">
        <p>
          Una palabra ambiental en un producto («orgánico», «reciclable», «sin TACC», «compostable»…) necesita una{' '}
          <strong>afirmación tipificada</strong> que la respalde; sin ella, el producto no se publica. El nivel que
          mostramos —Nivel 1 a Nivel 4— describe <strong>qué documentación revisamos</strong>, no la calidad del
          producto ni su desempeño ambiental. Está explicado en{' '}
          <Link href="/legal/niveles">cómo funcionan los niveles</Link>.
        </p>
        <p>
          Un nivel <strong>puede bajar</strong>: si un certificado vence, si la documentación se desmiente o si un
          reporte fundado se confirma. No es un premio permanente. Nunca se afirman propiedades de salud («cura»,
          «previene», «adelgaza»…) ni absolutos que no se pueden probar («100% ecológico», «no contamina»).
        </p>
      </Section>

      <Section n="6" title="Derecho a despublicar">
        <p>
          {BRAND.name} puede despublicar un producto o suspender una tienda o empresa, <strong>sin aviso previo</strong>,
          cuando:
        </p>
        <Bullets
          items={[
            'un reporte fundado quede confirmado;',
            'venza la documentación que sostenía una afirmación y no se reemplace;',
            'el canal de contacto o el enlace de destino deje de funcionar;',
            'deje de pagar, según la cláusula 10;',
            'se ofrezca algo prohibido por la ley, o se afirme algo prohibido por la normativa de lealtad comercial, de publicidad o de salud;',
            'se compruebe que una práctica del compromiso es falsa.',
          ]}
        />
        <p>Despublicar no borra: el contenido queda guardado y vuelve al Mercado cuando el motivo se corrige.</p>
      </Section>

      <Section n="7" title="Sin garantía de tráfico ni de ventas">
        <p>
          No garantizamos visitas, consultas, ventas ni posición en el Mercado. El orden responde a lo que busca cada
          persona, a la evidencia y a la salud del producto, y <strong>lo que la tienda paga no influye en ese
          orden</strong>. En el Mercado no hay publicidad paga.
        </p>
      </Section>

      <Section n="8" title="Contenido y preguntas">
        <p>
          Todo lo que la tienda o empresa carga —textos, imágenes, logos, documentación— <strong>le
          pertenece</strong>. Al cargarlo nos otorga una licencia no exclusiva, gratuita y revocable para mostrarlo
          dentro de {BRAND.name} y en comunicaciones de la plataforma sobre el Mercado y el programa. La licencia
          termina cuando lo da de baja o cierra la cuenta.
        </p>
        <p>
          Las preguntas de la gente y las respuestas de la tienda son <strong>públicas</strong>; quién preguntó, no.
          La tienda puede ocultar una pregunta ofensiva o fuera de lugar, pero no editar lo que preguntó otra persona.
        </p>
      </Section>

      <Section n="9" title="Los datos del dossier y de Mercado Pago son confidenciales">
        <p>
          El dossier de mejora de una empresa —consumos, procesos, restricciones, lo que ya hizo— es{' '}
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
          quien administra la cuenta.
        </p>
        <p>
          De la cuenta de Mercado Pago que vincula una tienda guardamos solo su número, su alias, su correo, el país y
          el tipo de documento; <strong>nunca</strong> el número de documento, la clave ni los medios de pago. El
          detalle está en la <Link href="/legal/privacidad">Política de Privacidad</Link>.
        </p>
      </Section>

      <Section n="10" title="Suscripción, cobro y falta de pago">
        <p>
          <strong>Tiendas.</strong> La suscripción es de <strong>USD 5 por mes</strong>, cobrados en pesos argentinos
          por Mercado Pago, a la cuenta que la tienda vincula. El monto en pesos se calcula con el dólar oficial del día
          en que la tienda se suscribe, redondeado a la centena, y se muestra antes de confirmar. {BRAND.name} nunca ve
          ni guarda los datos de la tarjeta.
        </p>
        <Bullets
          items={[
            'El precio está fijado en dólares. Si el dólar oficial se mueve más de un 10%, el monto en pesos del cobro siguiente se ajusta; se avisa en la plataforma apenas se acredita el pago anterior, es decir, alrededor de un mes antes. Ese ajuste no es un aumento de precio.',
            'Si un cobro falla, hay 7 días de gracia con aviso: durante ese plazo los productos siguen publicados.',
            'Vencida la gracia, los productos salen del Mercado. No se borra nada: la tienda vuelve a estar a la vista cuando se pone al día.',
            'La tienda puede darse de baja cuando quiera, desde su plan: no se hacen más cobros y los productos salen del Mercado.',
          ]}
        />
        <p>
          <strong>Empresas del programa.</strong> La prueba inicial es de 14 días sin tarjeta; terminada la prueba, el
          acceso al Mercado requiere un plan activo, con la misma gracia de 7 días. Las empresas fundadoras conservan
          el precio bloqueado por 12 meses.
        </p>
      </Section>

      <Section n="11" title="Baja y conservación de datos">
        <p>
          La tienda o empresa puede darse de baja cuando quiera. Al hacerlo se despublican sus productos, se corta el
          cobro y puede descargar lo que cargó. Los datos se conservan <strong>90 días</strong> por si decide volver,
          y luego se eliminan. Si pide el borrado inmediato, se aplica el mismo procedimiento que para una cuenta
          personal.
        </p>
      </Section>

      <Section n="12" title="Cambios de precio y de estos Términos">
        <p>
          Cualquier aumento del precio de una suscripción —en dólares para las tiendas, en pesos para los planes de
          empresa— se avisa con <strong>30 días</strong> de anticipación, dentro de la plataforma. El ajuste por tipo
          de cambio de la cláusula 10 no es un aumento. Las empresas con precio de fundador lo mantienen durante los 12
          meses comprometidos.
        </p>
        <p>
          Si cambian estos Términos, la plataforma pide aceptarlos de nuevo antes de seguir operando.
        </p>
      </Section>

      <Section n="13" title="Ley aplicable y jurisdicción">
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
