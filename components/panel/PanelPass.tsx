'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * La contraseña del panel, compartida entre `/panel` y sus colas.
 *
 * Vive en el layout de `/panel`, así que sobrevive a ir y volver entre la
 * consola, la cola de negocios y una ficha — y a NADA más: no toca
 * localStorage, no sobrevive a un refresco y nunca va en una URL. Es la misma
 * regla que ya tenía la consola, extendida a más de una pantalla. Cada RPC la
 * vuelve a verificar igual.
 */
const PanelPassContext = createContext<{ pass: string; setPass: (p: string) => void }>({
  pass: '',
  setPass: () => {},
});

export function PanelPassProvider({ children }: { children: ReactNode }) {
  const [pass, setPass] = useState('');
  return <PanelPassContext.Provider value={{ pass, setPass }}>{children}</PanelPassContext.Provider>;
}

export function usePanelPass() {
  return useContext(PanelPassContext);
}

/** El candado para las pantallas del panel que no son la consola. */
export function CandadoPanel({ verificar }: { verificar: (pass: string) => Promise<boolean> }) {
  const t = useTranslations('negocio.panel.candado');
  const { setPass } = usePanelPass();
  const [valor, setValor] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);

  async function entrar() {
    if (!valor) return;
    setOcupado(true);
    setError(false);
    const ok = await verificar(valor);
    setOcupado(false);
    if (ok) setPass(valor);
    else setError(true);
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-display text-h2 font-bold">{t('titulo')}</h1>
        </div>
        <Input
          type="password"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void entrar()}
          placeholder={t('pass')}
          aria-label={t('pass')}
          invalid={error}
          autoFocus
        />
        {error && <p className="text-caption text-brote-coral">{t('error')}</p>}
        <Button block variant="primary" onClick={() => void entrar()} loading={ocupado} disabled={!valor}>
          {t('entrar')}
        </Button>
      </Card>
    </div>
  );
}
