// Generate the Brote PWA icon set (BUILD_SPEC §12.1) from inline SVG → PNG.
// Run: `node scripts/gen-icons.mjs`. Requires `sharp` (devDependency).
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const INK = '#0C1A13';
const GREEN = '#1FB57A';
const LIME = '#9CC93B';
const DEEP = '#0E7A52';
const SUN = '#FFB23E';

/** The sprout mark, centered in a `size` viewBox. `pad` = inner padding fraction. */
function sprout(size, { bg, pad = 0.22, mono = false } = {}) {
  const s = size;
  const cx = s / 2;
  const stroke = mono ? '#ffffff' : DEEP;
  const leafA = mono ? '#ffffff' : GREEN;
  const leafB = mono ? '#ffffff' : LIME;
  const seed = mono ? '#ffffff' : SUN;
  const stemW = s * 0.06;
  const stemTop = s * (0.5 - pad * 0.2);
  const stemBot = s * (1 - pad);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  ${bg ? `<rect width="${s}" height="${s}" fill="${bg}"/>` : ''}
  <rect x="${cx - stemW / 2}" y="${stemTop}" width="${stemW}" height="${stemBot - stemTop}" rx="${stemW / 2}" fill="${stroke}"/>
  <path d="M ${cx} ${s * 0.56} C ${cx} ${s * 0.56}, ${s * 0.2} ${s * 0.56}, ${s * 0.14} ${s * 0.34}
           C ${s * 0.36} ${s * 0.28}, ${cx} ${s * 0.4}, ${cx} ${s * 0.56} Z" fill="${leafA}"/>
  <path d="M ${cx} ${s * 0.5} C ${cx} ${s * 0.5}, ${s * 0.8} ${s * 0.5}, ${s * 0.86} ${s * 0.28}
           C ${s * 0.64} ${s * 0.22}, ${cx} ${s * 0.34}, ${cx} ${s * 0.5} Z" fill="${leafB}"/>
  <circle cx="${cx}" cy="${s * 0.26}" r="${s * 0.085}" fill="${seed}"/>
</svg>`;
}

async function render(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(outDir, name));
  console.log('✓', name);
}

// Standard (rounded ink tile), maskable (full-bleed ink, more padding for safe area),
// apple-touch (ink), monochrome badge (white sprout, transparent).
const rounded = (s) => {
  const r = Math.round(s * 0.22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${r}" fill="${INK}"/></svg>`;
};

async function any(size, name, { maskable = false, apple = false } = {}) {
  const base = maskable
    ? sprout(size, { bg: INK, pad: 0.3 })
    : apple
      ? sprout(size, { bg: INK, pad: 0.24 })
      : null;
  if (base) {
    await render(base, size, name);
    return;
  }
  // Rounded tile + sprout overlay.
  const tile = await sharp(Buffer.from(rounded(size))).png().toBuffer();
  const mark = await sharp(Buffer.from(sprout(size, { pad: 0.26 }))).png().toBuffer();
  await sharp(tile).composite([{ input: mark }]).png().toFile(join(outDir, name));
  console.log('✓', name);
}

await any(192, 'icon-192.png');
await any(256, 'icon-256.png');
await any(384, 'icon-384.png');
await any(512, 'icon-512.png');
await any(512, 'maskable-512.png', { maskable: true });
await any(180, 'apple-touch-icon.png', { apple: true });
await render(sprout(96, { mono: true }), 96, 'badge-96.png');

// A simple OG image (1200x630) on the ink background with the mark.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${INK}"/>
  <text x="600" y="330" font-family="sans-serif" font-size="86" font-weight="800" fill="#F7F5EF" text-anchor="middle">Brote</text>
  <text x="600" y="400" font-family="sans-serif" font-size="38" fill="${GREEN}" text-anchor="middle">Hacé crecer tu mundo.</text>
</svg>`;
await sharp(Buffer.from(sprout(220, { pad: 0.1 })))
  .png()
  .toBuffer()
  .then(async (mark) => {
    await sharp(Buffer.from(og)).composite([{ input: mark, top: 110, left: 490 }]).png().toFile(join(__dirname, '..', 'public', 'og.png'));
    console.log('✓ og.png');
  });

console.log('Done.');
