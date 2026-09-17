// Relativos por el build de tests (ver `generador.ts`).
import { palanca, palancasPara } from './palancas';
import { objetivosPorReglas, puntuarPalanca, rellenarPlantilla } from './generador';
import { asignarAmbicion, bandaDe, deltaDe, subirHorizonte, validarObjetivo } from './realismo';
import type {
  ContextoValidacion,
  Dossier,
  NegocioParaMejora,
  ObjetivoPropuesto,
  TipoCheckin,
} from './tipos';

/**
 * Replanificación determinista (fase 2 §7.2, `05_ALGORITMOS.md` §5.4).
 *
 * Corre antes que la IA y sigue siendo el fallback cuando la IA no está, falla
 * o devuelve algo que no valida. Toda replanificación produce una VERSIÓN
 * nueva: nada se pisa y nada se borra.
 */

export type AccionReplan =
  | 'ajustar_meta'
  | 'extender_horizonte'
  | 'reemplazar'
  | 'retirar'
  | 'sin_cambios'
  | 'pedir_evidencia';

export interface EntradaReplan {
  objetivo: ObjetivoPropuesto;
  checkin: { tipo: TipoCheckin; mensaje: string; valor_reportado: number | null; tiene_evidencia?: boolean };
  dossier: Dossier;
  negocio: NegocioParaMejora;
  /** Slugs ya usados, para no proponer de alternativa algo que ya tienen. */
  excluir?: string[];
}

export interface SalidaReplan {
  accion: AccionReplan;
  /** Versión nueva del MISMO objetivo, si la hay. */
  nueva_version: ObjetivoPropuesto | null;
  /** Objetivo distinto que se propone además (alternativa o escalón siguiente). */
  alternativa: ObjetivoPropuesto | null;
  logrado_retroactivo: boolean;
  retirar: boolean;
  /** Lo que lee la empresa. Directo, sin felicitar y sin adular. */
  respuesta: string;
}

function conAmbicionRecalculada(g: ObjetivoPropuesto): ObjetivoPropuesto {
  const { ambicion, objetivo } = asignarAmbicion(g);
  return { ...g, ambicion, objetivo: objetivo ?? g.objetivo };
}

/** El escalón siguiente de la misma palanca, si el catálogo lo define. */
function escalonSiguiente(
  g: ObjetivoPropuesto,
  dossier: Dossier,
  negocio: NegocioParaMejora,
  excluir: string[],
): ObjetivoPropuesto | null {
  const actual = palanca(g.palanca_slug);
  const siguiente = palanca(actual?.escalon_siguiente);
  if (!siguiente || excluir.includes(siguiente.slug)) return null;
  const propuesto = rellenarPlantilla(siguiente, dossier, negocio);
  if (!propuesto) return null;
  const ctx: ContextoValidacion = { dossier, activos: [] };
  return validarObjetivo(propuesto, ctx, { claves: siguiente.claves }).valido ? propuesto : null;
}

/** La mejor palanca del mismo dominio que no sea la que se retira. */
function alternativaDelDominio(
  g: ObjetivoPropuesto,
  dossier: Dossier,
  negocio: NegocioParaMejora,
  excluir: string[],
): ObjetivoPropuesto | null {
  const ctx: ContextoValidacion = { dossier, activos: [] };
  const candidatas = palancasPara(negocio.rubro, negocio.tamano)
    .filter((p) => p.dominio === g.dominio && p.slug !== g.palanca_slug && !excluir.includes(p.slug))
    .map((p) => ({ p, puntaje: puntuarPalanca(p, dossier) }))
    .filter((x) => x.puntaje > -900)
    .sort((a, b) => b.puntaje - a.puntaje);

  for (const { p } of candidatas) {
    const propuesto = rellenarPlantilla(p, dossier, negocio);
    if (propuesto && validarObjetivo(propuesto, ctx, { claves: p.claves }).valido) return propuesto;
  }
  // Sin nada del mismo dominio, lo mejor que haya sirve más que nada.
  return objetivosPorReglas(dossier, negocio, { excluir, cantidad: 1 })[0] ?? null;
}

export function replanificarPorReglas(entrada: EntradaReplan): SalidaReplan {
  const { objetivo: g, checkin, dossier, negocio } = entrada;
  const excluir = [...(entrada.excluir ?? []), ...(g.palanca_slug ? [g.palanca_slug] : [])];
  const vacio: SalidaReplan = {
    accion: 'sin_cambios',
    nueva_version: null,
    alternativa: null,
    logrado_retroactivo: false,
    retirar: false,
    respuesta: '',
  };

  switch (checkin.tipo) {
    case 'no_llego': {
      const [min] = bandaDe(g);
      const valor = checkin.valor_reportado;
      const alcanzable =
        valor != null && g.linea_base != null
          ? (deltaDe({ ...g, objetivo: valor }) ?? 0) >= min
          : false;

      if (alcanzable && valor != null) {
        const nueva = conAmbicionRecalculada({ ...g, objetivo: valor });
        return {
          ...vacio,
          accion: 'ajustar_meta',
          nueva_version: nueva,
          respuesta: `Ajustamos la meta a ${valor} ${g.unidad}, que es lo que dijiste que sí podés. El plazo queda igual.`,
        };
      }

      // Por debajo de la banda no se baja la meta: se extiende el plazo. Bajar
      // la meta enseña que las metas se negocian; extender enseña que se
      // cumplen más lento (05 §5.4).
      if (g.horizonte === 'anual') {
        return {
          ...vacio,
          accion: 'sin_cambios',
          respuesta:
            'El objetivo ya está en el plazo más largo que manejamos, así que lo dejamos como está. Si sigue sin cerrar, cerralo con lo que hayas logrado: cuenta como avance parcial.',
        };
      }
      const horizonte = subirHorizonte(g.horizonte);
      return {
        ...vacio,
        accion: 'extender_horizonte',
        nueva_version: conAmbicionRecalculada({ ...g, horizonte }),
        respuesta: `Ese número queda por debajo de lo que este objetivo tiene que mover, así que mantuvimos la meta y lo pasamos a ${horizonte}. Preferimos darte más tiempo antes que bajar el número.`,
      };
    }

    case 'mas_tiempo': {
      if (g.horizonte === 'anual') {
        return {
          ...vacio,
          respuesta:
            'Ya está en el plazo más largo. Lo dejamos donde está; si no llegás, cerralo con lo logrado y cuenta como avance parcial.',
        };
      }
      const horizonte = subirHorizonte(g.horizonte);
      return {
        ...vacio,
        accion: 'extender_horizonte',
        nueva_version: conAmbicionRecalculada({ ...g, horizonte }),
        respuesta: `Pasamos el objetivo a ${horizonte}. La meta queda intacta: es el mismo número con más tiempo.`,
      };
    }

    case 'no_aplica': {
      const alternativa = alternativaDelDominio(g, dossier, negocio, excluir);
      return {
        ...vacio,
        accion: alternativa ? 'reemplazar' : 'retirar',
        retirar: true,
        alternativa,
        respuesta: alternativa
          ? 'Lo retiramos. En su lugar te proponemos otro del mismo dominio, con un mecanismo distinto.'
          : 'Lo retiramos. Por ahora no tenemos una alternativa del mismo dominio que encaje con lo que cargaste en el dossier.',
      };
    }

    case 'ya_hecho': {
      if (!checkin.tiene_evidencia) {
        return {
          ...vacio,
          accion: 'pedir_evidencia',
          respuesta: `Para cerrarlo como logrado necesitamos con qué mostrarlo: ${g.evidencia_requerida.toLowerCase()}. Subilo y lo damos por cerrado con fecha retroactiva.`,
        };
      }
      const siguiente = escalonSiguiente(g, dossier, negocio, excluir);
      return {
        ...vacio,
        accion: 'reemplazar',
        logrado_retroactivo: true,
        alternativa: siguiente,
        respuesta: siguiente
          ? 'Lo damos por cerrado con la evidencia que subiste. Te proponemos el escalón siguiente de lo mismo.'
          : 'Lo damos por cerrado con la evidencia que subiste.',
      };
    }

    case 'avance':
    case 'nota':
    default:
      return {
        ...vacio,
        respuesta: 'Registrado. El objetivo queda como está.',
      };
  }
}
