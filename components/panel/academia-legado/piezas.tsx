'use client';

/**
 * Las piezas que comparten los catorce renderers.
 *
 * LA REGLA QUE MANDA ACÁ (11-exercise-types.md §5): tocar-para-elegir y
 * tocar-para-colocar es el camino PRINCIPAL, no el plan B del arrastre. Un
 * ejercicio que solo se puede resolver arrastrando no se puede resolver con
 * teclado, ni con lector de pantalla, ni con un dedo tembloroso, ni con el
 * celular apoyado en la mesa. Por eso no hay librería de drag-and-drop: no
 * hacía falta ninguna, porque el gesto correcto era otro desde el principio.
 *
 * Todo lo que se toca es un `<button>` de verdad. Eso resuelve gratis el foco,
 * el Enter, la barra espaciadora y el rol para el lector de pantalla.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { RespuestaCorregida, RespuestaEnviada } from '@/lib/academia/types';
import { cn } from '@/lib/utils/cn';

/** El contrato que cumplen los doce que se corrigen. */
export interface PropsEjercicio<P> {
  payload: P;
  /** Se llama con `null` mientras la respuesta esté incompleta. */
  onCambio: (r: RespuestaEnviada | null) => void;
  /** Después de responder no se toca más nada. */
  bloqueado: boolean;
  /** La corrección, cuando llegó. Antes de eso, `null`. */
  correccion: RespuestaCorregida | null;
}

/**
 * Le avisa al padre cuál es la respuesta, sin depender de que su callback sea
 * estable.
 *
 * MEDIDO, y era un cuelgue de verdad: cada renderer hacía
 * `useEffect(() => onCambio(algo), [estado, onCambio])`. Si el padre pasaba un
 * arrow en línea, su identidad cambiaba en cada render, el efecto volvía a
 * correr, `onCambio` recibía un objeto NUEVO, el padre re-renderizaba — y otra
 * vuelta. React lo cortaba con "Maximum update depth exceeded" y el ejercicio
 * quedaba muerto. El `Jugador` memoiza su callback, así que no se veía; el
 * banco de pruebas no, y ahí saltó.
 *
 * La dependencia real es el VALOR de la respuesta, no la identidad de la
 * función ni la del objeto. Se compara serializado —son objetos chicos y
 * planos— y el callback vive en un ref. Así el renderer es correcto con
 * cualquier padre, memoice o no.
 */
export function useReportar(onCambio: (r: RespuestaEnviada | null) => void, respuesta: RespuestaEnviada | null) {
  const ultimo = useRef(onCambio);
  ultimo.current = onCambio;
  const serial = JSON.stringify(respuesta ?? null);
  useEffect(() => {
    ultimo.current(serial === 'null' ? null : (JSON.parse(serial) as RespuestaEnviada));
  }, [serial]);
}

/** Cómo se pinta una ficha una vez corregida. */
export type Marca = 'ninguna' | 'bien' | 'mal' | 'era';

export function Enunciado({ texto, ayuda }: { texto: string; ayuda?: string | null }) {
  return (
    <div className="mb-4">
      <h2 className="text-balance font-display text-h2 font-bold leading-tight">{texto}</h2>
      {ayuda ? <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{ayuda}</p> : null}
    </div>
  );
}

/**
 * Una ficha tocable: opción, fragmento, palabra del banco, lo que sea.
 *
 * Estados de hover Y de presión, los dos, porque el sistema de diseño §5 pide
 * los dos y porque en un celular solo se ve el de presión.
 */
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
        // min-h-11 = 44 px: el mínimo tocable del sistema de diseño. Sin esto
        // una ficha de una palabra quedaba en 40 y era difícil de acertar.
        'relative flex min-h-11 items-center rounded-card border px-3.5 py-2.5 text-left text-small leading-snug transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-default',
        marca === 'ninguna' && !seleccionada && 'border-border bg-surface hover:border-primary/40 hover:bg-surface-2',
        marca === 'ninguna' && seleccionada && 'border-primary bg-primary/10 font-semibold',
        marca === 'bien' && 'border-brote-green bg-brote-green/12 font-semibold',
        marca === 'mal' && 'border-brote-coral bg-brote-coral/10',
        marca === 'era' && 'border-brote-green/60 border-dashed bg-brote-green/5',
        !disabled && 'active:scale-[0.98]',
        className,
      )}
      style={color && marca === 'ninguna' && seleccionada ? { borderColor: color } : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Una ranura: un lugar donde va algo, vacío o lleno.
 *
 * Se usa en secuencias, cadenas, huecos de frase y cestos. Vacía es un botón
 * igual, porque tocar una ranura vacía teniendo algo seleccionado es la mitad
 * del gesto de "colocar".
 */
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
        'flex min-h-11 items-center rounded-card border px-3 py-2 text-left text-small transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        vacia && 'border-dashed border-border/70 text-muted-foreground',
        !vacia && marca === 'ninguna' && 'border-border bg-surface-2',
        activa && 'border-primary bg-primary/5',
        marca === 'bien' && 'border-brote-green bg-brote-green/12',
        marca === 'mal' && 'border-brote-coral bg-brote-coral/10',
        marca === 'era' && 'border-dashed border-brote-green/60 bg-brote-green/5',
        !disabled && 'active:scale-[0.98]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * La región viva. Cada colocación, cada retiro y cada selección se anuncia en
 * castellano — sin esto, alguien que usa lector de pantalla toca dos botones y
 * no se entera de que pasó algo.
 */
export function useAnuncio() {
  const [mensaje, setMensaje] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anunciar = useCallback((texto: string) => {
    // Se limpia y se vuelve a poner: si el texto es igual al anterior, el
    // lector no lo repite salvo que el nodo cambie.
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

/** Un contenedor que anima el reordenamiento con `layout`, salvo que no se quiera. */
export function ListaAnimada({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function ItemAnimado({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id: string;
  className?: string;
}) {
  const quieto = useReducedMotion();
  if (quieto) return <div className={className}>{children}</div>;
  return (
    <motion.div
      layout
      layoutId={id}
      className={className}
      transition={{ type: 'spring', stiffness: 480, damping: 38 }}
    >
      {children}
    </motion.div>
  );
}

/** La clave como arreglo de tokens, o vacío si este tipo no la trae así. */
export function claveArray(c: RespuestaCorregida | null): string[] {
  return c && Array.isArray(c.clave) ? c.clave : [];
}

/** La clave como objeto, o vacío. */
export function claveObjeto(c: RespuestaCorregida | null): Record<string, string> {
  return c && c.clave && !Array.isArray(c.clave) ? c.clave : {};
}
