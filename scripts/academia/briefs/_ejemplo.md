# Ejemplo de referencia — un gajo completo de `tronco.mjs` (ya escrito, no lo toques)

Copiá este nivel de calidad, este tono y esta forma exacta.

```js
  rama: 'tronco',
  gajos: [
    {
      slug: 'tronco.sistemas-vivos',
      anillo: 1,
      titulo_es: 'Sistemas vivos',
      bajada_es: 'Nada está solo: todo lo que vive está enganchado con otra cosa.',
      icono: 'Sprout',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 1,
      conceptos: [
        {
          slug: 'tronco.que_es_ecosistema',
          titulo_es: 'Qué es un ecosistema',
          enunciado_es:
            'Un ecosistema son los seres vivos de un lugar, el ambiente físico que los rodea y —sobre todo— las relaciones entre ellos.',
          detalle_es:
            'La palabra clave es "relaciones": un ecosistema no es una lista de especies, es lo que se hacen entre sí.',
          fuente: 'naaee-guidelines',
          anillo: 1,
          dificultad_base: -1.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'tronco.todo_esta_conectado',
          titulo_es: 'Todo está conectado',
          enunciado_es:
            'Tocar una parte de un ecosistema mueve otras partes, incluso las que parecen no tener nada que ver.',
          detalle_es: null,
          fuente: 'ipbes-global',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.que_es_ecosistema'],
        },
        {
          slug: 'tronco.servicios_ecosistemicos',
          titulo_es: 'Lo que la naturaleza hace por nosotros',
          enunciado_es:
            'Los ecosistemas hacen trabajo gratis que nos sostiene: filtran agua, polinizan cultivos, dan sombra y guardan carbono.',
          detalle_es: 'Se los llama servicios ecosistémicos. Se notan sobre todo cuando faltan.',
          fuente: 'ipbes-global',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.que_es_ecosistema'],
        },
        {
          slug: 'tronco.escala_local_global',
          titulo_es: 'Lo local y lo global',
          enunciado_es:
            'Un mismo problema ambiental se ve distinto según la escala: lo que resuelve una cuadra puede no mover nada a nivel país, y al revés.',
          detalle_es: null,
          fuente: 'unesco-ods',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.todo_esta_conectado'],
        },
        {
          slug: 'tronco.ciclos_materia',
          titulo_es: 'La materia da vueltas',
          enunciado_es:
            'En la naturaleza la materia no desaparece: circula. El agua, el carbono y los nutrientes hacen ciclos que vuelven a empezar.',
          detalle_es: null,
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.8,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.que_es_ecosistema'],
        },
      ],
      hojas: [
        {
          slug: 'tronco.sistemas-vivos.1',
          titulo_es: 'Qué es un ecosistema',
          bajada_es: 'Empezamos por la palabra que sostiene todas las demás.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['tronco.que_es_ecosistema', 'tronco.todo_esta_conectado'],
        },
        {
          slug: 'tronco.sistemas-vivos.2',
          titulo_es: 'El trabajo que no se cobra',
          bajada_es: 'Sombra, agua limpia y polinización: quién los hace.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['tronco.servicios_ecosistemicos', 'tronco.que_es_ecosistema'],
        },
        {
          slug: 'tronco.sistemas-vivos.3',
          titulo_es: 'Vueltas que no terminan',
          bajada_es: 'El agua y el carbono no se gastan: cambian de lugar.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['tronco.ciclos_materia', 'tronco.todo_esta_conectado'],
        },
        {
          slug: 'tronco.sistemas-vivos.4',
          titulo_es: 'Tu cuadra y el planeta',
          bajada_es: 'Cuándo una acción chica alcanza y cuándo no.',
  // ... (4 gajos más con la misma forma)
```
