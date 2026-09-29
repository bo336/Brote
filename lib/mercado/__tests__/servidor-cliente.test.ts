import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { test } from 'node:test';

/**
 * Un componente que se renderiza en el servidor NO puede llamar a una función
 * exportada por un módulo `'use client'`: en el servidor eso es una referencia,
 * no una función, y la página entera cae con "(0, x.d) is not a function".
 *
 * Pasó con `buttonVariants()` (de `components/ui/button.tsx`) en la ficha del
 * Mercado y en el inicio de la tienda: el build pasaba, el typecheck también, y
 * la ficha de CUALQUIER producto mostraba "Algo no salió como esperábamos".
 * Nada más lo atrapa antes de producción, así que lo mira este test.
 */

const RAIZ = process.cwd();

function archivos(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(join(RAIZ, dir))) return out;
  for (const nombre of readdirSync(join(RAIZ, dir))) {
    const ruta = join(dir, nombre);
    if (statSync(join(RAIZ, ruta)).isDirectory()) out.push(...archivos(ruta));
    else if (/\.tsx?$/.test(nombre)) out.push(ruta);
  }
  return out;
}

function resolver(spec: string, desde: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = spec.slice(2);
  else if (spec.startsWith('.')) base = normalize(join(dirname(desde), spec));
  else return null;
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(join(RAIZ, base + ext))) return base + ext;
  }
  return null;
}

const cabeza = new Map<string, string>();
function directiva(ruta: string, cual: 'client' | 'server'): boolean {
  if (!cabeza.has(ruta)) cabeza.set(ruta, readFileSync(join(RAIZ, ruta), 'utf8').slice(0, 200));
  return new RegExp(`^\\s*['"]use ${cual}['"]`).test(cabeza.get(ruta)!);
}

test('ningún módulo de servidor llama a una función de un módulo de cliente', () => {
  const problemas: string[] = [];
  for (const f of [...archivos('app'), ...archivos('components'), ...archivos('lib'), ...archivos('stores')]) {
    if (f.includes('__tests__') || directiva(f, 'client') || directiva(f, 'server')) continue;
    const src = readFileSync(join(RAIZ, f), 'utf8');
    for (const m of src.matchAll(/import\s+(?!type\b)\{([^}]*)\}\s+from\s+'([^']+)'/g)) {
      const destino = resolver(m[2]!, f);
      if (!destino || !directiva(destino, 'client')) continue;
      for (const nombre of m[1]!.split(',').map((x) => x.trim()).filter(Boolean)) {
        if (nombre.startsWith('type ')) continue;
        const local = nombre.split(/\s+as\s+/).pop()!.trim();
        // Los componentes (Mayúscula) se pueden usar: son fronteras de cliente.
        // Lo que se LLAMA —una función, un hook— no.
        if (/^[a-z]/.test(local) && new RegExp(`\\b${local}\\s*\\(`).test(src.slice(m.index! + m[0].length))) {
          problemas.push(`${f.replace(/\\/g, '/')} llama a ${local}() de ${destino}`);
        }
      }
    }
  }
  assert.deepEqual(problemas, []);
});
