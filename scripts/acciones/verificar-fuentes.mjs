// Comprueba que respondan las fuentes propias de las acciones (las de la
// Academia se verifican con scripts/academia-arbol/verificar-fuentes.mjs).
// Uso: node scripts/acciones/verificar-fuentes.mjs
import { PROPIAS } from './fuentes.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
let malas = 0;
for (const f of PROPIAS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(f.url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } });
    const ok = r.status === 200 || r.status === 403;
    if (!ok) malas++;
    console.log(`[${r.status}] ${f.slug}  ${r.url}`);
  } catch (e) {
    malas++;
    console.log(`[ERROR] ${f.slug}  ${f.url}  ${e?.cause?.code ?? e?.message}`);
  } finally {
    clearTimeout(t);
  }
}
if (malas) process.exitCode = 1;
