'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NIVEL_COLOR, NIVEL_PALABRA, numeroDeNivel, snippetSello, textoSugerido } from '@/lib/negocio/sello';
import type { Nivel } from '@/lib/mercado/claims';

/**
 * El kit de marca (fase 4 §7): el sello para el sitio, tres placas para redes
 * y el texto para anunciarlo.
 *
 * Las placas se dibujan en un `<canvas>` del navegador y no con `sharp` en el
 * servidor, aunque `sharp` ya esté en las dependencias: en una función
 * serverless no hay fuentes instaladas y el texto sale en blanco o en cuadros.
 * Acá la fuente ya está cargada en la página —se la pedimos al propio DOM—, así
 * que la placa sale igual a lo que la empresa ve en pantalla.
 */

interface Placa {
  clave: 'nivel' | 'mejora' | 'afirmaciones';
  titulo: string;
  linea: string;
  pie: string;
}

export function KitDeMarca({
  slug,
  nombre,
  nivel,
  objetivosCerrados,
  base,
}: {
  slug: string;
  nombre: string;
  nivel: Nivel;
  objetivosCerrados: number;
  base: string;
}) {
  const t = useTranslations('negocio.kit');
  const [copiado, setCopiado] = useState<string | null>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);

  const snippet = snippetSello(base, slug, nombre);
  const sugerido = `${textoSugerido(nombre, nivel, objetivosCerrados)}\n${base}/mercado/negocio/${slug}`;

  const placas: Placa[] = [
    {
      clave: 'nivel',
      titulo: t('placas.nivel.titulo'),
      linea: `Nivel ${numeroDeNivel(nivel)} · ${NIVEL_PALABRA[nivel]}`,
      pie: nombre,
    },
    {
      clave: 'mejora',
      titulo: t('placas.mejora.titulo'),
      linea:
        objetivosCerrados > 0
          ? t('placas.mejora.conObjetivos', { n: objetivosCerrados })
          : t('placas.mejora.sinObjetivos'),
      pie: nombre,
    },
    {
      clave: 'afirmaciones',
      titulo: t('placas.afirmaciones.titulo'),
      linea: t('placas.afirmaciones.linea'),
      pie: `${base.replace(/^https?:\/\//, '')}/mercado/negocio/${slug}`,
    },
  ];

  async function copiar(texto: string, clave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* sin portapapeles: el texto está a la vista para copiarlo a mano */
    }
  }

  function descargar(p: Placa) {
    const c = lienzo.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const familia = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    const S = 1080;
    c.width = S;
    c.height = S;

    ctx.fillStyle = '#0B0F0D';
    ctx.fillRect(0, 0, S, S);

    // Un punto del color del nivel, como en cada badge de la app.
    ctx.fillStyle = NIVEL_COLOR[nivel];
    ctx.beginPath();
    ctx.arc(120, 150, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8A8F98';
    ctx.font = `700 30px ${familia}`;
    ctx.fillText('PROGRAMA BROTE', 170, 162);

    ctx.fillStyle = '#F3F1E9';
    ctx.font = `800 76px ${familia}`;
    envolver(ctx, p.titulo, 120, 420, 840, 92);

    ctx.fillStyle = '#1FB57A';
    ctx.font = `700 48px ${familia}`;
    envolver(ctx, p.linea, 120, 700, 840, 62);

    ctx.fillStyle = '#8A8F98';
    ctx.font = `500 34px ${familia}`;
    envolver(ctx, p.pie, 120, 940, 840, 46);

    const enlace = document.createElement('a');
    enlace.download = `brote-${slug}-${p.clave}.png`;
    enlace.href = c.toDataURL('image/png');
    enlace.click();
  }

  return (
    <div className="space-y-8 pb-10">
      <section>
        <h2 className="font-display text-h3 font-bold">{t('sello.titulo')}</h2>
        <p className="mt-1 max-w-prose text-small leading-relaxed text-muted-foreground">{t('sello.texto')}</p>
        <div className="mt-3 rounded-card border border-border bg-surface p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/sello/${slug}.svg`} width={300} height={84} alt={t('sello.alt', { nombre })} />
        </div>
        <div className="mt-3 rounded-card border border-border bg-surface-2 p-3">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all text-caption leading-relaxed">{snippet}</pre>
        </div>
        <Button className="mt-2" size="sm" variant="secondary" onClick={() => void copiar(snippet, 'snippet')}>
          {copiado === 'snippet' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado === 'snippet' ? t('copiado') : t('copiarCodigo')}
        </Button>
      </section>

      <section>
        <h2 className="font-display text-h3 font-bold">{t('placas.titulo')}</h2>
        <p className="mt-1 max-w-prose text-small leading-relaxed text-muted-foreground">{t('placas.texto')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {placas.map((p) => (
            <figure key={p.clave} className="overflow-hidden rounded-card border border-border">
              <div className="aspect-square bg-brote-ink p-4 text-brote-cream">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brote-cream/60">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: NIVEL_COLOR[nivel] }} />
                  Programa Brote
                </span>
                <p className="mt-4 font-display text-body font-extrabold leading-tight">{p.titulo}</p>
                <p className="mt-2 text-small font-bold text-primary">{p.linea}</p>
                <p className="mt-3 text-caption text-brote-cream/60">{p.pie}</p>
              </div>
              <figcaption className="p-2">
                <Button block size="sm" variant="secondary" onClick={() => descargar(p)}>
                  <Download className="h-4 w-4" />
                  {t('descargar')}
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
        <canvas ref={lienzo} className="hidden" aria-hidden />
      </section>

      <section>
        <h2 className="font-display text-h3 font-bold">{t('texto.titulo')}</h2>
        <p className="mt-1 max-w-prose text-small leading-relaxed text-muted-foreground">{t('texto.ayuda')}</p>
        <p className="mt-3 whitespace-pre-line rounded-card border border-border bg-surface p-4 text-small leading-relaxed">
          {sugerido}
        </p>
        <Button className="mt-2" size="sm" variant="secondary" onClick={() => void copiar(sugerido, 'texto')}>
          {copiado === 'texto' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado === 'texto' ? t('copiado') : t('copiarTexto')}
        </Button>
      </section>
    </div>
  );
}

/** Texto que se parte solo cuando no entra en el ancho de la placa. */
function envolver(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, ancho: number, alto: number) {
  const palabras = texto.split(' ');
  let linea = '';
  let cursor = y;
  for (const palabra of palabras) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > ancho && linea) {
      ctx.fillText(linea, x, cursor);
      linea = palabra;
      cursor += alto;
    } else {
      linea = prueba;
    }
  }
  if (linea) ctx.fillText(linea, x, cursor);
}
