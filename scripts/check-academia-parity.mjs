// ─────────────────────────────────────────────────────────────────────────────
// Paridad repo ↔ base viva para la Academia.
//
// AGENT-RULES §2: "Una migración aplicada pero no commiteada es un bug." Esto
// verifica la otra mitad, que es la que se rompe en silencio: que el CUERPO de
// cada función en las migraciones de la Academia sea idéntico, byte por byte,
// al `prosrc` que la base tiene guardado.
//
// Se rompió una vez, de verdad, por dos motivos distintos y los dos invisibles
// a ojo: los archivos se escribieron con CRLF mientras a la base se le mandaba
// LF (todo difería por un \r por línea), y algunas funciones se aplicaron sin
// sus comentarios internos, con lo que la base quedó con un cuerpo distinto al
// del repo aunque el SQL hiciera exactamente lo mismo.
//
//   node scripts/check-academia-parity.mjs
//
// Imprime nombre + md5 del cuerpo tal como está en los archivos. Compará contra:
//
//   select proname, md5(prosrc) from pg_proc p
//     join pg_namespace n on n.oid = p.pronamespace
//    where n.nspname = 'public'
//      and (proname like 'ac\_%' or proname like 'academia\_%')
//    order by proname;
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ARCHIVOS = [
  'supabase/migrations/0077_academia_core.sql',
  'supabase/migrations/0078_academia_motor.sql',
  'supabase/migrations/0079_academia_semilla.sql',
];

// El delimitador de comillas de dólar no siempre es $fn$ —0079 usa $sem$— así
// que se captura cualquiera y se exige que cierre con el mismo.
const RE = new RegExp(
  'create or replace function\\s+([a-z_]+)\\s*\\([\\s\\S]*?as\\s+(\\$[a-z]*\\$)([\\s\\S]*?)\\2\\s*;',
  'gi',
);

const out = [];
for (const f of ARCHIVOS) {
  const s = readFileSync(f, 'utf8');
  if (s.includes('\r')) {
    console.error(`FALLA: ${f} tiene CRLF. El repo es LF (.gitattributes: eol=lf) y la base guarda lo que se le mandó.`);
    process.exit(1);
  }
  RE.lastIndex = 0;
  let m;
  while ((m = RE.exec(s))) {
    out.push({ nombre: m[1], md5: createHash('md5').update(m[3]).digest('hex'), largo: m[3].length });
  }
}

out.sort((a, b) => a.nombre.localeCompare(b.nombre));
for (const o of out) console.log(o.nombre.padEnd(26), o.md5, String(o.largo).padStart(6));
console.log(`\n${out.length} funciones en los archivos de migración.`);
