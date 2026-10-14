'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

/**
 * The password field, with the eye to show what you typed.
 *
 * On a phone the eye is the difference between a typo and a locked-out
 * minute: people sign up thumbs-first, and a hidden field gives them no way to
 * see that the autocorrect capitalised the first letter.
 */
export function CampoClave({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  invalid,
  minLength,
  autoFocus,
  describedBy,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  autoComplete: 'current-password' | 'new-password';
  invalid?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  describedBy?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          icon
          invalid={invalid}
          autoFocus={autoFocus}
          placeholder={placeholder ?? label}
          aria-describedby={describedBy}
          className="pr-11"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...(value !== undefined ? { value, onChange: (e) => onChange?.(e.target.value) } : {})}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className={cn(
            'absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[10px]',
            'text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/**
 * How strong a new password is, in three honest steps. It never blocks — the
 * server's minimum is the only rule — it only says what would make it better.
 */
export function fuerzaClave(p: string): { nivel: 0 | 1 | 2 | 3; texto: string } {
  if (!p) return { nivel: 0, texto: 'Al menos 8 caracteres. Mejor si mezcla letras y números.' };
  const largo = p.length >= 8;
  const mezcla = /[a-zA-Z]/.test(p) && /\d/.test(p);
  const extra = p.length >= 12 || /[^a-zA-Z0-9]/.test(p);
  if (!largo) return { nivel: 1, texto: `Te faltan ${8 - p.length} caracteres para llegar a 8.` };
  if (!mezcla) return { nivel: 2, texto: 'Bien. Sumale algún número para que sea más difícil de adivinar.' };
  if (!extra) return { nivel: 2, texto: 'Bien. Más larga o con un símbolo, todavía mejor.' };
  return { nivel: 3, texto: 'Excelente contraseña.' };
}

export function MedidorClave({ clave, id }: { clave: string; id: string }) {
  const { nivel, texto } = fuerzaClave(clave);
  const color = nivel <= 1 ? 'bg-brote-coral' : nivel === 2 ? 'bg-brote-sun' : 'bg-primary';
  return (
    <div id={id} className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-pill transition-colors duration-200',
              clave && i <= nivel ? color : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className="mt-1.5 text-caption text-muted-foreground">{texto}</p>
    </div>
  );
}
