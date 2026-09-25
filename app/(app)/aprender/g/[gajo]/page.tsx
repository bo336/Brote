import { redirect } from 'next/navigation';

/**
 * Los gajos eran las unidades del modelo anterior (el Bosque). Ya no existen
 * como pantalla: un link viejo a un gajo cae en el Árbol, que es donde está
 * todo ahora.
 */
export default function GajoPage() {
  redirect('/aprender');
}
