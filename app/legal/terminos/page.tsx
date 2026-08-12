import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { LegalTitle, Section, Bullets, PlainSummary } from '@/components/legal/LegalDoc';

// The root layout already appends "· Brote" via its title template.
export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: `Términos y Condiciones de uso de ${BRAND.name}.`,
};

const UPDATED = '12 de agosto de 2026';

export default function TerminosPage() {
  return (
    <article>
      <LegalTitle
        title="Términos y Condiciones"
        updated={UPDATED}
        intro={`Estos Términos regulan el acceso y uso de ${BRAND.name}, una aplicación que propone acciones ambientales cotidianas y registra el progreso de cada persona usuaria. Al crear una cuenta o utilizar el servicio, aceptás estos Términos en su totalidad.`}
      />

      <PlainSummary>
        <p>
          Usás {BRAND.name} gratis. Registrás acciones ambientales por tu cuenta y de buena fe: nosotros no las
          verificamos, así que los puntos y el impacto son estimaciones, no certificados.
        </p>
        <p>
          Sos responsable de tu seguridad al hacer cualquier actividad. Podés borrar tu cuenta cuando quieras y tus
          datos se eliminan. Si tenés menos de 13 años necesitás autorización de una persona adulta responsable.
        </p>
      </PlainSummary>

      <Section n="1" title="Aceptación de los Términos">
        <p>
          Al registrarte, acceder o utilizar {BRAND.name} (en adelante, la «Aplicación» o el «Servicio») declarás haber
          leído, comprendido y aceptado estos Términos y Condiciones, así como la{' '}
          <Link href="/legal/privacidad">Política de Privacidad</Link>, que forma parte integrante de este acuerdo.
        </p>
        <p>
          Si no estás de acuerdo con alguna de estas disposiciones, debés abstenerte de utilizar el Servicio.
        </p>
      </Section>

      <Section n="2" title="Descripción del Servicio">
        <p>
          {BRAND.name} es una plataforma digital de carácter educativo y motivacional que propone acciones vinculadas al
          cuidado del ambiente, permite registrar su cumplimiento, otorga puntos y rangos de progreso, y estima el
          impacto ambiental asociado a dichas acciones.
        </p>
        <p>
          El Servicio se ofrece «tal cual» y puede modificarse, ampliarse o discontinuarse total o parcialmente. Nos
          reservamos el derecho de incorporar, modificar o retirar funcionalidades, contenidos y acciones propuestas.
        </p>
      </Section>

      <Section n="3" title="Registro, cuenta y edad mínima">
        <Bullets
          items={[
            'Para utilizar el Servicio debés crear una cuenta mediante correo electrónico o un proveedor de identidad externo (por ejemplo, Google).',
            'Te comprometés a brindar información veraz y a mantenerla actualizada.',
            'Sos responsable de la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta.',
            'Las cuentas identificadas como infantiles (menores de 13 años) requieren la autorización y supervisión de una persona adulta responsable, cuentan con contenidos y acciones adaptados, y no reciben publicidad ni pueden contratar suscripciones.',
            'Podemos suspender o cancelar cuentas que incumplan estos Términos, que registren actividad fraudulenta o que comprometan la seguridad de otras personas usuarias.',
          ]}
        />
      </Section>

      <Section n="4" title="Naturaleza de los puntos, rangos y métricas de impacto">
        <p>
          El registro de acciones se realiza mediante autodeclaración de la persona usuaria. {BRAND.name}{' '}
          <strong>no verifica ni audita</strong> la realización efectiva de las acciones informadas.
        </p>
        <p>
          En consecuencia, los puntos, rangos, insignias, posiciones en tablas y métricas de impacto ambiental
          constituyen <strong>estimaciones orientativas de carácter educativo</strong>, calculadas a partir de factores
          de referencia publicados por organismos y publicaciones especializadas. No constituyen mediciones
          certificadas, compensaciones de carbono, créditos ambientales, ni pueden invocarse con fines regulatorios,
          contables, comerciales o de reporte corporativo.
        </p>
        <p>
          Los puntos carecen de valor monetario, no son transferibles ni canjeables por dinero, y pueden ajustarse o
          reiniciarse cuando resulte necesario para preservar la integridad del sistema.
        </p>
      </Section>

      <Section n="5" title="Conducta de la persona usuaria">
        <p>Al utilizar el Servicio te comprometés a no:</p>
        <Bullets
          items={[
            'Registrar acciones que no hayas realizado o manipular el sistema de puntuación por cualquier medio, incluidos scripts, automatizaciones o cuentas múltiples.',
            'Publicar contenidos ilícitos, difamatorios, discriminatorios, violentos, engañosos o que vulneren derechos de terceros.',
            'Suplantar la identidad de otra persona u organización.',
            'Vulnerar, sondear o intentar acceder sin autorización a la infraestructura del Servicio o a cuentas ajenas.',
            'Utilizar el Servicio con fines comerciales no autorizados, ni extraer datos de forma masiva o automatizada.',
          ]}
        />
      </Section>

      <Section n="6" title="Seguridad en la realización de actividades">
        <p>
          Las acciones propuestas por {BRAND.name} son sugerencias de carácter general. La decisión de realizarlas es
          exclusivamente tuya y bajo tu propia responsabilidad.
        </p>
        <p>
          Debés evaluar tus condiciones físicas, el entorno, las condiciones climáticas y la normativa local aplicable
          antes de llevar adelante cualquier actividad, en especial aquellas que se desarrollen en espacios públicos,
          en la vía pública, en entornos naturales o en contacto con residuos, animales o cursos de agua. Las personas
          menores de edad deben contar con supervisión adulta.
        </p>
        <p>
          {BRAND.name} no será responsable por daños personales, materiales o a terceros derivados de la realización de
          las actividades propuestas.
        </p>
      </Section>

      <Section n="7" title="Contenido de terceros y novedades">
        <p>
          La Aplicación muestra titulares, resúmenes y enlaces a contenidos periodísticos y de divulgación producidos
          por terceros. Dichos contenidos pertenecen a sus respectivos titulares; {BRAND.name} no los produce, no
          garantiza su exactitud ni asume responsabilidad por ellos, y se limita a facilitar el acceso a la fuente
          original.
        </p>
        <p>
          Si sos titular de derechos y considerás que un contenido fue utilizado indebidamente, escribinos a{' '}
          <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a> y procederemos a su revisión.
        </p>
      </Section>

      <Section n="8" title="Suscripciones y pagos">
        <p>
          El Servicio ofrece una modalidad gratuita y una suscripción paga opcional («{BRAND.name}+»), que habilita
          funcionalidades adicionales y elimina la publicidad.
        </p>
        <Bullets
          items={[
            'Los pagos se procesan a través de un proveedor externo de medios de pago. No almacenamos datos de tarjetas ni credenciales bancarias.',
            'La suscripción se renueva automáticamente por períodos mensuales hasta su cancelación.',
            'Podés cancelar en cualquier momento; la cancelación surte efecto al finalizar el período ya abonado, conservando el acceso hasta esa fecha.',
            'Los precios pueden modificarse, notificándolo con antelación razonable. Las modificaciones no afectan períodos ya abonados.',
            'Las funcionalidades esenciales del Servicio permanecen disponibles en la modalidad gratuita.',
          ]}
        />
      </Section>

      <Section n="9" title="Publicidad">
        <p>
          La modalidad gratuita puede incluir espacios publicitarios provistos por redes de terceros. La publicidad se
          identifica como tal y no se muestra a cuentas infantiles ni a personas suscriptas a {BRAND.name}+. Podés
          gestionar la personalización de anuncios desde la Aplicación, conforme se detalla en la{' '}
          <Link href="/legal/privacidad">Política de Privacidad</Link>.
        </p>
      </Section>

      <Section n="10" title="Propiedad intelectual">
        <p>
          El software, la marca, el diseño, los textos, las ilustraciones y el personaje {BRAND.mascot} son titularidad
          de {BRAND.name} o de sus licenciantes, y se encuentran protegidos por la normativa de propiedad intelectual
          aplicable. No se cede ningún derecho sobre ellos más allá de la licencia de uso personal, limitada, revocable
          y no transferible necesaria para utilizar el Servicio.
        </p>
        <p>
          Conservás la titularidad de los contenidos que publiques, otorgando a {BRAND.name} una licencia gratuita y no
          exclusiva para alojarlos y mostrarlos dentro del Servicio con la finalidad de operarlo.
        </p>
      </Section>

      <Section n="11" title="Disponibilidad y limitación de responsabilidad">
        <p>
          El Servicio se presta sin garantía de disponibilidad ininterrumpida ni de ausencia de errores. Pueden
          producirse interrupciones por mantenimiento, fallas técnicas o causas ajenas a nuestro control.
        </p>
        <p>
          En la máxima medida permitida por la legislación aplicable, {BRAND.name} no responderá por daños indirectos,
          lucro cesante, pérdida de datos o pérdida de oportunidades derivados del uso o de la imposibilidad de uso del
          Servicio. Nada de lo dispuesto limita los derechos que la normativa de defensa del consumidor reconoce de
          modo irrenunciable.
        </p>
      </Section>

      <Section n="12" title="Baja de la cuenta">
        <p>
          Podés eliminar tu cuenta en cualquier momento desde los ajustes de la Aplicación. La eliminación implica la
          supresión de tu perfil y de los datos asociados, conforme a lo previsto en la{' '}
          <Link href="/legal/privacidad">Política de Privacidad</Link>, sin perjuicio de la conservación de aquella
          información que debamos mantener por obligación legal.
        </p>
      </Section>

      <Section n="13" title="Modificaciones de los Términos">
        <p>
          Podemos actualizar estos Términos para reflejar cambios en el Servicio o en la normativa aplicable. Los
          cambios sustanciales se notificarán dentro de la Aplicación con antelación razonable. El uso continuado del
          Servicio tras la entrada en vigencia implica su aceptación.
        </p>
      </Section>

      <Section n="14" title="Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República Argentina. Para toda controversia serán competentes los
          tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, sin perjuicio del fuero que corresponda de modo
          irrenunciable a las personas consumidoras conforme a la Ley 24.240 de Defensa del Consumidor.
        </p>
      </Section>

      <Section n="15" title="Contacto">
        <p>
          Ante cualquier consulta sobre estos Términos podés escribirnos a{' '}
          <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
        </p>
      </Section>
    </article>
  );
}
