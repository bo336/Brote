'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Tell the server the world failed to open on this device.
 *
 * The phone bug (R10) could not be reproduced in any emulator, because only a
 * real phone runs out of memory or lacks WebGL 2. This is how the next one gets
 * seen: kind, message, and what the device says about itself — no location, no
 * contacts, nothing personal beyond the account the row belongs to. The server
 * caps it at a handful per account per day (`world_report_client_error`, 0119).
 *
 * Never throws and never waits on anything: a report must not become the
 * second failure.
 */
export async function reportarFalloMundo(
  tipo: 'sin_webgl2' | 'render' | 'contexto_perdido' | 'arranque_liviano',
  mensaje: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const info: Record<string, unknown> = {
      ua: nav?.userAgent?.slice(0, 300),
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio : null,
      pantalla: typeof window !== 'undefined' ? [window.screen?.width, window.screen?.height] : null,
      nucleos: nav?.hardwareConcurrency ?? null,
      memoria: (nav as unknown as { deviceMemory?: number } | null)?.deviceMemory ?? null,
      tactil: typeof window !== 'undefined' ? window.matchMedia?.('(pointer: coarse)')?.matches ?? null : null,
      standalone: typeof window !== 'undefined' ? window.matchMedia?.('(display-mode: standalone)')?.matches ?? null : null,
      ...extra,
    };
    await createClient().rpc('world_report_client_error', {
      p_kind: tipo,
      p_message: mensaje.slice(0, 500),
      p_info: info,
    });
  } catch {
    /* reporting is best-effort */
  }
}
