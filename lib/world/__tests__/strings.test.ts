import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

/**
 * **Every string ships from `messages/es.json`. No inline strings. No English
 * strings.** (`20-ACCEPTANCE.md` 5A.)
 *
 * A grep, like `no-xp.test.ts`, because the rule erodes one hard-coded label at
 * a time and nobody notices until a locale switch turns half the world English.
 *
 * What counts as a violation is narrow on purpose: a **rendered** literal in
 * JSX, or a string handed to something that shows it. Class names, ids, keys,
 * slugs and comments are not copy, and a test that flagged them would be
 * switched off within a week.
 */
function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}

const ROOT = repoRoot(__dirname);
const ROOTS = ['components/mundo3d', 'lib/world', 'lib/render'];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (['.ts', '.tsx'].includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

/** Strip comments, so prose about the code is never mistaken for copy. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

test('**no rendered text is hard-coded in the world**', () => {
  // Text between JSX tags: `<p>Hola</p>`. The only legitimate ones are
  // interpolations, which start with `{`.
  const hits: string[] = [];
  for (const root of ROOTS) {
    for (const file of walk(path.join(ROOT, root))) {
      const source = code(fs.readFileSync(file, 'utf8'));
      // A run of letters with a space in it, sitting between two tags.
      const re = />\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][^<>{}]*\s[^<>{}]*?)\s*</g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(source)) !== null) {
        const text = m[1]!.trim();
        // Two or more words of real prose is copy; anything shorter is almost
        // always punctuation or a unit that lives in the markup.
        if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][\wÁÉÍÓÚÜÑáéíóúüñ]*(\s+[\wÁÉÍÓÚÜÑáéíóúüñ]+){1,}$/.test(text)) {
          hits.push(`${path.relative(ROOT, file)} → "${text}"`);
        }
      }
    }
  }
  assert.deepEqual(hits, [], `hard-coded rendered text:\n${hits.join('\n')}`);
});

test('**no Spanish copy is hard-coded in an attribute the player reads**', () => {
  // `aria-label="Cerrar"` and `placeholder="Tu correo"` are copy too, and they
  // are the ones a locale switch forgets.
  const hits: string[] = [];
  const attrs = ['aria-label', 'placeholder', 'title', 'alt'];
  for (const root of ROOTS) {
    for (const file of walk(path.join(ROOT, root))) {
      const source = code(fs.readFileSync(file, 'utf8'));
      for (const attr of attrs) {
        const re = new RegExp(`${attr}=\\"([^\\"]{2,})\\"`, 'g');
        let m: RegExpExecArray | null;
        while ((m = re.exec(source)) !== null) hits.push(`${path.relative(ROOT, file)} → ${attr}="${m[1]}"`);
      }
    }
  }
  assert.deepEqual(hits, [], `hard-coded attribute copy:\n${hits.join('\n')}`);
});

test('the Spanish and English bundles have the same shape', () => {
  // A key in one and not the other is a blank on somebody's screen.
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'es.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'en.json'), 'utf8'));

  const keys = (node: unknown, prefix = ''): string[] => {
    if (typeof node !== 'object' || node === null) return [prefix];
    return Object.entries(node as Record<string, unknown>)
      .flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
  };
  const esKeys = new Set(keys(es.mundo, 'mundo'));
  const enKeys = new Set(keys(en.mundo, 'mundo'));
  const missingEn = [...esKeys].filter((k) => !enKeys.has(k));
  const missingEs = [...enKeys].filter((k) => !esKeys.has(k));
  assert.deepEqual(missingEn, [], `missing from en.json:\n${missingEn.join('\n')}`);
  assert.deepEqual(missingEs, [], `missing from es.json:\n${missingEs.join('\n')}`);
});

test('no message is an empty string', () => {
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'es.json'), 'utf8'));
  const empty: string[] = [];
  const walkMessages = (node: unknown, prefix: string) => {
    if (typeof node === 'string') {
      if (node.trim() === '') empty.push(prefix);
      return;
    }
    if (typeof node !== 'object' || node === null) return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      walkMessages(v, prefix ? `${prefix}.${k}` : k);
    }
  };
  walkMessages(es.mundo, 'mundo');
  assert.deepEqual(empty, []);
});
