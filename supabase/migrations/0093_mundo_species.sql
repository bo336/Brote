-- ============================================================================
-- MUNDO — las 64 especies de la Bitácora (14-CONTENT.md §1).
--
-- Generado desde `lib/world/species.ts`, que es la fuente. Las columnas mapean
-- 1:1 contra `world_species` justamente para que el archivo y la semilla no
-- puedan separarse; si hay que tocar una especie, se toca allá y se regenera.
--
-- `on conflict do update` y no `do nothing`: correr esta migración de nuevo
-- después de corregir un texto tiene que corregirlo, no ignorarlo en silencio.
--
-- La restricción de 12-18 palabras de 0092 se aplica a cada fila de acá. Si una
-- ficha se pasa, esta migración falla — que es exactamente lo que queremos.
-- ============================================================================

insert into public.world_species
  (slug, name_es, blurb_es, kind, region, min_tier, time_of_day, rarity, domain_slug)
values
  ('tierra_viva', 'Tierra viva', 'Suelo oscuro y suelto. Un puñado sano tiene más vida que todo el barrio junto.', 'planta', 'claro', 1, array['dia']::text[], 1, 'aire_suelo'),
  ('hormiga_negra', 'Hormiga negra', 'Mueven semillas sin querer y así plantan medio campo. Trabajan mejor cuando no las mirás.', 'insecto', 'claro', 1, array['dia', 'atardecer']::text[], 1, 'animales'),
  ('flechilla', 'Flechilla', 'Pasto de pampa. Sus semillas se enroscan solas en la tierra para enterrarse cuando llueve.', 'planta', 'pradera', 2, array['dia']::text[], 1, 'plantas'),
  ('cortadera', 'Cortadera', 'Penacho plateado que se mueve con todo el viento. De cerca corta, de lejos brilla.', 'planta', 'pradera', 2, array['dia', 'atardecer']::text[], 1, 'plantas'),
  ('trebol_blanco', 'Trébol blanco', 'Le devuelve nitrógeno al suelo. Donde hay trébol, después crece cualquier otra cosa mejor.', 'planta', 'pradera', 2, array['dia']::text[], 1, 'alimentacion'),
  ('chinita', 'Vaquita de San Antonio', 'Se come cientos de pulgones por semana. Es control de plagas con patitas y sin veneno.', 'insecto', 'pradera', 2, array['dia']::text[], 1, 'animales'),
  ('hornero', 'Hornero', 'Construye su horno de barro en dos meses, siempre con la puerta lejos del viento sur.', 'ave', 'pradera', 2, array['amanecer', 'dia']::text[], 2, 'animales'),
  ('tijerita', 'Tijereta', 'Viaja desde el norte cada primavera. La cola larga le sirve para frenar en el aire.', 'ave', 'pradera', 2, array['dia', 'atardecer']::text[], 2, 'animales'),
  ('grillo_campo', 'Grillo de campo', 'Canta frotando las alas. Cuanto más calor hace, más rápido le sale la misma canción.', 'insecto', 'pradera', 2, array['noche']::text[], 1, 'animales'),
  ('rocio_manana', 'Rocío de la mañana', 'Agua que el aire deja caer sin llover. Muchas plantas del secano viven casi de esto.', 'fenomeno', 'pradera', 2, array['amanecer']::text[], 2, 'agua'),
  ('margarita_pampa', 'Margarita de campo', 'Abre con el sol y cierra al atardecer. Le lleva el mismo tiempo todos los días.', 'planta', 'jardin', 3, array['dia']::text[], 1, 'plantas'),
  ('verbena', 'Verbena', 'Flor chiquita en ramillete. Las mariposas la eligen porque pueden pararse sin esfuerzo encima.', 'planta', 'jardin', 3, array['dia']::text[], 1, 'plantas'),
  ('lantana', 'Lantana', 'Cambia de color mientras envejece. Amarilla es nueva, naranja ya fue visitada por alguien.', 'planta', 'jardin', 3, array['dia', 'atardecer']::text[], 1, 'plantas'),
  ('salvia_azul', 'Salvia azul', 'Su flor tiene una palanquita: cuando entra el abejorro, el polen le cae justo encima.', 'planta', 'jardin', 3, array['dia']::text[], 2, 'plantas'),
  ('jazmin_pais', 'Jazmín del país', 'Perfuma más de noche porque sus polinizadores son polillas y no abejas. Estrategia, no casualidad.', 'planta', 'jardin', 3, array['atardecer', 'noche']::text[], 2, 'plantas'),
  ('abeja_nativa', 'Abeja nativa sin aguijón', 'No pica y poliniza mejor que la europea en muchas plantas nuestras. Vive en troncos huecos.', 'insecto', 'jardin', 3, array['dia']::text[], 2, 'animales'),
  ('abejorro', 'Abejorro', 'Vibra las flores a la frecuencia justa para que suelten el polen. Se llama polinización por zumbido.', 'insecto', 'jardin', 3, array['dia']::text[], 2, 'animales'),
  ('mariposa_bandera', 'Bandera argentina', 'Celeste y blanca de verdad. Sus orugas comen una sola planta y no aceptan reemplazo.', 'insecto', 'jardin', 3, array['dia']::text[], 2, 'animales'),
  ('esperanza_verde', 'Esperanza', 'Parece una hoja hasta que se mueve. El disfraz le funciona incluso con las nervaduras dibujadas.', 'insecto', 'jardin', 3, array['noche']::text[], 2, 'animales'),
  ('luciernaga', 'Luciérnaga', 'Su luz es química y fría: casi no pierde energía en calor. Nosotros todavía no sabemos copiarla.', 'insecto', 'jardin', 3, array['noche']::text[], 3, 'animales'),
  ('ceibo', 'Ceibo', 'Flor nacional. Aguanta el suelo inundado que mataría a casi cualquier otro árbol del país.', 'arbol', 'arboleda', 4, array['dia']::text[], 2, 'plantas'),
  ('tala', 'Tala', 'Arbolito espinoso del talar bonaerense. Sus frutos amarillos alimentan a media docena de aves distintas.', 'arbol', 'arboleda', 4, array['dia']::text[], 1, 'plantas'),
  ('zorzal', 'Zorzal colorado', 'Canta antes que salga el sol. Cada macho repite un repertorio propio que no comparte.', 'ave', 'arboleda', 4, array['amanecer', 'dia']::text[], 1, 'animales'),
  ('benteveo', 'Benteveo', 'Come de todo: insectos, frutas, hasta peces chicos. Por eso está en toda la ciudad.', 'ave', 'arboleda', 4, array['dia']::text[], 1, 'animales'),
  ('algarrobo', 'Algarrobo', 'Sus vainas dulces fueron harina y bebida mucho antes de que existiera el trigo acá.', 'arbol', 'arboleda', 5, array['dia']::text[], 2, 'alimentacion'),
  ('aguaribay', 'Aguaribay', 'Da sombra y espanta insectos con su olor a pimienta. Por eso está en tantas plazas.', 'arbol', 'arboleda', 5, array['dia']::text[], 2, 'plantas'),
  ('chilca', 'Chilca', 'Arbusto pionero: es el primero en volver a un terreno pelado y prepara el suelo.', 'arbusto', 'arboleda', 5, array['dia']::text[], 1, 'plantas'),
  ('mora_silvestre', 'Mora silvestre', 'Fruto que tiñe los dedos. Los pájaros la comen y plantan el arbusto varios kilómetros después.', 'arbusto', 'arboleda', 5, array['dia']::text[], 1, 'alimentacion'),
  ('nido_hornero', 'Nido de hornero', 'Nunca lo reusa dos veces. El del año pasado ya es departamento de golondrinas o gorriones.', 'estructura', 'arboleda', 5, array['dia']::text[], 2, 'animales'),
  ('carpintero_real', 'Carpintero real', 'Los huecos que abre terminan siendo casa de loros, murciélagos y abejas nativas después.', 'ave', 'arboleda', 6, array['dia']::text[], 3, 'animales'),
  ('hongo_yema', 'Hongo de yema', 'Crece sobre el tronco vivo. Buena parte del árbol come gracias a hongos que no vemos.', 'hongo', 'arboleda', 6, array['amanecer', 'dia']::text[], 2, 'plantas'),
  ('liquen_pulmonar', 'Liquen pulmonar', 'Solo vive donde el aire está limpio. Si aparece, tu aire mejoró; no es decoración.', 'hongo', 'arboleda', 6, array['dia']::text[], 3, 'aire_suelo'),
  ('junco', 'Junco', 'Filtra el agua que lo atraviesa. Un juncal sano limpia más que cualquier máquina chica.', 'planta', 'rio', 7, array['dia']::text[], 1, 'agua'),
  ('camalote', 'Camalote', 'Flota en balsas enormes y viaja río abajo llevando bichos, semillas y a veces yararás.', 'planta', 'rio', 7, array['dia']::text[], 1, 'agua_azul'),
  ('iris_amarillo', 'Iris de agua', 'Sus raíces atrapan metales del agua. Se usa para limpiar zanjas que nadie querría tocar.', 'planta', 'rio', 7, array['dia']::text[], 2, 'agua'),
  ('mojarra', 'Mojarra', 'Vive en cardumen para confundir. Cuando el agua se enturbia, es la primera que desaparece.', 'pez', 'rio', 7, array['dia']::text[], 1, 'agua_azul'),
  ('tararira', 'Tararira', 'Cazadora de emboscada entre los juncos. Aguanta agua con poco oxígeno mejor que casi todos.', 'pez', 'rio', 7, array['atardecer', 'noche']::text[], 3, 'agua_azul'),
  ('bagre_sapo', 'Bagre sapo', 'Busca comida con los bigotes en el fondo oscuro. No necesita ver para encontrar nada.', 'pez', 'rio', 7, array['noche']::text[], 2, 'agua_azul'),
  ('rana_criolla', 'Rana criolla', 'Respira también por la piel, así que el agua sucia la afecta antes que a nadie.', 'anfibio', 'rio', 7, array['atardecer', 'noche']::text[], 2, 'animales'),
  ('libelula', 'Libélula', 'Pasó casi toda su vida bajo el agua. Lo que ves volando son sus últimas semanas.', 'insecto', 'rio', 7, array['dia']::text[], 2, 'animales'),
  ('martin_pescador', 'Martín pescador', 'Corrige solo la refracción del agua antes de tirarse. Calcula dónde está el pez, no dónde parece.', 'ave', 'rio', 7, array['dia']::text[], 3, 'agua_azul'),
  ('garza_blanca', 'Garza blanca', 'Espera inmóvil hasta veinte minutos. La paciencia le sale más barata que perseguir.', 'ave', 'rio', 7, array['amanecer', 'dia']::text[], 2, 'agua_azul'),
  ('cardon', 'Cardón', 'Crece un centímetro por año. El que ves de tres metros es más viejo que tu abuela.', 'planta', 'monte', 8, array['dia']::text[], 2, 'plantas'),
  ('chaguar', 'Chaguar', 'De sus fibras salen bolsos que duran décadas. Textil sin fábrica, sin agua y sin tintura industrial.', 'planta', 'monte', 8, array['dia']::text[], 2, 'consumo'),
  ('musgo_cueva', 'Musgo de cueva', 'Vive con la luz que apenas entra por la boca de la cueva. Le alcanza.', 'planta', 'monte', 8, array['dia', 'noche']::text[], 2, 'aire_suelo'),
  ('cuarzo_blanco', 'Cuarzo blanco', 'Se formó despacio, en grietas, con agua caliente. Cada veta es una fisura que se curó.', 'mineral', 'monte', 8, array['dia']::text[], 1, 'ciencia'),
  ('mica', 'Mica', 'Se abre en láminas finísimas. Antes de que existiera el vidrio, las ventanas eran de esto.', 'mineral', 'monte', 8, array['dia']::text[], 2, 'ciencia'),
  ('condor', 'Cóndor andino', 'Planea horas sin batir las alas. Aprovecha el aire caliente que sube del roquedal.', 'ave', 'monte', 8, array['dia']::text[], 4, 'animales'),
  ('murcielago_frutero', 'Murciélago frutero', 'Planta más árboles que cualquier ave: come fruta volando y suelta las semillas lejos.', 'mamifero', 'monte', 8, array['noche']::text[], 3, 'animales'),
  ('lagartija_roquera', 'Lagartija de las rocas', 'Regula su temperatura cambiando de piedra. Es calefacción y aire acondicionado sin enchufe.', 'reptil', 'monte', 8, array['dia']::text[], 2, 'animales'),
  ('yareta', 'Yareta', 'Parece una piedra verde y crece un milímetro por año. Algunas tienen más de mil años.', 'planta', 'cumbre', 9, array['dia']::text[], 4, 'plantas'),
  ('llareta_flor', 'Flor de altura', 'Crece pegada al suelo para escapar del viento. Arriba de diez centímetros ya hace mucho frío.', 'planta', 'cumbre', 9, array['dia']::text[], 3, 'plantas'),
  ('nieve_polvo', 'Nieve polvo', 'Es agua guardada. Lo que se derrite en octubre es lo que toma el valle en enero.', 'fenomeno', 'cumbre', 9, array['amanecer', 'dia']::text[], 2, 'agua'),
  ('escarcha', 'Escarcha', 'Vapor que pasa directo a hielo sin ser agua nunca. Se llama sublimación inversa.', 'fenomeno', 'cumbre', 9, array['amanecer']::text[], 2, 'agua'),
  ('huemul', 'Huemul', 'Quedan menos de dos mil. Está en el escudo nacional y casi nadie lo vio nunca.', 'mamifero', 'cumbre', 9, array['amanecer', 'atardecer']::text[], 4, 'animales'),
  ('zorro_gris', 'Zorro gris', 'Come fruta además de carne, y así dispersa semillas por lugares donde ningún pájaro llega.', 'mamifero', 'cumbre', 9, array['atardecer', 'noche']::text[], 3, 'animales'),
  ('chinchillon', 'Chinchillón', 'Vive entre las rocas y toma sol en grupo. Su pelo es de los más densos del mundo.', 'mamifero', 'cumbre', 9, array['amanecer', 'atardecer']::text[], 3, 'animales'),
  ('rastro_puma', 'Rastro de puma', 'Huella redonda, sin garras marcadas. Si la ves, él ya te vio hace un rato.', 'rastro', 'cumbre', 9, array['amanecer', 'noche']::text[], 4, 'animales'),
  ('cachiyuyo', 'Cachiyuyo', 'Aguanta la sal que mata a casi todo. Fija la duna y frena el avance del mar.', 'planta', 'islote', 10, array['dia']::text[], 2, 'agua_azul'),
  ('alga_parda', 'Alga parda', 'Los bosques de algas guardan tanto carbono por hectárea como un monte en tierra firme.', 'alga', 'islote', 10, array['dia']::text[], 2, 'agua_azul'),
  ('cangrejo_cavador', 'Cangrejo cavador', 'Sus cuevas oxigenan el barro. Sin ellos el cangrejal se pudre en pocas temporadas.', 'crustaceo', 'islote', 10, array['dia', 'atardecer']::text[], 2, 'agua_azul'),
  ('gaviotin', 'Gaviotín', 'Algunos hacen el viaje más largo del planeta: de un polo al otro, todos los años.', 'ave', 'islote', 10, array['dia']::text[], 3, 'animales'),
  ('lobo_marino', 'Lobo marino', 'Duerme con medio cerebro por vez para seguir subiendo a respirar sin ahogarse.', 'mamifero', 'islote', 10, array['dia']::text[], 3, 'animales'),
  ('cruz_del_sur', 'Cruz del Sur', 'Cuatro estrellas que apuntan al sur. Sirvió de brújula mucho antes de que existiera el GPS.', 'astro', 'islote', 10, array['noche']::text[], 3, 'ciencia')
on conflict (slug) do update set
  name_es     = excluded.name_es,
  blurb_es    = excluded.blurb_es,
  kind        = excluded.kind,
  region      = excluded.region,
  min_tier    = excluded.min_tier,
  time_of_day = excluded.time_of_day,
  rarity      = excluded.rarity,
  domain_slug = excluded.domain_slug;
