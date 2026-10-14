'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { iosSinInstalar, permisoAvisos, subscribeToPush } from '@/lib/api/push';
import { toast } from '@/stores/toast';

const CLAVE = 'brote-invitacion-avisos';
const ESPERA = 14 * 24 * 60 * 60 * 1000;

/**
 * La invitación a activar los avisos, en el momento en que tiene sentido: ya
 * hay algo que cuidar (una racha, una acción hecha hoy). Se muestra una vez;
 * si la cerrás, no vuelve por dos semanas. En un iPhone sin la app instalada
 * no pide nada imposible: explica cómo instalarla.
 */
export function InvitacionAvisos({ motivo }: { motivo: 'racha' | 'hoy' }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    try {
      const cerrada = Number(localStorage.getItem(CLAVE) ?? 0);
      if (Date.now() - cerrada < ESPERA) return;
    } catch {
      /* sin almacenamiento: se muestra igual */
    }
    const permiso = permisoAvisos();
    if (permiso === 'default') return setVisible(true);
    if (permiso === 'no_soportado' && iosSinInstalar()) {
      setIos(true);
      setVisible(true);
    }
  }, []);

  function cerrar() {
    setVisible(false);
    try {
      localStorage.setItem(CLAVE, String(Date.now()));
    } catch {
      /* nada */
    }
  }

  async function activar() {
    setOcupado(true);
    const r = await subscribeToPush();
    setOcupado(false);
    if (r.ok) {
      toast.success('Avisos activados', 'Te avisamos antes de que se corte tu racha.');
      cerrar();
    } else {
      toast.error('No se pudo', r.error);
      if (permisoAvisos() === 'denied') cerrar();
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-hidden rounded-card border border-brote-sun/30 bg-brote-sun/10 p-4"
        >
          <button
            type="button"
            onClick={cerrar}
            aria-label="Ahora no"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brote-sun/20 text-brote-sun">
              <BellRing className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-small font-semibold">
                {motivo === 'racha' ? '¿Te aviso antes de que se corte tu racha?' : '¿Te aviso mañana si te olvidás?'}
              </p>
              <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
                {ios
                  ? 'En iPhone los avisos llegan con Brote instalado en la pantalla de inicio. Te mostramos cómo en un minuto.'
                  : 'Un aviso a la noche sólo si ese día no hiciste nada. De noche nunca suena, y elegís qué más te llega.'}
              </p>
              <div className="mt-3 flex gap-2">
                {ios ? (
                  <Link
                    href="/instalar"
                    className="inline-flex h-9 items-center rounded-pill bg-primary px-4 text-small font-semibold text-primary-foreground shadow-crisp transition-colors hover:bg-brote-green-deep"
                  >
                    Cómo instalarla
                  </Link>
                ) : (
                  <Button size="sm" className="rounded-pill" loading={ocupado} onClick={activar}>
                    Avisame
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={cerrar}>
                  Ahora no
                </Button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
