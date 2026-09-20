'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { CatalogoMercado } from '@/components/mercado/CatalogoMercado';
import { FichaListado } from '@/components/mercado/FichaListado';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { FranjaAnalitica } from '@/components/negocio/analitica/FranjaAnalitica';
import { SerieSalidas } from '@/components/negocio/analitica/SerieSalidas';
import { PlanNegocio } from '@/components/negocio/plan/PlanNegocio';
import { KitDeMarca } from '@/components/negocio/KitDeMarca';
import { svgSello } from '@/lib/negocio/sello';
import { LIMITES, type EstadoPlan } from '@/lib/negocio/plan';
import { sugerencias, type DatosSugerencias } from '@/lib/negocio/sugerencias';
import { cn } from '@/lib/utils/cn';
import type { AfirmacionPublica, FichaMercado, TarjetaMercado } from '@/lib/supabase/rows-mercado';

/**
 * Demostración de Negocios con DATOS DE EJEMPLO, sin cuenta y sin base.
 *
 * Existe por un motivo concreto: hasta que haya una empresa aprobada de
 * verdad, el Mercado está vacío y las pantallas de la empresa piden sesión,
 * así que no hay forma de mirar lo construido en producción. Esto la da, con
 * los componentes REALES —los mismos que usan las pantallas de verdad— y un
 * cartel que dice, en todas las vistas, que los negocios de acá no existen.
 *
 * Vive en `/offline` como `mundo-preview`, que es la puerta pública del repo
 * para este tipo de revisión.
 */

const VISTAS = [
  ['catalogo', 'Catálogo'],
  ['ficha', 'Una ficha'],
  ['puente', 'Dónde conseguirlo'],
  ['analitica', 'Analítica'],
  ['plan', 'Planes'],
  ['kit', 'Kit de marca'],
] as const;

const NEG: TarjetaMercado['negocio'] = {
  id: 'n1',
  slug: 'molino-del-valle',
  nombre: 'Molino del Valle (ejemplo)',
  logo: null,
  tier: 'e3',
  provincia: 'Buenos Aires',
  ciudad: 'Tandil',
};
const OTRO: TarjetaMercado['negocio'] = { ...NEG, id: 'n2', slug: 'jabones-del-sur', nombre: 'Jabonería del Sur (ejemplo)', tier: 'e1' };
const TOSTA: TarjetaMercado['negocio'] = { ...NEG, id: 'n3', slug: 'tostadero', nombre: 'Tostadero Norte (ejemplo)', tier: 'e2' };

function tarjeta(
  i: number,
  titulo: string,
  tier: TarjetaMercado['tier'],
  precio: number | null,
  negocio = NEG,
  categoria = 'alimentos-frescos',
): TarjetaMercado {
  return {
    id: `t${i}`,
    slug: `x${i}`,
    titulo,
    tipo: 'producto',
    imagen: null,
    categoria,
    dominios: ['alimentacion'],
    precio,
    moneda: 'ARS',
    tier,
    score: 60 - i,
    disponibilidad: 'online',
    zonas: [],
    tiene_precio: precio !== null,
    descripcion_largo: 300,
    updated_at: '2026-09-10T00:00:00Z',
    negocio,
  };
}

const TARJETAS: TarjetaMercado[] = [
  tarjeta(1, 'Harina orgánica de trigo, 1 kg', 'e3', 4200),
  tarjeta(2, 'Jabón sólido de glicerina y avena', 'e1', 2800, OTRO, 'cuidado-personal'),
  tarjeta(3, 'Café de especialidad, grano, 500 g', 'e2', 9500, TOSTA),
  tarjeta(4, 'Harina integral de centeno, 1 kg', 'e3', 4600),
  tarjeta(5, 'Shampoo sólido recargable', 'e1', 3900, OTRO, 'cuidado-personal'),
  tarjeta(6, 'Yerba mate de cooperativa, 1 kg', 'e2', 5200, TOSTA),
  tarjeta(7, 'Pan de masa madre, entero', 'e1', null),
  tarjeta(8, 'Detergente concentrado a granel, 1 l', 'e2', 3100, OTRO, 'limpieza-hogar'),
];

const AFIRMACIONES: AfirmacionPublica[] = [
  {
    id: 'c1',
    kind: 'organico',
    alcance: 'Trigo',
    datos: {},
    tier: 'e3',
    cert_numero: '12345',
    cert_vence: '2027-03-31',
    cert: { nombre: 'Certificación orgánica OIA', emisor: 'Organización Internacional Agropecuaria S.A.' },
  },
  {
    id: 'c2',
    kind: 'reciclable',
    alcance: 'Envase',
    datos: { material: 'papel kraft', disponibilidad: 'recoleccion_diferenciada_amplia' },
    tier: 'e1',
    cert_numero: null,
    cert_vence: null,
    cert: null,
  },
];

const FICHA: FichaMercado = {
  ...TARJETAS[0]!,
  descripcion:
    'Harina de trigo molida en piedra en nuestro molino de Tandil, con trigo de productores de la zona. Bolsa de papel kraft de 1 kg.',
  imagenes: [],
  status: 'publicado',
  vista_previa: false,
  dominio_destino: 'molinodelvalle.com.ar',
  publicado_at: '2026-09-01T00:00:00Z',
  negocio: { ...NEG, verificacion: 'fuerte', nota_correccion: null },
  ya_reportado: false,
  afirmaciones: AFIRMACIONES,
};

const PUENTE: TarjetaMercado[] = [
  tarjeta(11, 'Yerba mate a granel, 1 kg', 'e3', 5200, TOSTA, 'almacen-granel'),
  tarjeta(12, 'Detergente concentrado, recarga 1 l', 'e2', 3100, OTRO, 'almacen-granel'),
  tarjeta(13, 'Jabón en barra de aceite reciclado', 'e1', 1800, OTRO, 'almacen-granel'),
];

const ESTADO: EstadoPlan = {
  cobro_activo: true,
  plan: 'semilla',
  limites: LIMITES.semilla,
  uso: { listados: 3, objetivos: 2, miembros: 1, replanificaciones: 1 },
  escritura: true,
  fundador: true,
  prueba_fin: new Date(Date.now() + 5 * 86_400_000).toISOString(),
  en_prueba: true,
  rol: 'owner',
  suscripcion: null,
  precios: { semilla: 9900, raiz: 24900, bosque: 59900, moneda: 'ARS' },
};

const SERIE = Array.from({ length: 30 }, (_, i) => ({
  dia: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
  impresiones: Math.round(40 + 30 * Math.sin(i / 3) + i * 2),
  salidas: Math.round(2 + 2 * Math.sin(i / 2) + i / 6),
}));

const DATOS: DatosSugerencias = {
  progreso: 24,
  verificacion_fuerte: true,
  listados: [
    { id: 'l1', titulo: 'Harina orgánica de trigo, 1 kg', status: 'publicado', tier: 'e3', score: 65, imagenes: 1, descripcion: 420, afirmaciones: 2 },
  ],
  afirmaciones: [
    { id: 'c1', kind: 'contenido_reciclado', alcance: 'Envase', tier: 'e1', status: 'aprobada', evidencia: true, cert_slug: null, cert_vence: null, listados: 2 },
    { id: 'c2', kind: 'organico', alcance: 'Harina', tier: 'e3', status: 'aprobada', evidencia: true, cert_slug: 'oia', cert_vence: new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10), listados: 1 },
  ],
  objetivos: [
    { id: 'g1', titulo: 'Bajar 8% el consumo de energía', dominio: 'energia', ambicion: 'intermedio', status: 'activo', vence_at: new Date(Date.now() + 6 * 86_400_000).toISOString(), es_publico: false },
  ],
  ciclos: [{ status: 'logrado', ambicion: 'basico', cerrado_at: '2026-04-01T00:00:00Z' }],
};

function Vista() {
  const params = useSearchParams();
  const v = params.get('v') ?? 'catalogo';
  const pasos = sugerencias(DATOS);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <span className="eyebrow text-muted-foreground">Brote · Negocios</span>
        <h1 className="mt-1 font-display text-h1 font-bold">Demostración</h1>
        <p className="mt-1.5 max-w-prose text-small leading-relaxed text-muted-foreground">
          Las pantallas reales con <strong>datos de ejemplo</strong>. Los negocios, los productos y los números de
          esta página <strong>no existen</strong>: están para poder mirar cómo quedó, sin cuenta y sin esperar a que
          haya comercios publicando.
        </p>
        <nav className="mt-4 flex flex-wrap gap-1.5">
          {VISTAS.map(([clave, etiqueta]) => (
            <Link
              key={clave}
              href={`/offline/negocios-demo?v=${clave}`}
              className={cn(
                'press rounded-pill border px-3 py-1.5 text-small font-medium transition-colors',
                v === clave
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground',
              )}
            >
              {etiqueta}
            </Link>
          ))}
        </nav>
      </header>

      {v === 'ficha' ? (
        <FichaListado f={FICHA} />
      ) : v === 'plan' ? (
        <PlanNegocio estado={ESTADO} negocioId="demo" />
      ) : v === 'kit' ? (
        <>
          <div className="mb-5 rounded-card border border-border bg-surface p-4">
            <p className="eyebrow mb-2 text-muted-foreground">El sello, como se ve en el sitio de la empresa</p>
            <span dangerouslySetInnerHTML={{ __html: svgSello('Molino del Valle', 'e3') }} />
            <span className="ml-3 inline-block" dangerouslySetInnerHTML={{ __html: svgSello('Jabonería del Sur', 'e1') }} />
          </div>
          <KitDeMarca slug="molino-del-valle" nombre="Molino del Valle" nivel="e3" objetivosCerrados={2} base="https://brote-ft7m.vercel.app" />
        </>
      ) : v === 'puente' ? (
        <section className="max-w-3xl">
          <p className="mb-5 rounded-card border border-hairline bg-surface-2 p-3 text-caption leading-relaxed text-muted-foreground">
            Así se ve el módulo debajo de una acción como &laquo;Comprá algo a granel&raquo;. Nunca aparece en el camino
            de completar la acción, nunca para una cuenta de chico, y solo si hay al menos tres listados que de verdad
            sirvan.
          </p>
          <span className="eyebrow mb-1 block text-muted-foreground">Dónde conseguirlo</span>
          <p className="mb-3 text-small leading-relaxed text-muted-foreground">
            Comprar a granel es fácil cuando sabés dónde. Estos negocios están en el programa de Brote.
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
            {PUENTE.map((t) => (
              <TarjetaListado key={t.id} t={t} origen="accion" />
            ))}
          </div>
          <span className="press mt-3 inline-flex items-center gap-1.5 text-small font-semibold text-primary">
            Ver más en el Mercado
            <ArrowRight className="h-4 w-4" />
          </span>
          <p className="mt-2 text-caption leading-relaxed text-muted-foreground">
            Comprar no suma puntos. Brote no vende ni intermedia: cada listado lleva al sitio del comercio.
          </p>
        </section>
      ) : v === 'analitica' ? (
        <div className="max-w-3xl space-y-7">
          <FranjaAnalitica impresiones={1847} salidas={94} tasa={5.1} reportes={3} dias={30} />
          <section>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-display text-h3 font-bold">Qué te haría subir</h2>
            </div>
            <ul className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
              {pasos.map((s) => (
                <li key={s.clave} className="p-4">
                  <p className="text-small font-semibold leading-snug">{s.texto}</p>
                  <p className="mt-1 text-caption leading-relaxed text-muted-foreground">{s.porque}</p>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display text-h3 font-bold">Día por día</h2>
            <div className="mt-3 rounded-card border border-border bg-surface p-3">
              <SerieSalidas serie={SERIE} />
            </div>
          </section>
          <footer className="rounded-card border border-hairline bg-surface-2 p-4">
            <p className="text-caption leading-relaxed text-muted-foreground">
              Medimos hasta que alguien sale de Brote. Lo que pase después —si compraron, cuánto— pasa en tu sitio y no
              lo vemos.
            </p>
            <p className="mt-2 text-caption leading-relaxed text-muted-foreground">
              Si querés atribuir ventas, agregá ?ref=brote a tu enlace de destino y miralo en tu propia analítica.
            </p>
          </footer>
        </div>
      ) : (
        <CatalogoMercado
          inicial={{ items: TARJETAS, cursor: null }}
          filtros={{ categoria: null, dominio: null, nivel: null, zona: null, modalidad: null, orden: 'recomendados' }}
          esTeen={false}
        />
      )}
    </div>
  );
}

export default function NegociosDemoPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <Vista />
      </Suspense>
    </main>
  );
}
