import { CLAIMS, SIN_E2, type ClaimKind, type Nivel } from '../mercado/claims';
import { BASE_CREDIBILIDAD } from '../mercado/ranking';
import { progresoDeCiclos, type CicloCerrado } from '../mejora/progreso';

/**
 * "Qué te haría subir" (fase 4 §3.3): el bloque de la analítica que convierte
 * un reporte en una lista de próximos pasos.
 *
 * Reglas DETERMINISTAS sobre el estado real de la empresa. Tres cosas que no
 * se negocian:
 *
 * 1. **Nada inventado.** Cada sugerencia sale de un dato que existe: una
 *    afirmación que hoy es Nivel 1 y podría ser Nivel 2, un objetivo que vence,
 *    un certificado con fecha, un listado con una sola foto.
 * 2. **Ningún porcentaje inventado.** El documento propone "+18% estimado de
 *    visibilidad". No lo escribimos: el efecto real depende de términos del
 *    puntaje que la empresa no ve, y un número inventado en la pantalla que
 *    decide la renovación es exactamente lo que este producto no hace. Se dice
 *    lo que SÍ es cierto —"el Nivel 2 pesa casi el doble que el Nivel 1"— y se
 *    ordena por impacto real.
 * 3. **Nunca más de 3.** Una lista de doce cosas no es una lista de próximos
 *    pasos.
 */

export interface DatosSugerencias {
  progreso: number | null;
  verificacion_fuerte: boolean;
  listados: {
    id: string;
    titulo: string;
    status: string;
    tier: Nivel;
    score: number | null;
    imagenes: number;
    descripcion: number;
    afirmaciones: number;
  }[];
  afirmaciones: {
    id: string;
    kind: ClaimKind;
    alcance: string;
    tier: Nivel;
    status: string;
    evidencia: boolean;
    cert_slug: string | null;
    cert_vence: string | null;
    listados: number;
  }[];
  objetivos: {
    id: string;
    titulo: string;
    dominio: string | null;
    ambicion: 'basico' | 'intermedio' | 'avanzado';
    status: string;
    vence_at: string | null;
    es_publico: boolean;
  }[];
  ciclos: CicloCerrado[];
}

export interface Sugerencia {
  clave: string;
  /** Lo que hay que hacer, en voseo y en una línea. */
  texto: string;
  /** Por qué mueve la aguja. Siempre verificable. */
  porque: string;
  href: string;
  /** Solo para ordenar. No se muestra. */
  impacto: number;
}

const DIA = 86_400_000;

function dias(desde: Date, hasta: string): number {
  return Math.ceil((new Date(hasta).getTime() - desde.getTime()) / DIA);
}

export function sugerencias(d: DatosSugerencias, hoy: Date = new Date()): Sugerencia[] {
  const out: Sugerencia[] = [];

  // 1. Una afirmación aprobada en Nivel 1 que YA tiene con qué subir a Nivel 2:
  // evidencia cargada y dominio verificado. Es el paso más barato que existe.
  for (const a of d.afirmaciones) {
    if (a.status !== 'aprobada' || a.tier !== 'e1') continue;
    if (SIN_E2.includes(a.kind)) continue;
    const nombre = CLAIMS[a.kind]?.nombre ?? a.kind;
    const listo = a.evidencia && d.verificacion_fuerte;
    const salto = (BASE_CREDIBILIDAD.e2 - BASE_CREDIBILIDAD.e1) * Math.max(1, a.listados);
    out.push({
      clave: `nivel2:${a.id}`,
      texto: listo
        ? `Pedí que revisemos "${nombre} · ${a.alcance}": ya tenés el documento y el dominio verificado.`
        : a.evidencia
          ? `Verificá tu dominio para que "${nombre} · ${a.alcance}" pase a Nivel 2.`
          : `Subí el documento de respaldo de "${nombre} · ${a.alcance}" para que pase a Nivel 2.`,
      porque: 'Cuando ordenamos el catálogo, el Nivel 2 pesa casi el doble que el Nivel 1.',
      href: '/negocio/listados',
      impacto: 100 * salto,
    });
  }

  // 2. Un objetivo activo cerca de vencer. Cerrarlo mueve el Progreso de
  // Mejora, y el número que mostramos es el que va a quedar: se calcula con la
  // misma fórmula que la base.
  for (const g of d.objetivos) {
    if (g.status !== 'activo' && g.status !== 'en_riesgo') continue;
    if (!g.vence_at) continue;
    const faltan = dias(hoy, g.vence_at);
    if (faltan > 30) continue;
    const proyectado = progresoDeCiclos(
      [...d.ciclos, { status: 'logrado', ambicion: g.ambicion, cerrado_at: hoy.toISOString() }],
      hoy,
    );
    const actual = d.progreso ?? 0;
    out.push({
      clave: `objetivo:${g.id}`,
      texto:
        faltan <= 0
          ? `Cerrá "${g.titulo}": ya venció el plazo que te pusiste.`
          : `Cerrá "${g.titulo}" con su evidencia: vence en ${faltan} ${faltan === 1 ? 'día' : 'días'}.`,
      porque:
        proyectado > actual
          ? `Con ese cierre aprobado, tu Progreso de Mejora pasa de ${actual} a ${proyectado}.`
          : 'Un cierre con evidencia es lo que sostiene tu nivel de empresa.',
      href: `/negocio/mejora/${g.id}`,
      impacto: 80 + Math.max(0, proyectado - actual) + (faltan <= 7 ? 40 : 0),
    });
  }

  // 3. Certificado por vencer: la afirmación baja sola de Nivel 3 a Nivel 2.
  for (const a of d.afirmaciones) {
    if (!a.cert_vence || a.status !== 'aprobada') continue;
    const faltan = dias(hoy, a.cert_vence);
    if (faltan > 60) continue;
    const nombre = CLAIMS[a.kind]?.nombre ?? a.kind;
    out.push({
      clave: `cert:${a.id}`,
      texto:
        faltan <= 0
          ? `Renová el certificado de "${nombre} · ${a.alcance}": venció.`
          : `Renová el certificado de "${nombre} · ${a.alcance}" antes del ${new Date(a.cert_vence).toLocaleDateString('es-AR')}.`,
      porque:
        faltan <= 0
          ? 'Sin certificado vigente la afirmación queda en Nivel 2, y el listado pierde puntaje.'
          : 'Al vencer, la afirmación baja sola de Nivel 3 a Nivel 2.',
      href: '/negocio/listados',
      impacto: 140 - Math.max(0, faltan),
    });
  }

  // 4. Un listado publicado con una sola foto o con una descripción corta.
  for (const l of d.listados) {
    if (l.status !== 'publicado') continue;
    if (l.imagenes >= 3 && l.descripcion >= 300) continue;
    const falta = l.imagenes < 3 ? 'fotos' : 'descripcion';
    out.push({
      clave: `ficha:${l.id}`,
      texto:
        falta === 'fotos'
          ? `Sumá fotos a "${l.titulo}": tiene ${l.imagenes} de 4.`
          : `Contá un poco más en "${l.titulo}": la descripción es corta.`,
      porque: 'Una ficha completa se entiende de un vistazo, y quien entiende, entra.',
      href: `/negocio/listados/${l.id}/editar`,
      impacto: falta === 'fotos' ? 30 : 20,
    });
  }

  // 5. Un listado publicado sin ninguna afirmación aprobada no tiene nivel, y
  // sin nivel casi no aparece.
  for (const l of d.listados) {
    if (l.status !== 'publicado' || l.tier !== 'e0') continue;
    out.push({
      clave: `sinnivel:${l.id}`,
      texto: `"${l.titulo}" no tiene ninguna afirmación aprobada todavía.`,
      porque: 'Sin nivel de evidencia, el listado queda al final del catálogo.',
      href: `/negocio/listados/${l.id}`,
      impacto: 120,
    });
  }

  return out.sort((a, b) => b.impacto - a.impacto).slice(0, 3);
}
