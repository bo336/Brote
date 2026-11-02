import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { textoAdsTxt } from '../ads-txt';

test('ads.txt: la línea de Google lleva pub- sin el ca- del cliente', () => {
  const t = textoAdsTxt('ca-pub-1234567890123456', '');
  assert.ok(t.includes('google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n'));
  assert.ok(!t.includes('ca-pub'));
});

test('ads.txt: sin cliente queda sólo el comentario, sin una línea rota', () => {
  const t = textoAdsTxt('', '');
  assert.ok(!t.includes('google.com'));
  assert.ok(t.split('\n').filter(Boolean).every((l) => l.startsWith('#')));
});

test('ads.txt: las líneas extra válidas pasan (renglones o ;) y las raras no', () => {
  const t = textoAdsTxt('ca-pub-1234567890123456', 'example.com, 123, RESELLER; otra.net, abc-1, DIRECT, f1\n<script>; foo');
  assert.ok(t.includes('example.com, 123, RESELLER\n'));
  assert.ok(t.includes('otra.net, abc-1, DIRECT, f1\n'));
  assert.ok(!t.includes('script'));
  assert.ok(!t.includes('foo'));
});
