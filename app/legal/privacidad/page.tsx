import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { LegalTitle, Section, Bullets, PlainSummary } from '@/components/legal/LegalDoc';

// The root layout already appends "· Brote" via its title template.
export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: `Cómo ${BRAND.name} trata tus datos personales.`,
};

const UPDATED = '27 de agosto de 2026';

export default function PrivacidadPage() {
  return (
    <article>
      <LegalTitle
        title="Política de Privacidad"
        updated={UPDATED}
        intro={`Esta Política explica qué datos personales recopila ${BRAND.name}, con qué finalidad, con quiénes se comparten y qué derechos podés ejercer sobre ellos. Se rige por la Ley 25.326 de Protección de los Datos Personales de la República Argentina.`}
      />

      <PlainSummary>
        <p>
          Guardamos lo mínimo: tu correo, tu perfil y las acciones que registrás. No vendemos tus datos a nadie.
        </p>
        <p>
          Si tenés cuenta infantil, no mostramos publicidad ni hacemos ningún tipo de perfilado publicitario. Podés
          pedir una copia de tus datos o borrar tu cuenta cuando quieras.
        </p>
      </PlainSummary>

      <Section n="1" title="Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos es el equipo de {BRAND.name}, con domicilio en la República
          Argentina y correo de contacto <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
        </p>
      </Section>

      <Section n="2" title="Datos que recopilamos">
        <p>
          <strong>Datos que nos proporcionás:</strong>
        </p>
        <Bullets
          items={[
            'Dirección de correo electrónico (obligatoria para crear la cuenta).',
            'Nombre visible, nombre de usuario e imagen de perfil, si decidís cargarlos.',
            'Tipo de cuenta (infantil, adolescente o adulta) y, opcionalmente, ciudad o barrio.',
            'Intereses ambientales seleccionados durante la configuración inicial.',
            'Contenidos que publiques: proyectos comunitarios, comentarios y participaciones.',
          ]}
        />
        <p>
          <strong>Datos generados por el uso del Servicio:</strong>
        </p>
        <Bullets
          items={[
            'Acciones registradas, fechas de realización, puntos, rachas, rangos e insignias obtenidas.',
            'Estimaciones de impacto ambiental derivadas de dichas acciones.',
            'Preferencias de la Aplicación, como tema visual, idioma y consentimiento publicitario.',
            'Datos técnicos mínimos necesarios para operar y asegurar el Servicio.',
          ]}
        />
        <p>
          <strong>No recopilamos</strong> datos de geolocalización precisa, ni datos sensibles en el sentido del
          artículo 2 de la Ley 25.326, ni datos de tarjetas o cuentas bancarias.
        </p>
      </Section>

      <Section n="2.b" title="Datos que genera tu actividad en La Plaza">
        <p>
          Al usar la parte social del Servicio se generan, además, estos datos, cada uno en su propia tabla:
        </p>
        <Bullets
          items={[
            'Publicaciones, respuestas y replantes (`feed_posts`): el texto, las imágenes, la fecha y los temas detectados.',
            'A quién seguís y quién te sigue (`follows`).',
            'Tus reacciones (`feed_reactions`) y tus guardados (`feed_saves`). Los guardados son privados y no tienen contador visible.',
            'Qué publicaciones viste (`feed_seen`), únicamente para no repetirte contenido. Se borran a los 7 días.',
            'A quién bloqueaste o silenciaste (`user_blocks`, `user_mutes`). Nunca se le informa a la otra persona.',
            'Las denuncias que presentaste (`content_reports`) y las decisiones de moderación (`moderation_actions`).',
          ]}
        />
        <p>
          Las imágenes que subís se procesan en tu propio dispositivo antes de enviarse: al recomprimirlas se
          eliminan los metadatos EXIF, incluida la ubicación GPS. Esa foto no viaja con las coordenadas de dónde la
          sacaste.
        </p>
      </Section>

      <Section n="3" title="Finalidades y base legal">
        <Bullets
          items={[
            'Prestar el Servicio: crear y gestionar tu cuenta, registrar acciones, calcular puntos y progreso (ejecución del vínculo contractual).',
            'Personalizar la experiencia: proponer acciones y novedades acordes a tus intereses y a tu tipo de cuenta (interés legítimo, revocable desde los ajustes).',
            'Seguridad e integridad: prevenir fraude, abuso y accesos no autorizados (interés legítimo).',
            'Comunicaciones operativas: avisos sobre tu cuenta, tu racha o cambios en el Servicio (ejecución contractual). Las notificaciones son configurables.',
            'Publicidad en la modalidad gratuita, conforme a la sección 5 (consentimiento).',
            'Cumplimiento de obligaciones legales cuando corresponda.',
          ]}
        />
      </Section>

      <Section n="4" title="Cuentas de niñas y niños">
        <p>
          Las cuentas infantiles (menores de 13 años) requieren autorización de una persona adulta responsable y reciben
          un tratamiento reforzado:
        </p>
        <Bullets
          items={[
            'No se muestra publicidad de ningún tipo.',
            'No se realiza perfilado con fines publicitarios ni se comparten datos con redes de anuncios.',
            'No pueden contratar suscripciones ni realizar pagos.',
            'Los contenidos, acciones y novedades se limitan a los adecuados para su edad.',
          ]}
        />
        <p>
          Si detectamos una cuenta infantil creada sin la debida autorización, procederemos a su eliminación. Las
          personas adultas responsables pueden solicitar el acceso, la rectificación o la supresión de los datos
          escribiendo a <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
        </p>
      </Section>

      <Section n="5" title="Publicidad y cookies">
        <p>
          En la modalidad gratuita, y exclusivamente para cuentas de personas mayores de 13 años, mostramos espacios
          publicitarios provistos por redes de terceros. Por defecto la publicidad es{' '}
          <strong>no personalizada</strong>: solo se personaliza si prestás tu consentimiento expreso, y podés
          revocarlo en cualquier momento desde los ajustes de la Aplicación.
        </p>
        <p>
          Las redes publicitarias pueden utilizar cookies o identificadores propios conforme a sus propias políticas.
          Las personas suscriptas a {BRAND.name}+ no reciben publicidad y, en su caso, no se carga la biblioteca
          publicitaria.
        </p>
        <p>
          Utilizamos además cookies estrictamente necesarias para mantener tu sesión iniciada y recordar preferencias
          básicas. Sin ellas el Servicio no puede funcionar.
        </p>
      </Section>

      <Section n="6" title="Con quiénes compartimos datos">
        <p>No vendemos ni cedemos datos personales. Compartimos únicamente lo necesario con:</p>
        <Bullets
          items={[
            'Proveedor de infraestructura y base de datos, que aloja la información por cuenta y orden nuestra.',
            'Proveedor de identidad externo (Google), únicamente si elegís esa modalidad de ingreso.',
            'Proveedor de medios de pago, si contratás una suscripción; recibe únicamente los datos necesarios para procesar el cobro.',
            'Redes publicitarias, en los términos de la sección 5 y nunca respecto de cuentas infantiles.',
            'Autoridades competentes, cuando exista una obligación legal o un requerimiento judicial válido.',
          ]}
        />
        <p>
          Algunos proveedores pueden alojar información fuera de la República Argentina. En tales casos procuramos que
          existan garantías adecuadas conforme a la normativa vigente.
        </p>
      </Section>

      <Section n="7" title="Información pública dentro de la Aplicación">
        <p>
          Tu nombre visible, tu imagen de perfil, tu rango y tus puntos pueden resultar visibles para otras personas
          usuarias en tablas de posiciones, competencias y proyectos comunitarios en los que participes. Tu dirección
          de correo electrónico nunca se muestra públicamente.
        </p>
        <p>
          <strong>Tu perfil público</strong> (en <code>/perfil/tu-usuario</code>) muestra: nombre visible, usuario,{' '}
          {BRAND.mascot}, rango, provincia, biografía, cantidad de seguidores y seguidos, racha, puesto global,
          puntos por tema, títulos e insignias, y tus publicaciones. <strong>Nunca muestra tu barrio</strong> ni tu
          correo, aunque los tengamos cargados.
        </p>
        <p>
          <strong>Tus publicaciones son públicas.</strong> Cada una tiene un enlace permanente que funciona para
          cualquier persona, incluso sin cuenta. La vista previa que se genera al compartir ese enlace incluye tu
          nombre visible y el texto; no se genera para cuentas adolescentes ni para perfiles privados.
        </p>
        <p>
          <strong>Podés cerrar tu perfil.</strong> Las cuentas adolescentes arrancan visibles solo para quienes las
          siguen. Las cuentas infantiles no tienen perfil público en absoluto y no aparecen en búsquedas ni en
          sugerencias.
        </p>
        <p>
          <strong>Lo que nunca es público:</strong> tus guardados, qué publicaciones viste, a quién silenciaste o
          bloqueaste, y las denuncias que hayas presentado. No hay contador visible de ninguna de esas cosas.
        </p>
      </Section>

      <Section n="8" title="Conservación y borrado">
        <p>
          Conservamos tus datos mientras tu cuenta permanezca activa. Las publicaciones que viste
          (<code>feed_seen</code>, usado para no repetirte contenido) se borran automáticamente a los 7 días. Las
          novedades y contenidos de terceros se depuran periódicamente y no se vinculan a personas usuarias
          individuales.
        </p>
        <p>
          <strong>Al eliminar tu cuenta</strong> desde Ajustes se suprimen, de forma inmediata y verificada: tu
          perfil, tus publicaciones y respuestas, tus reacciones, tus guardados, tus impresiones, a quién seguís y
          quién te sigue, tus bloqueos y silencios, y los archivos que hayas subido (fotos de publicaciones, de
          perfil, de proyectos y de verificación).
        </p>
        <p>
          <strong>Qué sobrevive y por qué:</strong> las denuncias que hayas presentado y las decisiones de moderación
          asociadas se conservan <em>sin tu identificador</em>, es decir sin poder vincularse a vos. Es el registro
          que permite revisar una decisión y responder ante una autoridad; conservarlo anonimizado es el equilibrio
          entre tu derecho de supresión y el derecho de otra persona a apelar.
        </p>
      </Section>

      <Section n="9" title="Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables: cifrado en tránsito, control de acceso por fila a nivel
          de base de datos, autenticación gestionada por un proveedor especializado y principio de mínimo privilegio en
          el acceso interno. Ningún sistema es completamente invulnerable; ante un incidente que afecte
          significativamente tus datos, te informaremos y notificaremos a la autoridad de control cuando corresponda.
        </p>
      </Section>

      <Section n="10" title="Tus derechos">
        <p>
          Podés ejercer en cualquier momento los derechos de acceso, rectificación, actualización y supresión de tus
          datos personales, así como retirar los consentimientos prestados. Para hacerlo, utilizá los ajustes de la
          Aplicación o escribinos a <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.
        </p>
        <p>
          Conforme al artículo 14, inciso 3 de la Ley 25.326, el titular de los datos puede ejercer el derecho de acceso
          de forma gratuita a intervalos no inferiores a seis meses, salvo interés legítimo acreditado.
        </p>
        <p>
          La <strong>Agencia de Acceso a la Información Pública</strong>, en su carácter de órgano de control de la Ley
          25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al
          incumplimiento de las normas sobre protección de datos personales.
        </p>
      </Section>

      <Section n="11" title="Cambios en esta Política">
        <p>
          Podemos actualizar esta Política para reflejar cambios en el Servicio o en la normativa aplicable. Los cambios
          sustanciales se notificarán dentro de la Aplicación. La fecha de última actualización figura al inicio de este
          documento.
        </p>
      </Section>

      <Section n="12" title="Contacto">
        <p>
          Para cualquier consulta sobre esta Política o sobre el tratamiento de tus datos, escribinos a{' '}
          <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>. También podés consultar nuestros{' '}
          <Link href="/legal/terminos">Términos y Condiciones</Link>.
        </p>
      </Section>
    </article>
  );
}
