import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * Los criterios de aceptación de la fase 3 que se prueban leyendo el código
 * (fase 3 §11, 08 §10): la salida por interstitial, las palabras de los
 * badges, "precio" nunca solo, y cero AdSense en el Mercado.
 */

const RAIZ = process.cwd();

function archivos(dir: string, ext = /\.tsx?$/): string[] {
  const out: string[] = [];
  for (const nombre of readdirSync(join(RAIZ, dir))) {
    const ruta = join(dir, nombre);
    if (statSync(join(RAIZ, ruta)).isDirectory()) out.push(...archivos(ruta, ext));
    else if (ext.test(nombre)) out.push(ruta);
  }
  return out;
}

const FUENTES = [...archivos('app'), ...archivos('components')];

test('toda salida pasa por el interstitial: ningún href apunta a url_destino', () => {
  for (const f of FUENTES) {
    const src = readFileSync(join(RAIZ, f), 'utf8');
    assert.ok(!/href=\{[^}]*url_?[dD]estino[^}]*\}/.test(src), `${f} enlaza directo a la URL de destino`);
    assert.ok(!/window\.open\([^)]*url_?[dD]estino/.test(src), `${f} abre directo la URL de destino`);
  }
});

test('en el Mercado, la única salida hacia un comercio es la del interstitial', () => {
  // El panel del revisor abre el sitio de un negocio para revisarlo: no es una
  // salida de una persona hacia una compra, y queda fuera de esta regla.
  //
  // Lo que se busca es una salida FUERA de Brote: un `href` a http(s), o a la
  // URL de destino. Abrir una pantalla nuestra en otra pestaña —los términos
  // desde el alta, por ejemplo— no es una salida hacia un comercio.
  const mercado = [...archivos('app/(app)/mercado'), ...archivos('components/mercado'), ...archivos('components/negocio')];
  const conSalidaExterna = mercado.filter((f) => {
    const src = readFileSync(join(RAIZ, f), 'utf8');
    return (
      /rel="noopener noreferrer( nofollow)?"/.test(src) ||
      /window\.location\.(assign|href)/.test(src) ||
      /href=\{[^}]*url_?[dD]estino/.test(src)
    );
  });
  // Cuatro, y las cuatro a propósito:
  // · el interstitial, que es la ÚNICA salida de una persona hacia un comercio;
  // · las pantallas de plan (la de empresas y la de tiendas) y el último paso
  //   del alta, que mandan a quien vende al checkout de Mercado Pago —el pago
  //   lo hospeda el proveedor y Brote nunca ve una tarjeta— o a su cuenta de
  //   Mercado Pago para actualizar el medio de pago.
  assert.deepEqual(conSalidaExterna.map((f) => f.replace(/\\/g, '/')).sort(), [
    'components/mercado/SalidaMercado.tsx',
    'components/negocio/plan/PlanNegocio.tsx',
    'components/negocio/vendedor/PasoMercadoPago.tsx',
    'components/negocio/vendedor/PlanVendedor.tsx',
  ]);
});

const ES = JSON.parse(readFileSync(join(RAIZ, 'messages/es.json'), 'utf8')) as Record<string, any>;

function textos(obj: unknown, ruta = ''): [string, string][] {
  if (typeof obj === 'string') return [[ruta, obj]];
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => textos(v, ruta ? `${ruta}.${k}` : k));
  }
  return [];
}

test('ningún badge dice "verificado", "garantizado" o "aprobado" sobre un producto', () => {
  const m = ES.mercado;
  const badges = [
    ...Object.values(m.nivel as Record<string, { corto?: string }>).map((n) => n.corto).filter((x): x is string => !!x),
    ...textos(m.catalogo).map(([, v]) => v),
    ...textos(m.ficha).map(([, v]) => v),
    ...textos(m.disponibilidad).map(([, v]) => v),
  ];
  for (const b of badges) {
    assert.ok(!/verificad[oa]s?|garantizad[oa]s?|aprobad[oa]s?/i.test(b), `"${b}" describe el producto, no el proceso`);
  }
});

test('la palabra "precio" nunca aparece sola: siempre "precio de referencia"', () => {
  // Los dos textos legales literales de 08 §4.1 y §4.3 hablan de "el precio" de
  // la compra y de "precios" como dato provisto: son la excepción documentada.
  const LITERALES = new Set(['salida.responsabilidad', 'ficha.pie']);
  for (const [ruta, v] of textos(ES.mercado)) {
    if (LITERALES.has(ruta)) continue;
    for (const m of v.matchAll(/\bprecios?\b/gi)) {
      const resto = v.slice((m.index ?? 0) + m[0].length);
      assert.ok(/^ de referencia/i.test(resto), `mercado.${ruta}: "${v}"`);
    }
  }
});

test('cero AdSense en el Mercado: ninguna pantalla del Mercado importa anuncios', () => {
  const mercado = [...archivos('app/(app)/mercado'), ...archivos('components/mercado')];
  assert.ok(mercado.length > 0);
  for (const f of mercado) {
    const src = readFileSync(join(RAIZ, f), 'utf8');
    assert.ok(!/components\/ads|AdSlot|adsbygoogle/.test(src), `${f} trae anuncios`);
  }
});

test('las etiquetas de nivel son las de 08 §4.2, literales', () => {
  const n = ES.mercado.nivel;
  assert.equal(n.e1.corto, 'Declarado por el comercio');
  assert.equal(n.e2.corto, 'Documentación revisada');
  assert.equal(n.e3.corto, 'Certificación de tercero');
  assert.equal(n.e4.corto, 'Referente');
  assert.equal(n.e1.explicacion, 'El comercio afirma esto. Brote no verificó documentación de respaldo.');
  assert.equal(ES.mercado.salida.titulo, 'Estás saliendo de Brote');
  assert.equal(
    ES.mercado.afirmaciones.intro,
    'Elegí qué querés afirmar de este producto. Cada una tiene su propio nivel de evidencia — no hace falta que tengas certificaciones para empezar.',
  );
});
