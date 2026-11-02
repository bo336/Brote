import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const leer = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8');

function archivos(dir: string): string[] {
  return fs.readdirSync(path.join(process.cwd(), dir), { withFileTypes: true }).flatMap((e) => {
    const p = `${dir}/${e.name}`;
    return e.isDirectory() ? archivos(p) : /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

test('the panel opens only for the owner account, and says nothing to anyone else', () => {
  const layout = leer('app/panel/layout.tsx');
  assert.match(layout, /auth\.getUser\(\)/);
  assert.match(layout, /rpc\('admin_check'/);
  assert.match(layout, /notFound\(\)/);
  assert.ok(!fs.existsSync(path.join(process.cwd(), 'app/(app)/panel')), 'the old route must be gone');
});

test('no panel screen asks for a password again', () => {
  for (const f of [...archivos('app/panel'), ...archivos('components/panel')]) {
    const s = leer(f);
    assert.ok(!/CandadoPanel|setPass\b/.test(s), `${f} still has the old lock`);
    assert.ok(!/type="password"/.test(s), `${f} still has a password field`);
  }
});

test('the database ignores the password and checks the account', () => {
  const sql = leer('supabase/migrations/0136_panel_solo_cuenta.sql');
  assert.match(sql, /brote_es_admin\(auth\.uid\(\)\)/);
  assert.ok(!/crypt\(p_pass/.test(sql), 'admin_check must not compare passwords');
});

test('a lesson step is never mounted inside an exit-waiting AnimatePresence', () => {
  // `layoutId` items in the sorting steps register with the presence and never
  // release it: the old step stays at opacity 0 and the next one never mounts.
  // That was the blank screen in the middle of a lesson.
  const s = leer('components/academia/Jugador.tsx');
  assert.ok(!/import \{[^}]*AnimatePresence[^}]*\} from 'framer-motion'/.test(s), 'no AnimatePresence in the player');
  assert.match(s, /<LayoutGroup key=\{paso\.entrega_id\}/);
  assert.match(s, /<PasoSeguro\b/);
});
