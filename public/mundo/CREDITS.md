# Créditos de audio — El Mundo

Cada archivo de sonido que entra a `public/mundo/audio/` se anota acá **en el
mismo commit en que se agrega**, con su URL de origen y su licencia. Un archivo
sin fila en esta tabla es un archivo que hay que sacar.

## La regla que no se negocia

**Nunca CC-BY-NC.** Brote cobra, así que una licencia no comercial en cualquier
parte del árbol es un problema legal y no uno de atribución. Las licencias
aceptadas son **CC0**, **CC-BY**, **CC-BY-SA** y dominio público, y
`lib/world/audio.ts` las tiene listadas para que la prueba las verifique en vez
de que las verifique alguien leyendo.

Fuentes recomendadas por `16-UI-AUDIO-A11Y.md` §2: los paquetes CC0 de Kenney
—un solo autor da un set coherente— y Freesound filtrado a **CC0**.

## El presupuesto

| Límite | Valor |
|---|---|
| Carga inicial | ≤ 1,5 MB |
| Total | ≤ 4 MB |
| Fuentes posicionales simultáneas | 4 |
| Música | **un** loop de 60–90 s, ~96 kbps mono AAC |
| Efectos | 25, mono, 22–32 kHz, ~64 kbps, 5–20 KB cada uno |

La variación de la música se hace **filtrando el mismo loop** —un pasa-bajos de
noche, un agachado adentro de la cueva— y nunca mandando más audio.

## Los archivos

| Archivo | Qué es | Origen | Autor | Licencia |
|---|---|---|---|---|
| _(ninguno todavía)_ | | | | |

## Estado

**No hay un solo archivo de audio en el repositorio.** El motor está construido
—un solo `AudioContext`, el desbloqueo de iOS, `visibilitychange`, silenciado
por defecto en teléfono, tope de cuatro fuentes— y la lista de sonidos está en
`14-CONTENT.md` §8, pero elegir y descargar veintiséis archivos con licencia
verificada es un trabajo de curaduría que necesita a una persona escuchándolos.

Hasta que esa fila diga algo, el mundo anda en silencio, que es exactamente lo
que hace hoy en un teléfono de todas formas.
