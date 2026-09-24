import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Heart,
  Leaf,
  MessageCircle,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { LIMITES } from '@/lib/negocio/plan';

export const metadata: Metadata = {
  title: 'Vendé en Brote',
  description:
    'Abrí tu tienda en el Mercado de Brote: personas que buscan comprarle a quien lo hace bien te encuentran y te escriben por WhatsApp, Instagram o tu sitio. USD 5 por mes.',
  openGraph: {
    title: 'Vendé en Brote',
    description: 'Un mercado para quienes hacen las cosas bien. USD 5 por mes, sin comisiones.',
  },
};

const PASOS = [
  {
    icono: Store,
    titulo: 'Tu tienda',
    texto: 'Nombre, qué vendés, dónde estás y por dónde te contactan: WhatsApp, Instagram o tu sitio. Dos minutos.',
  },
  {
    icono: Camera,
    titulo: 'Tu compromiso',
    texto: 'Elegís al menos dos prácticas concretas que ya hacés —recibir envases, producir a pedido, enviar sin plástico— y subís una foto que muestre una.',
  },
  {
    icono: Leaf,
    titulo: 'La prueba verde',
    texto: 'Cinco preguntas sobre cómo hablar de ambiente sin exagerar. Si te equivocás, te explicamos por qué. Son las reglas del Mercado.',
  },
  {
    icono: BadgeCheck,
    titulo: 'Mercado Pago',
    texto: 'Vinculás tu cuenta —así confirmamos que sos una persona o empresa real de Argentina— y recién ahí te suscribís.',
  },
];

const INCLUYE = [
  { icono: Store, texto: `Hasta ${LIMITES.vendedor.listados} productos publicados a la vez, con 8 fotos cada uno.` },
  { icono: MessageCircle, texto: 'Te escriben directo por WhatsApp, con el producto en el mensaje. Sin comisiones: la venta es tuya.' },
  { icono: Search, texto: 'Búsqueda, categorías y estantes que muestran tus productos a quien le interesan.' },
  { icono: Heart, texto: 'La gente guarda tus productos y sigue tu tienda: se entera cuando bajás un precio o publicás algo.' },
  { icono: MessageCircleQuestion, texto: 'Preguntas públicas: respondés una vez y le sirve a la próxima persona.' },
  { icono: ShieldCheck, texto: 'Tu compromiso a la vista, con fotos, y las afirmaciones de cada producto con su nivel de evidencia.' },
];

const PREGUNTAS = [
  {
    p: '¿Brote se queda con una parte de la venta?',
    r: 'No. Brote no vende, no cobra y no intermedia: la persona te escribe y la compra la arreglan entre ustedes, como siempre. Lo único que pagás es la suscripción.',
  },
  {
    p: '¿Necesito CUIT o un sitio web?',
    r: 'No. Podés vender como persona o emprendimiento. Si sos empresa, podés cargar tu CUIT y razón social. Con WhatsApp o Instagram alcanza para que te contacten.',
  },
  {
    p: '¿Cuánto sale en pesos?',
    r: 'USD 5 por mes, cobrados en pesos al dólar oficial del día en que te suscribís. Si el dólar se mueve más de 10%, el monto del mes siguiente se ajusta y te avisamos antes.',
  },
  {
    p: '¿Qué pasa si publico algo falso?',
    r: 'Cualquier persona puede reportarlo. Con dos reportes de personas distintas, el producto sale del Mercado hasta que lo revisamos, y vos tenés 7 días para dar tu descargo.',
  },
  {
    p: '¿Puedo darme de baja?',
    r: 'Cuando quieras, desde tu panel. Tus productos salen del Mercado y no se borra nada: si volvés, está todo donde lo dejaste.',
  },
];

/**
 * `/vender` — la invitación a abrir una tienda. Pública (se manda por
 * WhatsApp), corta y honesta: qué es, cuánto sale, cómo se abre, qué se
 * compromete. El botón lleva al alta, que pide entrar a Brote primero.
 */
export default function VenderPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5">
          <Link href="/" className="font-display text-small font-bold">
            {BRAND.name}
          </Link>
          <Link href="/auth/login?next=/negocio/alta" className="ml-auto text-small text-muted-foreground transition-colors hover:text-foreground">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 pb-24">
        <span className="eyebrow text-primary">Mercado de {BRAND.name}</span>
        <h1 className="mt-2 text-balance bg-brand-gradient bg-clip-text font-display text-hero font-extrabold leading-[1.05] text-transparent">
          Vendé lo que hacés bien
        </h1>
        <p className="mt-4 max-w-prose text-body leading-relaxed text-muted-foreground">
          En el Mercado de {BRAND.name} compran personas que ya hacen algo por el ambiente todos los días. Buscan a quien
          produce distinto, y te escriben por WhatsApp, Instagram o tu sitio. Vos vendés como siempre, sin comisiones.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href="/negocio/alta"
            className="press inline-flex items-center gap-2 rounded-pill bg-primary px-6 py-3.5 text-body font-semibold text-primary-foreground shadow-crisp"
          >
            Abrir mi tienda
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-small text-muted-foreground">
            <strong className="font-display text-h3 text-foreground">USD 5</strong> por mes, en pesos al dólar oficial.
          </p>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-h2 font-bold">Cómo se abre una tienda</h2>
          <p className="mt-1 text-small text-muted-foreground">Cuatro pasos cortos. Se guarda todo: podés terminar otro día.</p>
          <ol className="mt-5 space-y-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="flex gap-4 rounded-card border border-border bg-surface p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <p.icono className="h-5 w-5 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block text-body font-semibold">
                    {i + 1}. {p.titulo}
                  </span>
                  <span className="mt-0.5 block text-small leading-relaxed text-muted-foreground">{p.texto}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-h2 font-bold">Qué incluye</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {INCLUYE.map((x) => (
              <li key={x.texto} className="flex gap-3 text-small leading-relaxed">
                <x.icono className="mt-0.5 h-5 w-5 shrink-0 text-brote-green" />
                {x.texto}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 rounded-card bg-brote-ink p-6 text-brote-cream">
          <h2 className="font-display text-h2 font-bold">Por qué pedimos un compromiso</h2>
          <p className="mt-2 text-small leading-relaxed text-brote-cream/80">
            Quien compra en {BRAND.name} quiere saber a quién le compra. Por eso cada tienda cuenta qué hace, lo muestra con
            una foto, y nuestro equipo la revisa. Y nada de «100% ecológico» ni «cura todo»: en el Mercado, cada afirmación
            ambiental de un producto lleva su nivel de evidencia, y las exageraciones no se publican.
          </p>
          <Link href="/legal/niveles" className="mt-4 inline-flex items-center gap-1 text-small font-semibold text-brote-green">
            <span className="link-underline">Cómo funcionan los niveles</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-h2 font-bold">Preguntas frecuentes</h2>
          <div className="mt-4 divide-y divide-hairline border-y border-hairline">
            {PREGUNTAS.map((q) => (
              <details key={q.p} className="group py-4">
                <summary className="cursor-pointer list-none text-body font-semibold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    {q.p}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-small leading-relaxed text-muted-foreground">{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-col items-start gap-3">
          <Link
            href="/negocio/alta"
            className="press inline-flex items-center gap-2 rounded-pill bg-primary px-6 py-3.5 text-body font-semibold text-primary-foreground shadow-crisp"
          >
            Abrir mi tienda
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-caption text-muted-foreground">
            Al abrir tu tienda aceptás los{' '}
            <Link href="/legal/negocios" className="link-underline">
              términos para tiendas
            </Link>
            . Hace falta una cuenta de {BRAND.name} de una persona mayor de edad.
          </p>
        </div>
      </main>
    </div>
  );
}
