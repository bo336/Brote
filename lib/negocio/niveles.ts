import { CLAIMS, SIN_E2, hoyISO, type Afirmacion, type CertInfo, type Nivel } from '../mercado/claims';

/**
 * El nivel de evidencia de una afirmación (05 §3.1).
 *
 * Espejo de `brote_claim_nivel()` en `0107_mercado.sql`, que es la que decide:
 * esta función sirve para la VISTA PREVIA del formulario ("así se va a ver") y
 * para los tests. Si la IA sugiere E3 y no hay número de certificado en la
 * base, el nivel es E2: la base gana siempre (06 §4).
 *
 * Relativo y sin alias: lo compila también el runner de tests.
 */
export function nivelAfirmacion(
  a: Afirmacion,
  ctx: {
    /** Aprobada por el revisor. Sin aprobación no hay nivel público. */
    aprobada: boolean;
    cert: CertInfo | null;
    /** Identidad verificada por dominio (etiqueta, DNS, archivo) o email. */
    verificacionFuerte: boolean;
    hoy?: string;
  },
): Nivel {
  if (!ctx.aprobada) return 'e0';
  const s = CLAIMS[a.kind];
  const hoy = ctx.hoy ?? hoyISO();
  if (a.cert_slug && s.e3(a, ctx.cert, hoy)) return 'e3';
  if (s.e2(a) && ctx.verificacionFuerte) return 'e2';
  if (s.e1(a)) return 'e1';
  return 'e0';
}

/**
 * Qué subiría el nivel, para enseñar la escalera en el formulario
 * ("→ sube a Nivel 2"). `null` si ya está en su techo.
 */
export function proximoPaso(
  a: Afirmacion,
  nivel: Nivel,
  verificacionFuerte: boolean,
): 'subir_documento' | 'verificar_dominio' | 'cargar_certificacion' | null {
  const s = CLAIMS[a.kind];
  if (nivel === 'e3') return null;
  if ((nivel === 'e0' || nivel === 'e1') && !SIN_E2.includes(a.kind)) {
    if (!a.evidencia) return 'subir_documento';
    if (!verificacionFuerte) return 'verificar_dominio';
  }
  const probe = s.e3({ ...a, cert_numero: 'x', cert_vence: '9999-12-31' }, {
    slug: 'x', nombre: '', emisor: '', claims: [a.kind], tiene_numero: true, vence: true,
  });
  return probe ? 'cargar_certificacion' : null;
}

/** El número visible del nivel: 1, 2, 3 o 4. */
export function numeroDeNivel(n: Nivel): number {
  return Number(n.slice(1));
}
