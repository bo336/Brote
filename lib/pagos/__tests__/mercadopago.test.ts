import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { claveEvento, firmar, firmaValida, idDeNotificacion, manifiesto, partirFirma, tipoDeEvento } from '../mercadopago';

/**
 * La primera regla del webhook (09 §4.4): un webhook sin validar es una API
 * pública para regalar suscripciones. Esto es lo que se prueba primero.
 */

const SECRETO = 'un-secreto-de-prueba';
const DATA_ID = '1234567890';
const REQUEST_ID = 'req-abc-123';

function firmaDe(secreto: string, dataId: string, requestId: string, ts = '1789800000'): string {
  return `ts=${ts},v1=${firmar(secreto, manifiesto(dataId, requestId, ts))}`;
}

test('una firma buena pasa', () => {
  assert.equal(
    firmaValida(SECRETO, { firma: firmaDe(SECRETO, DATA_ID, REQUEST_ID), requestId: REQUEST_ID, dataId: DATA_ID }),
    true,
  );
});

test('una firma con otro secreto NO pasa', () => {
  assert.equal(
    firmaValida(SECRETO, { firma: firmaDe('otro-secreto', DATA_ID, REQUEST_ID), requestId: REQUEST_ID, dataId: DATA_ID }),
    false,
  );
});

test('cambiar el id o el request-id invalida la firma', () => {
  const firma = firmaDe(SECRETO, DATA_ID, REQUEST_ID);
  assert.equal(firmaValida(SECRETO, { firma, requestId: REQUEST_ID, dataId: '9999999999' }), false);
  assert.equal(firmaValida(SECRETO, { firma, requestId: 'otro-request', dataId: DATA_ID }), false);
});

test('sin encabezado, sin ts o sin v1: no pasa', () => {
  assert.equal(firmaValida(SECRETO, { firma: null, requestId: REQUEST_ID, dataId: DATA_ID }), false);
  assert.equal(firmaValida(SECRETO, { firma: 'ts=1789800000', requestId: REQUEST_ID, dataId: DATA_ID }), false);
  assert.equal(firmaValida(SECRETO, { firma: 'v1=abc', requestId: REQUEST_ID, dataId: DATA_ID }), false);
  assert.equal(firmaValida(SECRETO, { firma: 'basura', requestId: REQUEST_ID, dataId: DATA_ID }), false);
});

test('SIN SECRETO CONFIGURADO no pasa nada: falla cerrado', () => {
  assert.equal(
    firmaValida(undefined, { firma: firmaDe(SECRETO, DATA_ID, REQUEST_ID), requestId: REQUEST_ID, dataId: DATA_ID }),
    false,
  );
});

test('el manifiesto es el de MercadoPago, con el id en minúsculas', () => {
  assert.equal(manifiesto('AbC123', 'r1', '17'), 'id:abc123;request-id:r1;ts:17;');
  assert.deepEqual(partirFirma('ts=17, v1=deadbeef'), { ts: '17', v1: 'deadbeef' });
});

test('el id llega por el cuerpo o por la querystring', () => {
  const url = new URL('https://brote.app/api/pagos/mercadopago/webhook?data.id=777&type=payment');
  assert.equal(idDeNotificacion({ data: { id: '555' } }, url), '555');
  assert.equal(idDeNotificacion({}, url), '777');
});

test('la llave de idempotencia usa el id propio de la notificación', () => {
  assert.equal(claveEvento({ id: 991, action: 'updated' }, 'subscription_preapproval', '5'), '991');
  // Sin id propio, se arma una con lo que haya: dos cambios distintos de la
  // misma suscripción no pueden compartir llave.
  assert.equal(
    claveEvento({ action: 'updated' }, 'subscription_preapproval', '5'),
    'subscription_preapproval:5:updated',
  );
  assert.notEqual(
    claveEvento({ action: 'created' }, 'subscription_preapproval', '5'),
    claveEvento({ action: 'updated' }, 'subscription_preapproval', '5'),
  );
});

test('los tipos de evento de una suscripción se reconocen', () => {
  assert.equal(tipoDeEvento('subscription_preapproval'), 'preapproval');
  assert.equal(tipoDeEvento('subscription_authorized_payment'), 'authorized_payment');
  assert.equal(tipoDeEvento('payment'), 'payment');
  assert.equal(tipoDeEvento('mp-connect'), 'otro');
});

test('el webhook valida la firma ANTES de tocar nada', () => {
  const ruta = join(process.cwd(), 'app/api/pagos/mercadopago/webhook/route.ts');
  const src = readFileSync(ruta, 'utf8');
  const iFirma = src.indexOf('firmaValida');
  const iRegistro = src.indexOf('pagos_evento_registrar');
  const iProcesar = src.indexOf('await procesar(');
  assert.ok(iFirma > 0 && iRegistro > iFirma, 'se registra el evento antes de validar la firma');
  assert.ok(iProcesar > iRegistro, 'se procesa antes de registrar el evento');
  // Y nunca se le cree al cuerpo: la verdad se vuelve a pedir por la API.
  assert.ok(/MP_API\}\/preapproval\//.test(src), 'no vuelve a consultar la suscripción');
});
