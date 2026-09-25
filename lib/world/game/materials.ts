/**
 * What you carry: the materials, the litter kinds and the tools.
 *
 * Copy is here and not in `messages/*.json` on purpose (`docs/MUNDO_JUEGO.md`
 * D6): every page of the app ships the whole messages file, and the game's
 * words only need to reach people who open the game. The world is Spanish-only
 * (`18-DECISIONS.md` T15).
 */
import type { BinId, MaterialId, ToolId, WasteKind } from './types';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  /** One-word label for the bag chip. */
  short: string;
  /** Accent for icons and the floating "+1". */
  color: string;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  residuos: { id: 'residuos', name: 'Residuos', short: 'Residuos', color: '#8FA3AD' },
  hojas: { id: 'hojas', name: 'Orgánicos', short: 'Orgánico', color: '#9C7A3C' },
  ramas: { id: 'ramas', name: 'Ramas', short: 'Ramas', color: '#7A5234' },
  piedras: { id: 'piedras', name: 'Piedras', short: 'Piedras', color: '#9A958C' },
  frutos: { id: 'frutos', name: 'Frutos y semillas', short: 'Frutos', color: '#C8553D' },
  compost: { id: 'compost', name: 'Compost', short: 'Compost', color: '#4B3524' },
  plantines: { id: 'plantines', name: 'Plantines', short: 'Plantines', color: '#5FA84A' },
  reciclado: { id: 'reciclado', name: 'Material reciclado', short: 'Reciclado', color: '#2DB4D4' },
};

/** The order the bag lists them in: raw first, then what you made. */
export const MATERIAL_ORDER: MaterialId[] = [
  'residuos', 'hojas', 'ramas', 'piedras', 'frutos', 'compost', 'plantines', 'reciclado',
];

// ── Litter ─────────────────────────────────────────────────────────────────

export interface WasteDef {
  kind: WasteKind;
  name: string;
  bin: BinId;
  /** How often it washes up, relative. */
  weight: number;
  /**
   * The one line you get when you sort it — right or wrong. It is the lesson,
   * so it says *why*, in under twenty words, and never scolds.
   */
  why: string;
}

/**
 * The litter of the island. Bins follow the common Argentine municipal split:
 * reciclables secos, orgánicos (húmedos), resto, and special collection for
 * batteries. Claims kept conservative on purpose: what a municipality accepts
 * varies, and the lines say "casi siempre" where it does.
 */
export const WASTE: Record<WasteKind, WasteDef> = {
  botella: {
    kind: 'botella', name: 'Botella de plástico', bin: 'reciclable', weight: 5,
    why: 'Vacía, enjuagada y aplastada. El PET vuelve como fibra, bandejas o botellas nuevas.',
  },
  lata: {
    kind: 'lata', name: 'Lata de aluminio', bin: 'reciclable', weight: 3,
    why: 'El aluminio se recicla una y otra vez sin perder calidad, y ahorra casi toda la energía.',
  },
  papel: {
    kind: 'papel', name: 'Papel', bin: 'reciclable', weight: 3,
    why: 'Seco y limpio se recicla. Con grasa o mojado ya no sirve: ese va a resto.',
  },
  carton: {
    kind: 'carton', name: 'Caja de cartón', bin: 'reciclable', weight: 2,
    why: 'Desarmada ocupa menos. Si tiene restos de comida, va a resto.',
  },
  tetra: {
    kind: 'tetra', name: 'Envase de cartón de leche', bin: 'reciclable', weight: 2,
    why: 'Son capas de cartón, plástico y aluminio. Enjuagado y aplastado va con los reciclables.',
  },
  vidrio: {
    kind: 'vidrio', name: 'Frasco de vidrio', bin: 'reciclable', weight: 2,
    why: 'Entero y limpio. El vidrio se funde y vuelve a ser vidrio, sin límite.',
  },
  bolsa: {
    kind: 'bolsa', name: 'Bolsa de plástico', bin: 'reciclable', weight: 3,
    why: 'Limpia y seca va con los reciclables. Mejor todavía: una bolsa que se usa muchas veces.',
  },
  yerba: {
    kind: 'yerba', name: 'Yerba usada', bin: 'organico', weight: 3,
    why: 'La yerba usada es de lo mejor para compostar: aporta nitrógeno y se degrada rápido.',
  },
  cascara: {
    kind: 'cascara', name: 'Cáscara de fruta', bin: 'organico', weight: 3,
    why: 'En la compostera, en unas semanas vuelve a ser tierra. En el relleno, genera metano.',
  },
  colilla: {
    kind: 'colilla', name: 'Colilla de cigarrillo', bin: 'resto', weight: 2,
    why: 'No se recicla y suelta tóxicos en el agua. Nunca al piso: siempre a resto.',
  },
  telgopor: {
    kind: 'telgopor', name: 'Bandeja de telgopor', bin: 'resto', weight: 1,
    why: 'Casi ningún lugar lo recicla y dura siglos. Lo mejor es no traerlo.',
  },
  pila: {
    kind: 'pila', name: 'Pila usada', bin: 'especial', weight: 1,
    why: 'Las pilas nunca van a la basura: tienen metales pesados. Van a un punto de recolección especial.',
  },
};

export const WASTE_KINDS = Object.keys(WASTE) as WasteKind[];

export const BINS: Record<BinId, { name: string; color: string; hint: string }> = {
  reciclable: { name: 'Reciclables', color: '#2F9E5B', hint: 'Secos y limpios' },
  organico: { name: 'Orgánicos', color: '#8A5A2B', hint: 'Para compostar' },
  resto: { name: 'Resto', color: '#4A5058', hint: 'Lo que no se recupera' },
  especial: { name: 'Especiales', color: '#C8423A', hint: 'Pilas y tóxicos' },
};

/** What a correctly sorted piece becomes. Resto and especiales become nothing but a clean island. */
export const SORT_YIELD: Record<BinId, { material: MaterialId | null; semillas: number }> = {
  reciclable: { material: 'reciclado', semillas: 1 },
  organico: { material: 'hojas', semillas: 1 },
  resto: { material: null, semillas: 1 },
  especial: { material: null, semillas: 3 },
};

// ── Tools ──────────────────────────────────────────────────────────────────

export interface ToolDef {
  id: ToolId;
  name: string;
  /** What the number means, for the shop line. */
  unit: string;
  /** Value at level 1..4 (index 0 is level 1, which everybody starts with). */
  values: number[];
  /** Semillas to reach level 2..4 (index 0 is the price of level 2). */
  prices: number[];
  /** Rank tier needed to buy level 2..4. */
  tiers: number[];
  what: string;
}

export const TOOLS: Record<ToolId, ToolDef> = {
  mochila: {
    id: 'mochila', name: 'Mochila', unit: 'cosas', values: [30, 50, 80, 120],
    prices: [150, 420, 950], tiers: [1, 3, 6],
    what: 'Cuántas cosas llevás antes de tener que ir a una estación.',
  },
  regadera: {
    id: 'regadera', name: 'Regadera', unit: 'riegos', values: [4, 8, 14, 22],
    prices: [120, 320, 750], tiers: [1, 3, 6],
    what: 'Cuántas parcelas regás antes de volver a cargar agua.',
  },
  guantes: {
    id: 'guantes', name: 'Guantes', unit: 'm de alcance', values: [1.5, 2.2, 3, 3.8],
    prices: [100, 280, 650], tiers: [1, 2, 5],
    what: 'Desde qué distancia juntás lo que está en el piso al pasar.',
  },
};

export const TOOL_ORDER: ToolId[] = ['mochila', 'regadera', 'guantes'];

export function toolValue(tool: ToolId, level: number): number {
  const v = TOOLS[tool].values;
  return v[Math.max(0, Math.min(v.length - 1, level - 1))]!;
}
