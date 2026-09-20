import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * MercadoPago, sin SDK (09 §4.2): son 300 kB para tres llamadas, y este
 * proyecto tiene una disciplina de dependencias que vale la pena mantener.
 *
 * Acá vive lo único de MercadoPago que necesita ser probado: la validación de
 * la firma. Es la primera regla del webhook (09 §4.4) porque un webhook sin
 * validar es una API pública para regalar suscripciones.
 */

export const MP_API = 'https://api.mercadopago.com';

/** `x-signature: ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839` */
export function partirFirma(header: string | null): { ts: string; v1: string } | null {
  if (!header) return null;
  const partes: Record<string, string> = {};
  for (const trozo of header.split(',')) {
    const i = trozo.indexOf('=');
    if (i <= 0) continue;
    partes[trozo.slice(0, i).trim()] = trozo.slice(i + 1).trim();
  }
  if (!partes.ts || !partes.v1) return null;
  return { ts: partes.ts, v1: partes.v1 };
}

/**
 * El manifiesto que MercadoPago firma. El orden y los `;` son literales: si
 * falta uno, la firma no coincide y el webhook rechaza todo.
 *
 * `data.id` va en minúsculas cuando trae letras, como pide su documentación.
 */
export function manifiesto(dataId: string, requestId: string, ts: string): string {
  return `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
}

export function firmar(secreto: string, manifiestoTexto: string): string {
  return createHmac('sha256', secreto).update(manifiestoTexto).digest('hex');
}

/**
 * ¿Es auténtica esta notificación? Sin secreto configurado, NO: se falla
 * cerrado. Aceptar lo que llegue "hasta que configuremos el secreto" es
 * exactamente el agujero que esta función existe para tapar.
 */
export function firmaValida(
  secreto: string | undefined,
  datos: { firma: string | null; requestId: string | null; dataId: string },
): boolean {
  if (!secreto) return false;
  const partes = partirFirma(datos.firma);
  if (!partes || !datos.dataId) return false;
  const esperada = firmar(secreto, manifiesto(datos.dataId, datos.requestId ?? '', partes.ts));
  const a = Buffer.from(esperada, 'utf8');
  const b = Buffer.from(partes.v1, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** El `data.id` de la notificación, venga por cuerpo o por querystring. */
export function idDeNotificacion(cuerpo: Record<string, unknown>, url: URL): string {
  const data = cuerpo.data as { id?: string | number } | undefined;
  return String(data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');
}

/**
 * La llave de idempotencia (09 §4.4, regla 3). MercadoPago reintenta la misma
 * notificación con el mismo `id`; dos cambios distintos de la misma suscripción
 * llegan con `id` distintos. Sin `id` propio, se arma una con lo que haya.
 */
export function claveEvento(cuerpo: Record<string, unknown>, tipo: string, dataId: string): string {
  const propio = cuerpo.id;
  if (propio !== undefined && propio !== null && String(propio).length > 0) return String(propio);
  return `${tipo}:${dataId}:${String(cuerpo.action ?? '')}`;
}

export type TipoEvento = 'preapproval' | 'authorized_payment' | 'payment' | 'otro';

export function tipoDeEvento(tipo: string): TipoEvento {
  const t = (tipo || '').toLowerCase();
  if (t.includes('authorized_payment')) return 'authorized_payment';
  if (t.includes('preapproval')) return 'preapproval';
  if (t === 'payment') return 'payment';
  return 'otro';
}
