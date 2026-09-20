import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, LineChart, Store, Target } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { LIMITES } from '@/lib/negocio/plan';

export const metadata: Metadata = {
  title: 'Brote para negocios',
  description:
    'Un programa de mejora ambiental con objetivos reales, seguimiento y evidencia. Y una vidriera donde cada afirmación muestra con qué está respaldada.',
};

/**
 * `/negocios` — la página pública del programa (fase 5 §8.2).
 *
 * El orden de la conversación es el de 09_MONETIZACION.md §1, y no es un
 * detalle de copy: **se cuenta Mejora primero y el Mercado después**. El
 * programa de objetivos entrega valor el día uno, sin que exista tráfico;
 * vender el Mercado primero sería prometer lo que todavía no se puede
 * entregar.
 *
 * Es pública (sin cuenta) porque es lo que se manda por WhatsApp a una PyME
 * antes de que exista cualquier relación.
 */
export default function NegociosPage() {
  const asunto = encodeURIComponent('Quiero sumar mi negocio a Brote');
  const cuerpo = encodeURIComponent(
    [
      'Hola, me interesa sumar mi negocio al programa.',
      '',
      'Nombre del negocio:',
      'Rubro:',
      'Ciudad:',
      'Sitio web o Instagram:',
      '¿Qué te gustaría mejorar primero?:',
      '',
    ].join('\n'),
  );
  const mailto = `mailto:${BRAND.contactEmail}?subject=${asunto}&body=${cuerpo}`;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5">
          <span className="font-display text-small font-bold">{BRAND.name}</span>
          <Link href="/auth/login" className="ml-auto text-small text-muted-foreground transition-colors hover:text-foreground">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 pb-24">
        <span className="eyebrow text-primary">Para negocios</span>
        <h1 className="mt-2 text-balance font-display text-display-l font-extrabold leading-tight">
          Un programa de mejora ambiental, con números y evidencia
        </h1>
        <p className="mt-4 max-w-prose text-body leading-relaxed text-muted-foreground">
          {BRAND.name} le propone a tu negocio objetivos ambientales concretos —con su número, su forma de medirlo y su
          evidencia—, te acompaña a cerrarlos, y después muestra lo que hacés en una vidriera donde cada afirmación
          dice con qué está respaldada.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={mailto}
            className="press inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-3 text-body font-semibold text-primary-foreground shadow-crisp"
          >
            Quiero sumar mi negocio
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/legal/niveles"
            className="press inline-flex items-center gap-2 rounded-pill border border-border px-5 py-3 text-body font-medium"
          >
            Cómo funcionan los niveles
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-h2 font-bold">Qué recibís el primer día</h2>
          <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
            Todo esto existe antes de que una sola persona entre a ver tus productos.
          </p>
          <ul className="mt-5 space-y-5">
            <Punto
              icono={Target}
              titulo="Un plan de mejora con números reales"
              cuerpo="De 3 a 5 objetivos de mediano plazo, adaptados a tu rubro y a lo que podés hacer, anclados en el estándar internacional para PyMEs. Si un objetivo no cierra, lo decís y se replanifica: se estira el plazo antes que bajar la meta."
            />
            <Punto
              icono={BadgeCheck}
              titulo="Seguimiento con evidencia"
              cuerpo="Cada cierre queda con su evidencia revisada y su historial de versiones. Es exactamente el documento que te piden cuando un cliente grande o una licitación pregunta qué hacen ustedes en sostenibilidad."
            />
            <Punto
              icono={Store}
              titulo="Una ficha pública con nivel de evidencia"
              cuerpo="Tus productos en un catálogo curado. Cada afirmación —orgánico, reciclable, a granel— lleva su propio nivel según la documentación que presentaste. El nivel es de la afirmación, nunca del producto entero."
            />
            <Punto
              icono={LineChart}
              titulo="El derecho a contarlo"
              cuerpo="Un sello para tu sitio que se actualiza solo, placas para redes y el texto para anunciarlo. Y una analítica honesta: te decimos cuántas personas salieron hacia tu sitio, y también que lo que pasa después no lo vemos."
            />
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-h2 font-bold">Cómo se entra</h2>
          <ol className="mt-4 space-y-3 text-body leading-relaxed">
            <Paso n={1} texto="Nos escribís y charlamos. En esta etapa damos de alta a las empresas a mano, de a una." />
            <Paso n={2} texto="Cargás tu negocio en cinco pasos y verificás que el sitio es tuyo (una etiqueta, un registro DNS o un archivo)." />
            <Paso n={3} texto="Lo revisamos a mano. Si falta algo, te decimos qué." />
            <Paso n={4} texto="Completás el dossier y recibís tus objetivos. Publicás tus primeros listados." />
          </ol>
        </section>

        <section className="mt-12 rounded-card border border-brote-sun/40 bg-brote-sun/10 p-5">
          <h2 className="font-display text-h3 font-bold">Las primeras 30</h2>
          <p className="mt-1.5 text-small leading-relaxed">
            Las primeras 30 empresas aprobadas son <strong>fundadoras</strong>: precio bloqueado por 12 meses, insignia
            permanente en su ficha y acceso al plan Raíz al precio de Semilla durante 6 meses. No es generosidad: son
            las que hacen que el catálogo exista, y corren más riesgo que quien llegue cuando ya haya tráfico.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-h2 font-bold">Los planes</h2>
          <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
            Lo que cambia entre planes es capacidad y conveniencia. <strong>Nunca</strong> el nivel de evidencia ni la
            posición en el catálogo: eso no se compra.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-small">
              <caption className="sr-only">Comparación de los planes del programa de empresas</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="pb-2 font-semibold">Qué incluye</th>
                  <th scope="col" className="pb-2 text-right font-semibold">Semilla</th>
                  <th scope="col" className="pb-2 text-right font-semibold">Raíz</th>
                  <th scope="col" className="pb-2 text-right font-semibold">Bosque</th>
                </tr>
              </thead>
              <tbody>
                <Fila etiqueta="Listados publicados" valores={[LIMITES.semilla.listados, LIMITES.raiz.listados, 'Sin tope']} />
                <Fila etiqueta="Objetivos activos" valores={[LIMITES.semilla.objetivos, LIMITES.raiz.objetivos, LIMITES.bosque.objetivos]} />
                <Fila etiqueta="Personas en el equipo" valores={[LIMITES.semilla.miembros, LIMITES.raiz.miembros, LIMITES.bosque.miembros]} />
                <Fila etiqueta="Analítica" valores={['Básica', 'Completa', 'Completa']} />
                <Fila etiqueta="Historial público de mejora" valores={['—', 'Sí', 'Sí']} />
                <Fila etiqueta="Kit de marca" valores={['Sí', 'Sí', 'Sí']} />
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-caption leading-relaxed text-muted-foreground">
            La prueba es de 14 días y no pide tarjeta. Si algún día dejás de pagar, tus listados salen del Mercado y el
            programa queda en modo lectura: <strong>no se borra nada</strong>.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-h2 font-bold">Lo que no hacemos</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-body leading-relaxed marker:text-primary">
            <li>No vendemos tus productos ni cobramos por vos: cada listado lleva a tu sitio.</li>
            <li>No certificamos nada. Revisamos documentación y mostramos qué nivel tiene cada afirmación.</li>
            <li>No vendemos posición: el plan no entra en el orden del catálogo.</li>
            <li>No publicamos tu dossier. Nunca, ni agregado ni anonimizado.</li>
            <li>No prometemos ventas. Medimos hasta que alguien sale de Brote, y lo decimos así.</li>
          </ul>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-display text-h2 font-bold">¿Empezamos?</h2>
          <p className="mt-1.5 max-w-prose text-body leading-relaxed text-muted-foreground">
            Escribinos con el nombre de tu negocio, tu rubro y qué te gustaría mejorar primero. Contestamos con los
            próximos pasos.
          </p>
          <a
            href={mailto}
            className="press mt-4 inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-3 text-body font-semibold text-primary-foreground shadow-crisp"
          >
            Escribir a {BRAND.contactEmail}
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-5 gap-y-2 px-5 py-6 text-caption text-muted-foreground">
          <Link href="/legal/negocios" className="hover:text-foreground">Términos para empresas</Link>
          <Link href="/legal/privacidad" className="hover:text-foreground">Privacidad</Link>
          <Link href="/legal/niveles" className="hover:text-foreground">Los niveles</Link>
          <span className="ml-auto">{BRAND.name}</span>
        </div>
      </footer>
    </div>
  );
}

function Punto({ icono: Icono, titulo, cuerpo }: { icono: typeof Target; titulo: string; cuerpo: string }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/15 text-primary">
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-h3 font-bold">{titulo}</h3>
        <p className="mt-1 text-body leading-relaxed text-muted-foreground">{cuerpo}</p>
      </div>
    </li>
  );
}

function Paso({ n, texto }: { n: number; texto: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-small font-bold text-primary tnum">
        {n}
      </span>
      <span>{texto}</span>
    </li>
  );
}

function Fila({ etiqueta, valores }: { etiqueta: string; valores: (string | number)[] }) {
  return (
    <tr className="border-b border-hairline last:border-0">
      <th scope="row" className="py-2.5 pr-3 text-left font-normal">{etiqueta}</th>
      {valores.map((v, i) => (
        <td key={i} className="py-2.5 text-right tnum">{v}</td>
      ))}
    </tr>
  );
}
