import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { formatearWhatsapp, normalizarWhatsappAR, pasoActual, pasosCompletos, type Faltante } from '../vendedor';

/**
 * El alta de vendedores: el número de WhatsApp tiene que quedar en el formato
 * que entiende wa.me (si no, el botón "Consultar por WhatsApp" abre un chat con
 * nadie), y el paso del alta tiene que ser el primero que falta.
 */

test('WhatsApp argentino: lo que la gente escribe de verdad', () => {
  const casos: [string, string][] = [
    ['11 2233-4455', '+5491122334455'],
    ['011 15 2233-4455', '+5491122334455'],
    ['+54 11 2233 4455', '+5491122334455'],
    ['+54 9 11 2233-4455', '+5491122334455'],
    ['5491122334455', '+5491122334455'],
    ['223 15-455-6677', '+5492234556677'],
    ['(0351) 15 555-1234', '+5493515551234'],
    ['2944 123456', '+5492944123456'],
  ];
  for (const [entrada, esperado] of casos) assert.equal(normalizarWhatsappAR(entrada), esperado, entrada);
});

test('WhatsApp: lo que no alcanza para un número vuelve null; otro país queda como está', () => {
  assert.equal(normalizarWhatsappAR(''), null);
  assert.equal(normalizarWhatsappAR('1234'), null);
  assert.equal(normalizarWhatsappAR('11 2233'), null);
  assert.equal(normalizarWhatsappAR('+598 99 123 456'), '+59899123456');
});

test('WhatsApp: se muestra legible', () => {
  assert.equal(formatearWhatsapp('+5491122334455'), '+54 9 11 2233-4455');
  assert.equal(formatearWhatsapp('+59899123456'), '+59899123456');
  assert.equal(formatearWhatsapp(null), '');
});

test('el paso del alta es el primero que falta', () => {
  const con = (falta: Faltante[]) => ({ falta });
  assert.equal(pasoActual(con(['tienda', 'compromiso', 'prueba', 'mercado_pago', 'terminos', 'suscripcion'])), 'tienda');
  assert.equal(pasoActual(con(['compromiso', 'prueba', 'mercado_pago'])), 'compromiso');
  assert.equal(pasoActual(con(['prueba', 'terminos'])), 'prueba');
  // Lo que queda (términos, vincular, pagar) es todo el paso de Mercado Pago.
  assert.equal(pasoActual(con(['terminos', 'suscripcion'])), 'mercado_pago');
  assert.equal(pasoActual(con([])), 'mercado_pago');
  assert.equal(pasosCompletos(con([])), 4);
  assert.equal(pasosCompletos(con(['suscripcion'])), 3);
});
