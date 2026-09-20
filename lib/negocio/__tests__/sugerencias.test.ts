import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { sugerencias, type DatosSugerencias } from '../sugerencias';
import { progresoDeCiclos } from '../../mejora/progreso';

const HOY = new Date('2026-09-20T12:00:00Z');

function datos(p: Partial<DatosSugerencias> = {}): DatosSugerencias {
  return {
    progreso: 40,
    verificacion_fuerte: false,
    listados: [],
    afirmaciones: [],
    objetivos: [],
    ciclos: [],
    ...p,
  };
}

test('sin nada que decir, no dice nada', () => {
  assert.deepEqual(sugerencias(datos(), HOY), []);
});

test('una afirmación en Nivel 1 con documento y dominio verificado: el paso más barato', () => {
  const s = sugerencias(
    datos({
      verificacion_fuerte: true,
      afirmaciones: [
        {
          id: 'c1',
          kind: 'contenido_reciclado',
          alcance: 'Envase',
          tier: 'e1',
          status: 'aprobada',
          evidencia: true,
          cert_slug: null,
          cert_vence: null,
          listados: 2,
        },
      ],
    }),
    HOY,
  );
  assert.equal(s.length, 1);
  assert.match(s[0]!.texto, /Envase/);
  assert.match(s[0]!.porque, /Nivel 2/);
  // Nada de porcentajes inventados: el documento propone "+18%" y no lo decimos.
  assert.ok(!/%/.test(s[0]!.texto + s[0]!.porque));
});

test('sin documento, la sugerencia es subir el documento; sin dominio, verificarlo', () => {
  const base = {
    id: 'c1',
    kind: 'contenido_reciclado' as const,
    alcance: 'Envase',
    tier: 'e1' as const,
    status: 'aprobada',
    cert_slug: null,
    cert_vence: null,
    listados: 1,
  };
  assert.match(sugerencias(datos({ afirmaciones: [{ ...base, evidencia: false }] }), HOY)[0]!.texto, /documento/i);
  assert.match(
    sugerencias(datos({ verificacion_fuerte: false, afirmaciones: [{ ...base, evidencia: true }] }), HOY)[0]!.texto,
    /dominio/i,
  );
});

test('las afirmaciones que NO pueden llegar a Nivel 2 no se sugieren', () => {
  const s = sugerencias(
    datos({
      verificacion_fuerte: true,
      afirmaciones: [
        {
          id: 'c1',
          kind: 'certificacion_tercero',
          alcance: 'Empresa',
          tier: 'e1',
          status: 'aprobada',
          evidencia: true,
          cert_slug: null,
          cert_vence: null,
          listados: 1,
        },
      ],
    }),
    HOY,
  );
  assert.deepEqual(s, []);
});

test('el Progreso de Mejora proyectado es el que de verdad va a quedar', () => {
  const ciclos = [
    { status: 'logrado' as const, ambicion: 'basico' as const, cerrado_at: '2026-06-01T00:00:00Z' },
  ];
  const d = datos({
    progreso: progresoDeCiclos(ciclos, HOY),
    ciclos,
    objetivos: [
      {
        id: 'g1',
        titulo: 'Bajar el consumo de energía',
        dominio: 'energia',
        ambicion: 'intermedio',
        status: 'activo',
        vence_at: '2026-09-27T00:00:00Z',
        es_publico: false,
      },
    ],
  });
  const s = sugerencias(d, HOY);
  const esperado = progresoDeCiclos(
    [...ciclos, { status: 'logrado', ambicion: 'intermedio', cerrado_at: HOY.toISOString() }],
    HOY,
  );
  assert.equal(s.length, 1);
  assert.match(s[0]!.porque, new RegExp(`a ${esperado}\\b`));
  assert.match(s[0]!.texto, /7 días/);
});

test('un certificado vencido pesa más que una foto de más', () => {
  const s = sugerencias(
    datos({
      afirmaciones: [
        {
          id: 'c1',
          kind: 'organico',
          alcance: 'Harina',
          tier: 'e3',
          status: 'aprobada',
          evidencia: true,
          cert_slug: 'oia',
          cert_vence: '2026-09-25',
          listados: 1,
        },
      ],
      listados: [
        { id: 'l1', titulo: 'Harina', status: 'publicado', tier: 'e3', score: 60, imagenes: 1, descripcion: 500, afirmaciones: 1 },
      ],
    }),
    HOY,
  );
  assert.equal(s[0]!.clave, 'cert:c1');
  assert.equal(s[1]!.clave, 'ficha:l1');
});

test('nunca más de tres, y ordenadas por impacto', () => {
  const s = sugerencias(
    datos({
      listados: Array.from({ length: 8 }, (_, i) => ({
        id: `l${i}`,
        titulo: `Listado ${i}`,
        status: 'publicado',
        tier: 'e1' as const,
        score: 40,
        imagenes: 1,
        descripcion: 120,
        afirmaciones: 1,
      })),
    }),
    HOY,
  );
  assert.equal(s.length, 3);
  assert.ok(s[0]!.impacto >= s[1]!.impacto && s[1]!.impacto >= s[2]!.impacto);
});

// ── Las cinco reglas duras del puente (fase 4 §2.2) ─────────────────────────

const RAIZ = process.cwd();

/** El código sin comentarios: lo que el componente HACE, no lo que dice que hace. */
function codigo(ruta: string): string {
  return readFileSync(join(RAIZ, ruta), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function archivos(dir: string): string[] {
  const completo = join(RAIZ, dir);
  if (!existsSync(completo) || !statSync(completo).isDirectory()) return [];
  const out: string[] = [];
  for (const nombre of readdirSync(completo)) {
    const ruta = join(dir, nombre);
    if (statSync(join(RAIZ, ruta)).isDirectory()) out.push(...archivos(ruta));
    else if (/\.tsx?$/.test(nombre)) out.push(ruta);
  }
  return out;
}

test('comprar no da un solo punto: el puente no toca complete_activity', () => {
  const src = codigo('components/mercado/DondeConseguirlo.tsx');
  assert.ok(!/complete_activity|completeActivity|celebrateCompletion/.test(src));
});

test('el puente no aparece en el set diario, ni en la celebración, ni en el onboarding', () => {
  const prohibidos = [
    ...archivos('components/rewards'),
    ...archivos('components/onboarding'),
    ...archivos('components/habitos'),
    ...archivos('components/acciones'),
    'app/(app)/page.tsx',
    'app/(app)/onboarding/page.tsx',
  ].filter((f) => existsSync(join(RAIZ, f)) && statSync(join(RAIZ, f)).isFile());
  assert.ok(prohibidos.length > 3, 'no se encontraron pantallas del camino de completar');
  for (const f of prohibidos) {
    assert.ok(!/DondeConseguirlo/.test(codigo(f)), `${f} muestra el puente en el camino de completar`);
  }
  // Y donde SÍ va: la ficha de la acción, debajo de todo.
  assert.ok(/DondeConseguirlo/.test(codigo('app/(app)/acciones/[slug]/page.tsx')));
});

test('la campana personal filtra los avisos de empresa', () => {
  const api = readFileSync(join(RAIZ, 'lib/api/notifications.ts'), 'utf8');
  const queries = readFileSync(join(RAIZ, 'lib/supabase/queries.ts'), 'utf8');
  assert.equal((api.match(/is\('business_id', null\)/g) ?? []).length, 3, 'las tres consultas personales deben filtrar');
  assert.ok(/is\('business_id', null\)/.test(queries), 'el contador de no leídas no filtra');
});
