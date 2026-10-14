'use client';

import { useEffect, useState } from 'react';
import { BellRing, Moon, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { iosSinInstalar, permisoAvisos, probarAviso } from '@/lib/api/push';
import { toast } from '@/stores/toast';

/**
 * Los avisos en Ajustes (docs/LANZAMIENTO.md §5). Cada interruptor es una
 * clave de `notification_prefs` que la base lee al decidir si un aviso suena
 * (`brote_aviso_permitido`, 0129): no es un filtro de la pantalla.
 */
const CATEGORIAS: { key: string; titulo: string; detalle: string; porDefecto: boolean; adultos?: boolean }[] = [
  { key: 'streak', titulo: 'Racha', detalle: 'A las 20 h, sólo si ese día todavía no hiciste nada.', porDefecto: true },
  { key: 'rango', titulo: 'Tu rango', detalle: 'Cuando cierra el período: si subiste, sostuviste o bajaste.', porDefecto: true },
  { key: 'plaza', titulo: 'Novedades de la Plaza', detalle: 'Lo nuevo de la gente que seguís, una vez por día.', porDefecto: true, adultos: true },
  { key: 'recap', titulo: 'Resumen del lunes', detalle: 'Tu semana en Brote, en una línea.', porDefecto: true },
  { key: 'academia', titulo: 'Academia', detalle: 'Cuando algo de lo que aprendiste necesita un repaso.', porDefecto: true },
  { key: 'challenges', titulo: 'Retos y competencias', detalle: 'Cuando empieza o termina uno en el que estás.', porDefecto: true },
  { key: 'projects', titulo: 'Proyectos', detalle: 'Novedades de los proyectos a los que te sumaste.', porDefecto: true, adultos: true },
  { key: 'reenganche', titulo: 'Si pasan días sin entrar', detalle: 'Un aviso a los 3 días y otro a las 2 semanas. Nada más.', porDefecto: true },
];

export function AvisosAjustes({
  pushOn,
  onPush,
  prefsListas,
  valor,
  cambiar,
  esChico,
}: {
  pushOn: boolean;
  onPush: (on: boolean) => void;
  prefsListas: boolean;
  valor: (key: string, porDefecto: boolean) => boolean;
  cambiar: (key: string, v: boolean) => void;
  esChico: boolean;
}) {
  const [permiso, setPermiso] = useState<ReturnType<typeof permisoAvisos>>('default');
  const [ios, setIos] = useState(false);
  const [probando, setProbando] = useState(false);

  useEffect(() => {
    setPermiso(permisoAvisos());
    setIos(iosSinInstalar());
  }, [pushOn]);

  async function probar() {
    setProbando(true);
    const r = await probarAviso();
    setProbando(false);
    if (r.ok) toast.success('Aviso en camino', 'Te llega en menos de un minuto.');
    else toast.error('No se pudo', r.error);
  }

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brote-sun/15 text-brote-sun">
            <BellRing className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold">Avisos en este dispositivo</p>
            <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
              {permiso === 'no_soportado'
                ? ios
                  ? 'En iPhone y iPad los avisos llegan con Brote instalado: Compartir → "Agregar a inicio", y abrilo desde ahí.'
                  : 'Este navegador no permite avisos. Probá con Chrome, Edge, Firefox o Safari actualizados.'
                : permiso === 'denied'
                  ? 'Están bloqueados para Brote en este navegador. Habilitalos desde el candado de la barra de direcciones y volvé acá.'
                  : pushOn
                    ? 'Activados. Nunca suenan de noche salvo que lo cambies abajo, y como mucho dos por día para recordarte cosas.'
                    : 'Apagados. Activalos para enterarte antes de que se corte tu racha.'}
            </p>
          </div>
          <Switch
            checked={pushOn}
            disabled={permiso === 'no_soportado' || permiso === 'denied'}
            onCheckedChange={onPush}
            aria-label="Avisos en este dispositivo"
          />
        </div>
        {pushOn && (
          <Button size="sm" variant="secondary" className="mt-3" loading={probando} onClick={probar}>
            <Smartphone className="h-4 w-4" /> Mandarme uno de prueba
          </Button>
        )}
      </Card>

      <Card className="divide-y divide-hairline overflow-hidden p-0">
        {CATEGORIAS.filter((c) => !(esChico && c.adultos)).map((c) => (
          <label key={c.key} className="flex cursor-pointer items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-small font-medium">{c.titulo}</span>
              <span className="block text-caption leading-snug text-muted-foreground">{c.detalle}</span>
            </span>
            <Switch checked={valor(c.key, c.porDefecto)} disabled={!prefsListas} onCheckedChange={(v) => cambiar(c.key, v)} />
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
          <Moon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-small font-medium">Silencio de noche</span>
            <span className="block text-caption leading-snug text-muted-foreground">
              Entre las 22 y las 9 no suena nada: lo que llegue, te lo mostramos a la mañana.
            </span>
          </span>
          <Switch checked={valor('silencio', true)} disabled={!prefsListas} onCheckedChange={(v) => cambiar('silencio', v)} />
        </label>
      </Card>
    </div>
  );
}
