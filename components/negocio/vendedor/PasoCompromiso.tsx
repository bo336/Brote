'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Camera, Check, ImagePlus, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subirFotoCompromiso } from '@/lib/api/mercado';
import { urlImagen } from '@/lib/mercado/imagenes';
import { MAX_PRACTICAS, MIN_PRACTICAS, practicasOrdenadas, type Practica } from '@/lib/mercado/practicas';
import { guardarCompromisos } from '@/lib/negocio/vendedor-acciones';
import type { EstadoVendedor } from '@/lib/negocio/vendedor';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * Paso 2: el compromiso. Es la verificación ambiental de la tienda, y está
 * pensada para ser simple y difícil de fingir a la vez:
 *
 * - Prácticas CONCRETAS, de una lista cerrada ("recibo envases para reusar",
 *   no "cuidamos el planeta"): algo que se hace o no se hace.
 * - Una FOTO que muestre una de ellas. La van a ver quienes compran, y la
 *   revisa el equipo de Brote después de que la tienda abre.
 * - Quedan en público como lo que son: "declarado, con foto" hasta que alguien
 *   de Brote la mira, y ahí "revisado por Brote". Si no coincide, se saca.
 */
export function PasoCompromiso({ estado, alGuardar }: { estado: EstadoVendedor; alGuardar?: () => void }) {
  const t = useTranslations('negocio.vendedor.compromiso');
  const tp = useTranslations('mercado.practicas');
  const te = useTranslations('negocio.vendedor.errores');
  const router = useRouter();
  const archivo = useRef<HTMLInputElement>(null);
  const previas = estado.compromisos.filter((c) => c.estado !== 'rechazado');
  const conFoto = previas.find((c) => c.foto_path);
  const [elegidas, setElegidas] = useState<Practica[]>(previas.map((c) => c.practica));
  const [foto, setFoto] = useState<{ ruta: string; practica: Practica } | null>(
    conFoto?.foto_path ? { ruta: conFoto.foto_path, practica: conFoto.practica } : null,
  );
  const [fotoNueva, setFotoNueva] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const lista = practicasOrdenadas(estado.tienda.categoria_principal);
  const sugeridas = new Set(lista.slice(0, 5));
  const [verTodas, setVerTodas] = useState(previas.some((c) => !sugeridas.has(c.practica)));
  const visibles = verTodas ? lista : lista.slice(0, 6);
  const rechazadas = estado.compromisos.filter((c) => c.estado === 'rechazado');

  function alternar(p: Practica) {
    setElegidas((xs) => {
      if (xs.includes(p)) {
        if (foto?.practica === p) setFoto(null);
        return xs.filter((x) => x !== p);
      }
      if (xs.length >= MAX_PRACTICAS) {
        useToastStore.getState().push({ variant: 'error', title: t('maximo', { n: MAX_PRACTICAS }) });
        return xs;
      }
      return [...xs, p];
    });
  }

  async function subir(f: File | undefined) {
    if (!f) return;
    const practica = foto?.practica ?? elegidas[0];
    if (!practica) {
      useToastStore.getState().push({ variant: 'error', title: t('elegiPrimero') });
      return;
    }
    setSubiendo(true);
    const r = await subirFotoCompromiso(estado.id, f);
    setSubiendo(false);
    if (archivo.current) archivo.current.value = '';
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: te.has(r.error) ? te(r.error) : te('error') });
      return;
    }
    setFoto({ ruta: r.ruta, practica });
    setFotoNueva(true);
  }

  async function guardar() {
    if (elegidas.length < MIN_PRACTICAS) {
      useToastStore.getState().push({ variant: 'error', title: t('minimo', { n: MIN_PRACTICAS }) });
      return;
    }
    if (!foto) {
      useToastStore.getState().push({ variant: 'error', title: t('faltaFoto') });
      return;
    }
    setOcupado(true);
    const r = await guardarCompromisos(estado.id, elegidas, foto.practica, fotoNueva || !conFoto ? foto.ruta : null);
    setOcupado(false);
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: te.has(r.error) ? te(r.error) : te('error') });
      return;
    }
    alGuardar?.();
    router.refresh();
  }

  const src = foto ? urlImagen(foto.ruta) : null;

  return (
    <div className="space-y-7">
      {rechazadas.length > 0 && (
        <div className="rounded-card border border-brote-coral/40 bg-brote-coral/10 p-4 text-small">
          <p className="font-semibold">{t('rechazadas')}</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            {rechazadas.map((c) => (
              <li key={c.practica}>
                {tp(`${c.practica}.titulo`)}
                {c.nota ? `: ${c.nota}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-small font-semibold">{t('queHaces')}</h2>
          <span className="text-caption text-muted-foreground tnum">
            {t('elegidas', { n: elegidas.length, max: MAX_PRACTICAS })}
          </span>
        </div>
        <p className="mt-0.5 text-caption text-muted-foreground">{t('queHacesAyuda', { n: MIN_PRACTICAS })}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {visibles.map((p) => {
            const activa = elegidas.includes(p);
            return (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => alternar(p)}
                  aria-pressed={activa}
                  className={cn(
                    'press flex h-full w-full items-start gap-2.5 rounded-button border p-3 text-left transition-colors duration-150',
                    activa ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                      activa ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                    )}
                  >
                    {activa && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-small font-semibold leading-snug">{tp(`${p}.titulo`)}</span>
                    <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">{tp(`${p}.ayuda`)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!verTodas && (
          <button type="button" onClick={() => setVerTodas(true)} className="mt-3 text-small font-semibold text-primary">
            <span className="link-underline">{t('verTodas', { n: lista.length })}</span>
          </button>
        )}
      </section>

      <section>
        <h2 className="text-small font-semibold">{t('fotoTitulo')}</h2>
        <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{t('fotoAyuda')}</p>
        <input ref={archivo} type="file" accept="image/*" className="sr-only" onChange={(e) => subir(e.target.files?.[0])} />
        {src && foto ? (
          <div className="mt-3 flex gap-3 rounded-card border border-border bg-surface p-3">
            <span className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[14px] bg-surface-2">
              <Image src={src} alt={t('fotoAlt')} fill sizes="112px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <label htmlFor="practica-foto" className="text-caption font-semibold text-muted-foreground">
                {t('fotoMuestra')}
              </label>
              <select
                id="practica-foto"
                value={foto.practica}
                onChange={(e) => {
                  setFoto({ ...foto, practica: e.target.value as Practica });
                  setFotoNueva(true);
                }}
                className="mt-1 h-10 w-full rounded-button border border-border bg-surface px-2.5 text-small"
              >
                {elegidas.map((p) => (
                  <option key={p} value={p}>
                    {tp(`${p}.titulo`)}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="button" onClick={() => archivo.current?.click()} className="text-caption font-semibold text-primary" disabled={subiendo}>
                  <span className="link-underline">{subiendo ? t('subiendo') : t('cambiarFoto')}</span>
                </button>
                <button type="button" onClick={() => setFoto(null)} className="inline-flex items-center gap-1 text-caption font-semibold text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                  {t('quitarFoto')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => archivo.current?.click()}
            disabled={subiendo || elegidas.length === 0}
            className="press mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border bg-surface px-4 py-8 text-center transition-colors duration-150 hover:border-primary/60 disabled:opacity-50"
          >
            {subiendo ? <Camera className="h-7 w-7 animate-pulse text-muted-foreground" /> : <ImagePlus className="h-7 w-7 text-muted-foreground" />}
            <span className="text-small font-semibold">{subiendo ? t('subiendo') : t('subirFoto')}</span>
            <span className="text-caption text-muted-foreground">{elegidas.length === 0 ? t('elegiPrimero') : t('subirFotoAyuda')}</span>
          </button>
        )}
        <p className="mt-2 flex items-start gap-1.5 text-caption leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t('revision')}
        </p>
      </section>

      <div className="sticky bottom-0 -mx-4 border-t border-hairline bg-background/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="button" block size="lg" loading={ocupado} onClick={guardar} className="rounded-pill">
          {t('guardar')}
        </Button>
      </div>
    </div>
  );
}
