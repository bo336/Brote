import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  CONFIG_DEFECTO,
  PLACEMENTS,
  decideAds,
  dentroDeTopes,
  feedAdIndices,
  normalizarConfig,
  proveedorPara,
  routeAllowsAds,
  routeAllowsAnonymousAds,
  shouldShowMoment,
  type AdContext,
} from '../policy';

const adulto: AdContext = {
  globalEnabled: true,
  isPro: false,
  accountType: 'adult',
  onboarded: true,
  adsConsent: null,
  memberSince: '2020-01-01T00:00:00Z',
};

test('the master switch turns everything off, even for visitors', () => {
  assert.equal(decideAds({ ...adulto, globalEnabled: false }).show, false);
  assert.equal(decideAds({ ...adulto, globalEnabled: false, anonymous: true }).show, false);
});

test('never: Brote+, kids, before onboarding, during the grace days', () => {
  assert.deepEqual(decideAds({ ...adulto, isPro: true }), { show: false, personalized: false, reason: 'pro' });
  assert.equal(decideAds({ ...adulto, accountType: 'kid' }).show, false);
  assert.equal(decideAds({ ...adulto, onboarded: false }).show, false);
  const ayer = new Date(Date.now() - 86_400_000).toISOString();
  assert.equal(decideAds({ ...adulto, memberSince: ayer }).reason, 'new-user-grace');
  assert.equal(decideAds({ ...adulto, memberSince: ayer, diasGracia: 0 }).show, true);
});

test('personalized only for adults who said yes; teens and visitors never', () => {
  assert.equal(decideAds({ ...adulto, adsConsent: true }).personalized, true);
  assert.equal(decideAds({ ...adulto, adsConsent: false }).personalized, false);
  assert.equal(decideAds({ ...adulto, adsConsent: null }).personalized, false);
  assert.equal(decideAds({ ...adulto, accountType: 'teen', adsConsent: true }).personalized, false);
  assert.deepEqual(decideAds({ ...adulto, anonymous: true }), { show: true, personalized: false });
});

test('the core of the product stays clean', () => {
  for (const r of ['/', '/onboarding', '/auth/login', '/brote-plus', '/mundo', '/perfil', '/perfil/ajustes', '/panel/analitica',
    '/negocio/desafios', '/aprender/sesion/x', '/mercado', '/mercado/tienda/x', '/notificaciones', '/certificados/BRT-AAAA-BBBB']) {
    assert.equal(routeAllowsAds(r), false, r);
  }
  for (const r of ['/feed', '/feed/n/1', '/ranking', '/acciones', '/guia/ducha-corta-5-min']) assert.equal(routeAllowsAds(r), true, r);
  assert.equal(routeAllowsAnonymousAds('/guia'), true);
  assert.equal(routeAllowsAnonymousAds('/feed'), false);
  assert.equal(routeAllowsAnonymousAds('/auth/login'), false);
});

test('the floating moment card never carries AdSense', () => {
  const c = normalizarConfig({ ubicaciones: { moment: { activa: true, proveedor: 'adsense' } } });
  assert.equal(c.ubicaciones.moment!.proveedor, 'directo');
  assert.equal(proveedorPara('moment', c, { hayDirecto: false, adsenseListo: true }), null);
  assert.equal(proveedorPara('moment', c, { hayDirecto: true, adsenseListo: true }), 'directo');
});

test('provider: auto prefers a running direct sponsor, then AdSense', () => {
  const c = CONFIG_DEFECTO;
  assert.equal(proveedorPara('ranking-footer', c, { hayDirecto: true, adsenseListo: true }), 'directo');
  assert.equal(proveedorPara('ranking-footer', c, { hayDirecto: false, adsenseListo: true }), 'adsense');
  assert.equal(proveedorPara('ranking-footer', c, { hayDirecto: false, adsenseListo: false }), null);
  // Visitors without an account have no profile to match a sponsor against.
  assert.equal(proveedorPara('guia', c, { hayDirecto: true, adsenseListo: true, anonymous: true }), 'adsense');
  const apagada = normalizarConfig({ ubicaciones: { 'ranking-footer': { activa: false } } });
  assert.equal(proveedorPara('ranking-footer', apagada, { hayDirecto: true, adsenseListo: true }), null);
  const soloAdsense = normalizarConfig({ ubicaciones: { 'news-article': { activa: true, proveedor: 'adsense' } } });
  assert.equal(proveedorPara('news-article', soloAdsense, { hayDirecto: true, adsenseListo: true }), 'adsense');
});

test('caps and the in-feed rhythm', () => {
  assert.equal(dentroDeTopes({ hoy: 11, sesion: 4 }, CONFIG_DEFECTO), true);
  assert.equal(dentroDeTopes({ hoy: 12, sesion: 0 }, CONFIG_DEFECTO), false);
  assert.equal(dentroDeTopes({ hoy: 0, sesion: 5 }, CONFIG_DEFECTO), false);
  assert.deepEqual(feedAdIndices(40), [5, 13, 21]);
  assert.deepEqual(feedAdIndices(4), []);
  assert.deepEqual(feedAdIndices(40, normalizarConfig({ ubicaciones: { 'news-feed': { activa: false } } })), []);
  // Odd values from the database are clamped, not trusted.
  const raro = normalizarConfig({ por_dia: 9999, por_sesion: -3, ubicaciones: { 'news-feed': { cada: 1, max: 99 } } });
  assert.equal(raro.por_dia, 50);
  assert.equal(raro.por_sesion, 0);
  assert.equal(raro.ubicaciones['news-feed']!.cada, 3);
  assert.equal(raro.ubicaciones['news-feed']!.max, 10);
});

test('moment: after N closes, once per session, with a gap between sessions', () => {
  const show = { show: true, personalized: false };
  const base = { closes: 3, shownThisSession: 0, lastShownAt: null, sessions: 3 };
  assert.equal(shouldShowMoment(base, show), true);
  assert.equal(shouldShowMoment({ ...base, closes: 2 }, show), false);
  assert.equal(shouldShowMoment({ ...base, sessions: 2 }, show), false);
  assert.equal(shouldShowMoment({ ...base, shownThisSession: 1 }, show), false);
  const ahora = Date.now();
  assert.equal(shouldShowMoment({ ...base, lastShownAt: ahora - 10 * 60_000 }, show, CONFIG_DEFECTO, ahora), false);
  assert.equal(shouldShowMoment({ ...base, lastShownAt: ahora - 31 * 60_000 }, show, CONFIG_DEFECTO, ahora), true);
  assert.equal(shouldShowMoment(base, { show: false, personalized: false }), false);
});

test('the database defaults are the same placements and rules as the code', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/0134_publicidad.sql'), 'utf8');
  const m = /\('publicidad_config', '(\{[\s\S]*?\})'::jsonb/.exec(sql);
  assert.ok(m, 'default config in 0134');
  const db = JSON.parse(m![1]!);
  assert.deepEqual(Object.keys(db.ubicaciones).sort(), [...PLACEMENTS].sort());
  assert.deepEqual(normalizarConfig(db), CONFIG_DEFECTO);
  // The same placement list is what the panel functions accept.
  assert.match(sql, /\('news-feed', 'news-article', 'ranking-footer', 'catalog-footer', 'guia', 'moment'\)/);
});
