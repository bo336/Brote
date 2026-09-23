-- Generado por scripts/academia-arbol/construir.mjs — cierre.
-- No se edita a mano: se edita el contenido y se vuelve a construir.
-- Idempotente: cargar dos veces deja lo mismo.

-- Retira (no borra) las unidades que ya no están en el currículum.
select ac_retirar_unidades_fuera(array['tronco-1']::text[]);
