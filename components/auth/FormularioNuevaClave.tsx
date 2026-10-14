'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampoClave, MedidorClave } from '@/components/auth/CampoClave';
import { updatePassword, type AuthActionState } from '@/app/(auth)/auth/actions';

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" block loading={pending} className="rounded-pill">
      Guardar contraseña
    </Button>
  );
}

export function FormularioNuevaClave() {
  const [state, action] = useFormState<AuthActionState, FormData>(updatePassword, { ok: false });
  const [clave, setClave] = useState('');
  return (
    <form action={action} className="mt-6 space-y-3" noValidate>
      <div>
        <CampoClave
          id="password"
          name="password"
          label="Contraseña nueva"
          autoComplete="new-password"
          invalid={state.field === 'password'}
          describedBy="clave-fuerza"
          autoFocus
          value={clave}
          onChange={setClave}
        />
        <MedidorClave clave={clave} id="clave-fuerza" />
      </div>
      <CampoClave
        id="password2"
        name="password2"
        label="Repetila"
        autoComplete="new-password"
        invalid={state.field === 'password2'}
      />
      {state.error && (
        <p role="alert" className="flex items-start gap-2 text-small text-brote-coral">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </p>
      )}
      <div className="pt-1">
        <Guardar />
      </div>
    </form>
  );
}
