'use client';

/**
 * Las piezas que comparten los renderers de pasos del Árbol.
 *
 * LA REGLA: tocar-para-elegir y tocar-para-colocar es el camino PRINCIPAL, no
 * el plan B de un arrastre. Un ejercicio que solo se resuelve arrastrando no
 * se resuelve con teclado, ni con lector de pantalla, ni con el celular
 * apoyado en la mesa. Todo lo que se toca es un `<button>` de verdad: eso trae
 * gratis el foco, Enter, la barra espaciadora y el rol.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { BookOpenText, ChevronDown } from 'lucide-react';
import type { Correccion, Datos, Respuesta } from '@/lib/academia/modelo';
import { cn } from '@/lib/utils/cn';

export interface PropsPaso<P> {
  payload: P;
  /** Se llama con `null` mientras la respuesta esté incompleta. */
  onCambio: (r: Respuesta | null) => void;
  /** Después de responder no se toca más nada. */
  bloqueado: boolean;
  /** La corrección, cuando llegó. Antes de eso, `null`. */
  correccion: Correccion | null;
  /** Color de la rama, para los acentos. */
  color: string;
}

/**
 * Le avisa al padre cuál es la respuesta sin depender de que su callback sea
 * estable. La dependencia real es el VALOR (serializado: son objetos chicos),
 * no la identidad de la función ni del objeto: con un arrow en línea del padre
 * esto era un bucle de render infinito (medido en el Bosque, fase 2).
 */
export function useReportar(onCambio: (r: Respuesta | null) => void, respuesta: Respuesta | null) {
  const ultimo = useRef(onCambio);
  ultimo.current = onCambio;
  const serial = JSON.stringify(respuesta ?? null);
  useEffect(() => {
    ultimo.current(serial === 'null' ? null : (JSON.parse(serial) as Respuesta));
  }, [serial]);
}

/** Cómo se pinta una ficha una vez corregida. */
export type Marca = 'ninguna' | 'bien' | 'mal' | 'era';

export function Enunciado({ texto, ayuda }: { texto: string; ayuda?: string | null }) {
  return (
    <div className="mb-4">
      <h2 className="text-balance font-display text-h2 font-bold leading-snug">{texto}</h2>
      {ayuda ? <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{ayuda}</p> : null}
    </div>
  );
}

/**
 * Lo que acompaña a una pregunta: un caso y/o un gráfico.
 *
 * El caso se puede plegar: en un teléfono, un caso de ocho líneas empuja la
 * pregunta fuera de la pantalla. Arranca abierto (es la primera vez que se lee)
 * y se pliega solo una vez que se respondió.
 */
export function Adjuntos({
  contexto,
  datos,
  color,
  plegado,
}: {
  contexto?: string;
  datos?: Datos;
  color: string;
  plegado?: boolean;
}) {
  const t = useTranslations('arbol');
  const [abierto, setAbierto] = useState(true);
  useEffect(() => {
    if (plegado) setAbierto(false);
  }, [plegado]);
  if (!contexto && !datos) return null;
  return (
    <div className="mb-4 space-y-3">
      {contexto ? (
        <div className="overflow-hidden rounded-card border border-hairline bg-surface-2" style={{ borderLeft: `4px solid ${color}` }}>
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <BookOpenText className="h-4 w-4 shrink-0" style={{ color }} aria-hidden />
            <span className="eyebrow flex-1" style={{ color }}>
              {t('caso')}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', abierto && 'rotate-180')} aria-hidden />
          </button>
          {abierto ? <p className="px-3.5 pb-3.5 text-small leading-relaxed">{contexto}</p> : null}
        </div>
      ) : null}
      {datos ? <Grafico datos={datos} color={color} /> : null}
    </div>
  );
}

/**
 * Un gráfico chico dibujado a mano: barras horizontales o una tabla.
 *
 * Barras horizontales y no verticales porque en un teléfono las etiquetas
 * largas ("Carne vacuna de feedlot") no entran debajo de una barra angosta.
 * Cada fila dice su valor en texto: el largo de la barra ayuda a comparar, el
 * número es el dato, y un lector de pantalla lee la tabla semántica.
 */
export function Grafico({ datos, color }: { datos: Datos; color: string }) {
  const quieto = useReducedMotion();
  if (datos.tipo === 'tabla') {
    return (
      <figure className="overflow-x-auto rounded-card border border-hairline">
        <figcaption className="border-b border-hairline bg-surface-2 px-3.5 py-2 text-caption font-semibold">{datos.titulo}</figcaption>
        <table className="w-full text-left text-small">
          <thead>
            <tr className="border-b border-hairline text-caption uppercase tracking-wide text-muted-foreground">
              {datos.columnas.map((c) => (
                <th key={c} scope="col" className="px-3.5 py-2 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {datos.filas.map((f, i) => (
              <tr key={i} className="transition-colors hover:bg-surface-2">
                {f.map((celda, j) => (
                  <td key={j} className={cn('px-3.5 py-2', j > 0 && 'tnum')}>
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {datos.nota ? <p className="border-t border-hairline px-3.5 py-2 text-caption text-muted-foreground">{datos.nota}</p> : null}
      </figure>
    );
  }

  const max = Math.max(...datos.filas.map((f) => f.valor), 0) || 1;
  const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
  return (
    <figure className="rounded-card border border-hairline p-3.5">
      <figcaption className="mb-2.5 text-caption font-semibold">
        {datos.titulo} <span className="font-normal text-muted-foreground">· {datos.unidad}</span>
      </figcaption>
      <table className="sr-only">
        <tbody>
          {datos.filas.map((f) => (
            <tr key={f.etiqueta}>
              <th scope="row">{f.etiqueta}</th>
              <td>
                {fmt.format(f.valor)} {datos.unidad}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="space-y-2" aria-hidden>
        {datos.filas.map((f, i) => (
          <li key={f.etiqueta} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-2.5 sm:grid-cols-[minmax(0,12rem)_1fr]">
            <span className="truncate text-caption" title={f.etiqueta}>
              {f.etiqueta}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3.5 flex-1 overflow-hidden rounded-pill bg-muted">
                <motion.span
                  className="block h-full rounded-pill"
                  style={{ backgroundColor: color }}
                  initial={quieto ? false : { width: 0 }}
                  animate={{ width: `${Math.max(1.5, (f.valor / max) * 100)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
              <span className="tnum w-16 shrink-0 text-right text-caption font-semibold">{fmt.format(f.valor)}</span>
            </span>
          </li>
        ))}
      </ul>
      {datos.nota ? <p className="mt-2.5 text-caption text-muted-foreground">{datos.nota}</p> : null}
    </figure>
  );
}

/** Una ficha tocable: opción, fragmento, palabra del banco, lo que sea. */
export function Ficha({
  children,
  seleccionada,
  marca = 'ninguna',
  disabled,
  onClick,
  className,
  color,
  ...rest
}: {
  children: React.ReactNode;
  seleccionada?: boolean;
  marca?: Marca;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  color?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'onClick'>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={seleccionada}
      className={cn(
        // min-h-11 = 44 px: el mínimo tocable del sistema de diseño.
        'relative flex min-h-11 items-center rounded-card border-2 px-3.5 py-2.5 text-left text-small leading-snug transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-default',
        marca === 'ninguna' && !seleccionada && 'border-border bg-surface hover:-translate-y-px hover:border-primary/40 hover:bg-surface-2',
        marca === 'ninguna' && seleccionada && 'border-primary bg-primary/10 font-semibold',
        marca === 'bien' && 'border-brote-green bg-brote-green/15 font-semibold',
        marca === 'mal' && 'border-brote-coral bg-brote-coral/10',
        marca === 'era' && 'border-dashed border-brote-green/70 bg-brote-green/5',
        !disabled && 'active:scale-[0.98]',
        className,
      )}
      style={color && marca === 'ninguna' && seleccionada ? { borderColor: color, backgroundColor: `${color}1A` } : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Una ranura: un lugar donde va algo, vacía o llena. Vacía también es un botón. */
export function Ranura({
  children,
  vacia,
  activa,
  marca = 'ninguna',
  disabled,
  onClick,
  className,
  ...rest
}: {
  children: React.ReactNode;
  vacia?: boolean;
  activa?: boolean;
  marca?: Marca;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-11 items-center rounded-card border-2 px-3 py-2 text-left text-small transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        vacia && 'border-dashed border-border text-muted-foreground',
        !vacia && marca === 'ninguna' && 'border-border bg-surface-2',
        activa && 'border-primary bg-primary/5',
        marca === 'bien' && 'border-brote-green bg-brote-green/15',
        marca === 'mal' && 'border-brote-coral bg-brote-coral/10',
        marca === 'era' && 'border-dashed border-brote-green/70 bg-brote-green/5',
        !disabled && 'active:scale-[0.98]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** La región viva: cada colocación, retiro y selección se anuncia en castellano. */
export function useAnuncio() {
  const [mensaje, setMensaje] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anunciar = useCallback((texto: string) => {
    setMensaje('');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMensaje(texto), 40);
  }, []);
  const region = (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {mensaje}
    </p>
  );
  return { anunciar, region };
}

/** Un ítem que viaja con `layout` entre el banco y su ranura, salvo movimiento reducido. */
export function ItemAnimado({ children, id, className }: { children: React.ReactNode; id: string; className?: string }) {
  const quieto = useReducedMotion();
  if (quieto) return <div className={className}>{children}</div>;
  return (
    <motion.div layout layoutId={id} className={className} transition={{ type: 'spring', stiffness: 480, damping: 38 }}>
      {children}
    </motion.div>
  );
}

export function claveArray(c: Correccion | null): string[] {
  return c && Array.isArray(c.clave) ? c.clave : [];
}

export function claveObjeto(c: Correccion | null): Record<string, string> {
  return c && c.clave && !Array.isArray(c.clave) ? c.clave : {};
}
