/**
 * Pip's pattern atlas — **one texture for all seven patterns**.
 *
 * Switching pattern moves `map.offset`; it never assigns a different texture
 * object and never creates a material, because either would be a shader
 * recompile and a visible hitch on cheap Android (`09-PIP.md` §4.3).
 *
 * The atlas is painted in a canvas rather than shipped as
 * `public/mundo/atlas/patterns.png`, which keeps the asset budget at zero and
 * means the paid patterns work the day the shop opens.
 */


export const PATTERN_IDS = ['ninguno', 'pecas', 'lunares', 'rayitas', 'hojitas', 'estrellas', 'olitas'] as const;

/** Atlas layout: 3 columns × 2 rows, one cell per pattern after `ninguno`. */
export const PATTERN_ATLAS = { cols: 3, rows: 2, cell: 128 } as const;

/**
 * The pattern atlas, painted once into **one** canvas texture.
 *
 * Switching pattern moves `map.offset`; it never assigns a different texture
 * object and never creates a material (`09-PIP.md` §4.3). Generating it rather
 * than shipping `atlas/patterns.png` keeps the asset budget at zero and means
 * the paid patterns work the day the shop opens.
 */
export function buildPatternAtlas(): HTMLCanvasElement {
  const { cols, rows, cell } = PATTERN_ATLAS;
  const canvas = document.createElement('canvas');
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';

  const cellAt = (index: number) => {
    ctx.save();
    ctx.translate((index % cols) * cell, Math.floor(index / cols) * cell);
    ctx.beginPath();
    ctx.rect(0, 0, cell, cell);
    ctx.clip();
  };

  // 0 pecas — a light freckle scatter across the cheeks.
  cellAt(0);
  for (let i = 0; i < 26; i++) {
    const a = (i * 2.399963) % (Math.PI * 2);
    const r = (i / 26) * cell * 0.42;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(cell / 2 + Math.cos(a) * r, cell / 2 + Math.sin(a) * r, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 1 lunares — bigger, sparser dots.
  cellAt(1);
  ctx.globalAlpha = 0.85;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      ctx.beginPath();
      ctx.arc((x + (y % 2 ? 0.75 : 0.25)) * (cell / 4), (y + 0.5) * (cell / 4), 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 2 rayitas — horizontal stripes.
  cellAt(2);
  ctx.globalAlpha = 0.7;
  for (let y = 0; y < 7; y++) ctx.fillRect(0, y * (cell / 7) + 6, cell, 9);
  ctx.restore();

  // 3 hojitas — small leaves.
  cellAt(3);
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 9; i++) {
    const x = ((i % 3) + 0.5) * (cell / 3);
    const y = (Math.floor(i / 3) + 0.5) * (cell / 3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(i * 0.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 4 estrellas — four-point sparks.
  cellAt(4);
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 7; i++) {
    const x = ((i % 3) + 0.5) * (cell / 3);
    const y = (Math.floor(i / 3) + 0.5) * (cell / 3);
    ctx.save();
    ctx.translate(x, y);
    for (let k = 0; k < 4; k++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(5, 5, 0, 17);
      ctx.quadraticCurveTo(-5, 5, 0, 0);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  // 5 olitas — a wave band.
  cellAt(5);
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (let y = 0; y < 5; y++) {
    ctx.beginPath();
    for (let x = 0; x <= cell; x += 8) {
      const py = y * (cell / 5) + 14 + Math.sin(x * 0.09) * 6;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  return canvas;
}

/** The atlas offset for a pattern id, or `null` for `ninguno`. */
export function patternOffset(id: string): [number, number] | null {
  const index = PATTERN_IDS.indexOf(id as (typeof PATTERN_IDS)[number]);
  if (index <= 0) return null;
  const cell = index - 1;
  const { cols, rows } = PATTERN_ATLAS;
  // Texture V runs bottom-up; the canvas is painted top-down.
  return [(cell % cols) / cols, 1 - 1 / rows - Math.floor(cell / cols) / rows];
}
