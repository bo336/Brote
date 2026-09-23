-- Generado por scripts/academia-arbol/construir.mjs — cierre.
-- No se edita a mano: se edita el contenido y se vuelve a construir.
-- Idempotente: cargar dos veces deja lo mismo.

-- Retira (no borra) las unidades que ya no están en el currículum.
select ac_retirar_unidades_fuera(array['agua-1', 'agua-2', 'agua-3', 'agua-4', 'agua-5', 'agua-6', 'aire-suelo-1', 'aire-suelo-2', 'aire-suelo-3', 'aire-suelo-4', 'alimentacion-1', 'alimentacion-2', 'alimentacion-3', 'alimentacion-4', 'animales-1', 'animales-2', 'animales-3', 'animales-4', 'ciencia-1', 'ciencia-2', 'ciencia-3', 'ciencia-4', 'comunidad-1', 'comunidad-2', 'comunidad-3', 'comunidad-4', 'consumo-1', 'consumo-2', 'consumo-3', 'consumo-4', 'digital-1', 'digital-2', 'digital-3', 'digital-4', 'energia-1', 'energia-2', 'energia-3', 'energia-4', 'movilidad-1', 'movilidad-2', 'movilidad-3', 'movilidad-4', 'oceanos-1', 'oceanos-2', 'oceanos-3', 'oceanos-4', 'plantas-1', 'plantas-2', 'plantas-3', 'plantas-4', 'residuos-1', 'residuos-2', 'residuos-3', 'residuos-4', 'tronco-1', 'tronco-2', 'tronco-3']::text[]);
