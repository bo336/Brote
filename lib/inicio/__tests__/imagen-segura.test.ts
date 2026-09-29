import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { imagenSegura } from '../../imagen-segura';

/**
 * The broken pictures in the Plaza: a third of the news "images" the feeds
 * declare are not pictures. These are the real cases found in `news.image_url`.
 */

test('a YouTube player becomes its thumbnail', () => {
  assert.equal(imagenSegura('https://www.youtube.com/embed/03vsr1zbV0k'), 'https://i.ytimg.com/vi/03vsr1zbV0k/hqdefault.jpg');
  assert.equal(imagenSegura('https://youtu.be/dQw4w9WgXcQ'), 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  assert.equal(
    imagenSegura('https://www.youtube.com/watch?v=F_UdaWRjaKQ&t=3'),
    'https://i.ytimg.com/vi/F_UdaWRjaKQ/hqdefault.jpg',
  );
});

test('video players, video files and emoji sprites are not pictures', () => {
  assert.equal(imagenSegura('https://player.vimeo.com/video/1194030503?dnt=1&#038;app_id=122963'), null);
  assert.equal(imagenSegura('https://videos.files.wordpress.com/abc/clip.mp4'), null);
  assert.equal(imagenSegura('https://s.w.org/images/core/emoji/15.0.3/72x72/1f331.png'), null);
  assert.equal(imagenSegura('https://example.com/wp-includes/images/smilies/icon_smile.gif'), null);
  assert.equal(imagenSegura('https://www.youtube.com/channel/UC123'), null);
});

test('real pictures pass, http is upgraded and feed entities are decoded', () => {
  const u = 'https://static.construible.es/media/2026/09/eu-peers-formacion-financiacion-rehabilitacion.jpg';
  assert.equal(imagenSegura(u), u);
  assert.equal(imagenSegura('http://imgs.mongabay.com/a.jpg'), 'https://imgs.mongabay.com/a.jpg');
  assert.equal(imagenSegura('https://x.com/a.jpg?w=1&amp;h=2'), 'https://x.com/a.jpg?w=1&h=2');
  assert.equal(imagenSegura('//cdn.example.com/a.png'), 'https://cdn.example.com/a.png');
});

test('empty, relative app paths and junk', () => {
  assert.equal(imagenSegura(null), null);
  assert.equal(imagenSegura(''), null);
  assert.equal(imagenSegura('   '), null);
  assert.equal(imagenSegura('/mundo/poster-t1.jpg'), '/mundo/poster-t1.jpg');
  assert.equal(imagenSegura('javascript:alert(1)'), null);
  assert.equal(imagenSegura('not a url'), null);
});

test('the edge function keeps an identical copy', () => {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  const bloque = (f: string) => {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    const a = s.indexOf('// ── imagenSegura:start');
    const b = s.indexOf('// ── imagenSegura:end');
    assert.ok(a >= 0 && b > a, `${f} lost its markers`);
    return s.slice(a, b);
  };
  assert.equal(bloque('supabase/functions/_shared/imagen.ts'), bloque('lib/imagen-segura.ts'));
});
