import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { evaluarCuentaMp, partirEstado, urlAutorizacion } from '../mercadopago';

/**
 * Vincular la cuenta de Mercado Pago de una tienda (Mercado v2): es la
 * verificación de quien vende, y la condición para cobrarle. Se prueba sin red:
 * qué cuenta alcanza, qué cuenta no, y que el `state` del OAuth no se pueda
 * fabricar.
 */

const BUENA = {
  id: 123456789,
  nickname: 'HUERTAQA',
  email: 'Huerta@Example.com',
  site_id: 'MLA',
  identification: { type: 'DNI', number: '30123456' },
  status: { site_status: 'active' },
};

test('una cuenta argentina, activa y con identidad, alcanza', () => {
  const r = evaluarCuentaMp(BUENA);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.id, '123456789');
    assert.equal(r.email, 'huerta@example.com');
    // El número de documento NO se guarda: solo qué tipo es.
    assert.deepEqual(r.datos, { site_id: 'MLA', identificacion: 'DNI' });
    assert.ok(!JSON.stringify(r).includes('30123456'));
  }
});

test('lo que no alcanza, con su motivo', () => {
  assert.deepEqual(evaluarCuentaMp(null), { ok: false, motivo: 'sin_id' });
  assert.deepEqual(evaluarCuentaMp({ ...BUENA, id: undefined }), { ok: false, motivo: 'sin_id' });
  assert.deepEqual(evaluarCuentaMp({ ...BUENA, site_id: 'MLB' }), { ok: false, motivo: 'pais' });
  assert.deepEqual(evaluarCuentaMp({ ...BUENA, status: { site_status: 'deactive' } }), { ok: false, motivo: 'inactiva' });
  assert.deepEqual(evaluarCuentaMp({ ...BUENA, identification: { type: 'DNI', number: '' } }), { ok: false, motivo: 'sin_identidad' });
  assert.deepEqual(evaluarCuentaMp({ ...BUENA, identification: null }), { ok: false, motivo: 'sin_identidad' });
  assert.deepEqual(evaluarCuentaMp({ ...BUENA, email: 'no-es-un-mail' }), { ok: false, motivo: 'sin_email' });
});

test('la URL de autorización lleva lo que Mercado Pago pide', () => {
  const u = new URL(urlAutorizacion({ clientId: '555', redirectUri: 'https://brote.app/api/pagos/mercadopago/vincular/vuelta', state: 'abc' }));
  assert.equal(u.origin + u.pathname, 'https://auth.mercadopago.com/authorization');
  assert.equal(u.searchParams.get('client_id'), '555');
  assert.equal(u.searchParams.get('response_type'), 'code');
  assert.equal(u.searchParams.get('platform_id'), 'mp');
  assert.equal(u.searchParams.get('state'), 'abc');
  assert.equal(u.searchParams.get('redirect_uri'), 'https://brote.app/api/pagos/mercadopago/vincular/vuelta');
});

test('el state de la cookie: 64 hex + la tienda, o nada', () => {
  const state = 'a'.repeat(64);
  const negocio = '0b0f6f3e-8d1c-4b44-9c6a-2a6c3e1f9d10';
  assert.deepEqual(partirEstado(`${state}.${negocio}`), { state, negocio });
  assert.equal(partirEstado(undefined), null);
  assert.equal(partirEstado(`${state}`), null);
  assert.equal(partirEstado(`corto.${negocio}`), null);
  assert.equal(partirEstado(`${state}.no-es-un-uuid`), null);
});
