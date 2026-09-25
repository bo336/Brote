// Comprueba que cada URL de las fuentes del Árbol responda. Una fuente con el
// link roto es peor que ninguna: la página de fuentes promete que se puede ir
// a mirar el original.
//
// Uso: node scripts/academia-arbol/verificar-fuentes.mjs [--solo-nuevas]
//
// Algunos sitios (revistas, organismos) rechazan pedidos que no parecen de un
// navegador, así que se manda un User-Agent de navegador y se acepta 403 como
// "existe pero no deja pasar robots" —se reporta aparte para mirarlo a mano.

import { FUENTES } from './fuentes.mjs';
import { FUENTES as ANTERIORES } from '../academia/fuentes.mjs';

const soloNuevas = process.argv.includes('--solo-nuevas');
const viejas = new Set(ANTERIORES.map((f) => f.slug));
const lista = FUENTES.filter((f) => !soloNuevas || !viejas.has(f.slug));

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function probar(f) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(f.url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } });
    return { slug: f.slug, estado: r.status, url: f.url, final: r.url };
  } catch (e) {
    return { slug: f.slug, estado: 'ERROR', url: f.url, error: String(e?.cause?.code ?? e?.message ?? e) };
  } finally {
    clearTimeout(t);
  }
}

const res = [];
for (let i = 0; i < lista.length; i += 8) {
  res.push(...(await Promise.all(lista.slice(i, i + 8).map(probar))));
}

const ok = res.filter((r) => r.estado === 200);
const bloqueadas = res.filter((r) => r.estado === 403 || r.estado === 401);
const rotas = res.filter((r) => r.estado !== 200 && r.estado !== 403 && r.estado !== 401);

console.log(`OK ${ok.length} · bloquean robots ${bloqueadas.length} · con problemas ${rotas.length}`);
for (const r of bloqueadas) console.log(`  [${r.estado}] ${r.slug}  ${r.url}`);
for (const r of rotas) console.log(`  [${r.estado}] ${r.slug}  ${r.url}  ${r.error ?? ''}`);
if (rotas.length) process.exitCode = 1;
