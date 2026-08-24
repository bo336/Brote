'use client';

/**
 * Miniaturas de las decoraciones del mundo, dibujadas a mano en SVG.
 *
 * Son un dibujo aparte del modelo 3D, no una captura: la tienda tiene que
 * cargar rápido y no puede montar un canvas por tarjeta. Cada una imita la
 * silueta y los colores de lo que se arma en `WorldDecorations`, para que lo
 * que ves acá sea lo que aparece en la isla.
 */

const WOOD = '#8B6A45';
const WOOD_DARK = '#6B4F31';
const LEAF = '#3E8E52';
const LEAF_DEEP = '#256B3A';

function Ground() {
  return <ellipse cx="60" cy="70" rx="34" ry="6" fill="#000" opacity="0.08" />;
}

const ART: Record<string, React.ReactNode> = {
  mundo_comedero: (
    <>
      <Ground />
      <rect x="57" y="34" width="6" height="34" rx="3" fill={WOOD_DARK} />
      <rect x="42" y="30" width="36" height="5" rx="2.5" fill={WOOD} />
      <path d="M40 30 L60 16 L80 30 Z" fill="#B4553F" />
      <rect x="47" y="35" width="26" height="7" rx="2" fill={WOOD} />
      <circle cx="52" cy="39" r="1.6" fill="#F2D992" />
      <circle cx="60" cy="39" r="1.6" fill="#F2D992" />
      <circle cx="68" cy="39" r="1.6" fill="#F2D992" />
      <circle cx="80" cy="26" r="4" fill="#F2B33D" />
      <circle cx="81.5" cy="25" r="0.9" fill="#2A1E12" />
    </>
  ),
  mundo_banco: (
    <>
      <Ground />
      <rect x="34" y="44" width="52" height="6" rx="3" fill={WOOD} />
      <rect x="34" y="34" width="52" height="5" rx="2.5" fill={WOOD} />
      <rect x="38" y="50" width="5" height="18" rx="2" fill={WOOD_DARK} />
      <rect x="77" y="50" width="5" height="18" rx="2" fill={WOOD_DARK} />
      <rect x="38" y="32" width="5" height="14" rx="2" fill={WOOD_DARK} />
      <rect x="77" y="32" width="5" height="14" rx="2" fill={WOOD_DARK} />
    </>
  ),
  mundo_hamaca: (
    <>
      <Ground />
      <rect x="26" y="20" width="6" height="48" rx="3" fill={WOOD_DARK} />
      <rect x="88" y="20" width="6" height="48" rx="3" fill={WOOD_DARK} />
      <path d="M30 26 C 46 62, 74 62, 90 26" stroke="#E8935C" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M30 26 C 46 56, 74 56, 90 26" stroke="#FFC38A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="26" cy="16" r="7" fill={LEAF} />
      <circle cx="94" cy="16" r="7" fill={LEAF} />
    </>
  ),
  mundo_colmena: (
    <>
      <Ground />
      <rect x="42" y="46" width="36" height="10" rx="2" fill="#E8C87A" />
      <rect x="44" y="36" width="32" height="10" rx="2" fill="#F2D992" />
      <rect x="46" y="26" width="28" height="10" rx="2" fill="#E8C87A" />
      <path d="M44 26 L60 16 L76 26 Z" fill={WOOD_DARK} />
      <rect x="40" y="56" width="40" height="5" rx="2" fill={WOOD} />
      <circle cx="58" cy="51" r="2.4" fill="#4A3520" />
      <g fill="#F2B33D">
        <circle cx="88" cy="32" r="3" /><circle cx="34" cy="40" r="2.4" />
      </g>
    </>
  ),
  mundo_farolitos: (
    <>
      <Ground />
      <path d="M14 22 C 40 46, 80 46, 106 22" stroke={WOOD_DARK} strokeWidth="2.5" fill="none" />
      {[
        [30, 34],
        [48, 42],
        [72, 42],
        [90, 34],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y! + 8} r="9" fill="#FFD24A" opacity="0.28" />
          <rect x={x! - 5} y={y!} width="10" height="12" rx="3" fill="#FFD24A" />
          <rect x={x! - 5} y={y!} width="10" height="12" rx="3" fill="#fff" opacity="0.25" />
          <rect x={x! - 2} y={y! - 3} width="4" height="3" rx="1" fill={WOOD_DARK} />
        </g>
      ))}
    </>
  ),
  mundo_arco: (
    <>
      <Ground />
      <path d="M32 68 L32 40 C 32 20, 88 20, 88 40 L 88 68" stroke={WOOD} strokeWidth="6" fill="none" />
      <path d="M32 68 L32 40 C 32 20, 88 20, 88 40 L 88 68" stroke={LEAF_DEEP} strokeWidth="3" fill="none" opacity="0.6" />
      {[
        [36, 34],
        [48, 23],
        [60, 20],
        [72, 23],
        [84, 34],
        [32, 52],
        [88, 52],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.6" fill={i % 2 ? '#FF8FA3' : '#F2D992'} />
      ))}
    </>
  ),
  mundo_huerta: (
    <>
      <Ground />
      <rect x="24" y="42" width="72" height="24" rx="3" fill="#7A5636" />
      <rect x="24" y="42" width="72" height="5" rx="2.5" fill={WOOD} />
      {[34, 52, 70, 88].map((x, i) => (
        <g key={i}>
          <rect x={x - 2} y="46" width="4" height="14" rx="2" fill={LEAF_DEEP} />
          <circle cx={x} cy="44" r="6" fill={LEAF} />
          <circle cx={x - 4} cy="47" r="4" fill={LEAF} />
          <circle cx={x + 4} cy="47" r="4" fill={LEAF} />
        </g>
      ))}
    </>
  ),
  mundo_totem: (
    <>
      <Ground />
      <ellipse cx="60" cy="62" rx="20" ry="7" fill="#8C8C86" />
      <ellipse cx="60" cy="50" rx="15" ry="6" fill="#A3A39C" />
      <ellipse cx="60" cy="40" rx="11" ry="5" fill="#8C8C86" />
      <ellipse cx="60" cy="32" rx="7.5" ry="4" fill="#A3A39C" />
      <ellipse cx="60" cy="26" rx="4.5" ry="3" fill="#767670" />
      <path d="M44 46 q 6 3 12 0" stroke="#6E6E68" strokeWidth="1.5" fill="none" opacity="0.6" />
    </>
  ),
  mundo_carpa: (
    <>
      <Ground />
      <path d="M26 66 L60 22 L94 66 Z" fill="#D9603F" />
      <path d="M60 22 L94 66 L78 66 L60 34 Z" fill="#B4553F" />
      <path d="M60 34 L74 66 L46 66 Z" fill="#2A1E12" opacity="0.55" />
      <path d="M26 66 L94 66" stroke={WOOD_DARK} strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="56" r="4" fill="#F2B33D" opacity="0.8" />
    </>
  ),
  mundo_molino: (
    <>
      <Ground />
      <path d="M48 68 L52 30 L68 30 L72 68 Z" fill="#E8E2D4" />
      <path d="M60 30 L60 68" stroke="#CFC7B5" strokeWidth="1.5" />
      <path d="M46 30 L60 18 L74 30 Z" fill="#B4553F" />
      <g stroke={WOOD} strokeWidth="4.5" strokeLinecap="round">
        <path d="M60 32 L60 8" /><path d="M60 32 L84 32" />
        <path d="M60 32 L60 56" /><path d="M60 32 L36 32" />
      </g>
      <circle cx="60" cy="32" r="4" fill={WOOD_DARK} />
      <rect x="55" y="56" width="10" height="12" rx="1.5" fill={WOOD_DARK} />
    </>
  ),
};

export function DecorationPreview({ slug, size = 78 }: { slug: string; size?: number }) {
  const art = ART[slug];
  if (!art) return null;
  return (
    <svg viewBox="0 0 120 78" width={size * 1.4} height={size} role="img" aria-hidden>
      {art}
    </svg>
  );
}
