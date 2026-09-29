import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { TreePine } from 'lucide-react';

/**
 * What `/mundo` shows when the world is not open for this account.
 *
 * It used to `redirect('/perfil')`. Tapped from the poster on `/perfil` that
 * looks exactly like the page jumping back to its top — which is how the owner
 * described it on their phone ("it just redirects to the top of the page").
 * A door that does nothing is a bug report; a door that says "not yet" is not.
 */
export async function MundoCerrado() {
  const t = await getTranslations('mundo.cerrado');
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-2 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/12 text-primary">
        <TreePine className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="font-display text-h2 font-bold">{t('titulo')}</h1>
      <p className="text-small leading-relaxed text-muted-foreground">{t('cuerpo')}</p>
      <Link
        href="/"
        className="press mt-2 rounded-full bg-primary px-5 py-2.5 text-small font-semibold text-primary-foreground"
      >
        {t('volver')}
      </Link>
    </div>
  );
}
