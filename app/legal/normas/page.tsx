import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { LegalTitle, Section, Bullets, PlainSummary } from '@/components/legal/LegalDoc';

export const metadata: Metadata = {
  title: 'Normas de la comunidad',
  description: `Qué se puede y qué no se puede publicar en La Plaza de ${BRAND.name}.`,
};

const UPDATED = '27 de agosto de 2026';

/**
 * The community rules.
 *
 * Deliberately written the way a person talks, not the way a policy reads: it
 * is linked from the composer and from the report sheet, which are the two
 * moments when somebody actually needs it. The Terms carry the legal weight;
 * this page carries the meaning.
 */
export default function NormasPage() {
  return (
    <article>
      <LegalTitle
        title="Normas de la comunidad"
        updated={UPDATED}
        intro={`La Plaza es la parte de ${BRAND.name} donde la gente cuenta lo que hace, comenta y comparte novedades. Estas son las reglas: pocas, claras, y las mismas para todo el mundo.`}
      />

      <PlainSummary>
        <p>
          Contá lo que hacés, preguntá, sumate a lo de otras personas. No insultes, no acoses, no publiques cosas
          de menores de edad, no hagas spam. Si algo está mal, denuncialo con el ⋯ de la publicación.
        </p>
        <p>
          Lo que publicás es público: aparece con tu nombre y tu Pip, y cualquiera con el enlace puede verlo. Podés
          borrarlo cuando quieras.
        </p>
      </PlainSummary>

      <Section n="1" title="Lo que buscamos">
        <p>
          Que alguien lea lo que publicaste y se le ocurra hacer algo. Una acción que te funcionó, un problema de tu
          barrio, una pregunta genuina, una noticia que te movilizó. Eso es La Plaza.
        </p>
        <p>
          No hace falta que sea impresionante. «Puse un balde en la ducha» es exactamente el tipo de cosa que
          queremos leer.
        </p>
      </Section>

      <Section n="2" title="Lo que no se puede publicar">
        <Bullets
          items={[
            'Insultos, agresiones, hostigamiento o burlas dirigidas a una persona.',
            'Discurso de odio: contenido que ataque a alguien por su origen, género, religión, orientación sexual, discapacidad, nacionalidad o etnia.',
            'Amenazas o incitación a la violencia, contra personas o contra bienes.',
            'Contenido sexual, y cualquier contenido sexual que involucre a menores de edad, sin excepción y sin matices.',
            'Imágenes o datos de otras personas sin su permiso, y en particular de niñas y niños.',
            'Datos personales: direcciones, teléfonos, documentos, tuyos o de terceros.',
            'Desinformación ambiental deliberada, o presentar como hecho algo que sabés que es falso.',
            'Spam, publicidad encubierta, cadenas, estafas y enlaces engañosos.',
            'Suplantar a otra persona, a una organización o a un medio.',
            'Actividades ilegales, incluida la caza, la venta o el tráfico de especies protegidas.',
          ]}
        />
      </Section>

      <Section n="3" title="Edad">
        <p>
          Las cuentas infantiles (menores de 13 años) <strong>no participan de La Plaza</strong>: leen novedades y
          nada más. No publican, no comentan, no reaccionan, no siguen a nadie, no aparecen en búsquedas ni en
          sugerencias, y no se las puede mencionar. Esto no es una preferencia configurable: lo aplica el servidor
          en cada operación.
        </p>
        <p>
          Las cuentas adolescentes (13 a 17) publican solo texto —sin imágenes ni enlaces— y su perfil arranca
          visible únicamente para quienes las siguen.
        </p>
      </Section>

      <Section n="4" title="Qué pasa cuando algo se denuncia">
        <Bullets
          items={[
            'Cualquier persona puede denunciar una publicación desde el menú ⋯. Una sola vez por publicación.',
            'Con tres denuncias distintas en 24 horas, la publicación se oculta automáticamente mientras se revisa. Quien la escribió la sigue viendo en su perfil con el cartel «En revisión»: no desaparece en silencio.',
            'Una persona revisa y decide: se restaura o se saca. En los dos casos queda registrada la decisión.',
            'Si se saca, avisamos a quien la publicó y le decimos por qué.',
            'Tres decisiones sostenidas en 30 días suspenden la posibilidad de publicar durante 7 días. La cuenta sigue funcionando para todo lo demás.',
          ]}
        />
        <p>
          También podés <strong>silenciar</strong> una cuenta (deja de aparecer en tu feed) o{' '}
          <strong>bloquearla</strong> (dejan de verse en las dos direcciones y se dejan de seguir automáticamente).
          Ambas se manejan desde Ajustes → Cuentas bloqueadas y silenciadas.
        </p>
      </Section>

      <Section n="5" title="Si no estás de acuerdo con una decisión">
        <p>
          Escribinos a{' '}
          <a href={`mailto:${BRAND.contactEmail}`} className="text-primary underline underline-offset-2">
            {BRAND.contactEmail}
          </a>{' '}
          con el enlace de la publicación. Guardamos el registro de cada decisión justamente para poder revisarla.
        </p>
      </Section>

      <Section n="6" title="Novedades y derechos de autor">
        <p>
          Las novedades que aparecen en La Plaza son de medios de comunicación. Mostramos el título, un resumen
          corto, el medio y la fecha, y el enlace lleva a la nota original. No reproducimos artículos completos.
        </p>
        <p>
          Si sos titular de un contenido y considerás que no deberíamos mostrarlo, escribinos a{' '}
          <a href={`mailto:${BRAND.contactEmail}`} className="text-primary underline underline-offset-2">
            {BRAND.contactEmail}
          </a>{' '}
          indicando el enlace: lo revisamos y lo retiramos si corresponde.
        </p>
      </Section>

      <Section n="7" title="Dónde sigue esto">
        <p>
          Estas normas son parte de los{' '}
          <Link href="/legal/terminos">Términos y Condiciones</Link>. Cómo tratamos tus datos está en la{' '}
          <Link href="/legal/privacidad">Política de Privacidad</Link>.
        </p>
      </Section>
    </article>
  );
}
