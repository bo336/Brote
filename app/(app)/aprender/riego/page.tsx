import { redirect } from 'next/navigation';

/**
 * `/aprender/riego` era el repaso del modelo anterior (el Bosque). Los avisos
 * nocturnos y algún link guardado todavía apuntan acá: se manda al repaso del
 * Árbol, que es lo mismo con otro nombre.
 */
export default function RiegoPage() {
  redirect('/aprender/repaso');
}
