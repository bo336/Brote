// Rama: movilidad — cómo nos movemos por la ciudad y cuánto pesa cada forma.
// Puro dato. Ver scripts/academia/CONTRATO.md.

export default {
  rama: 'movilidad',
  gajos: [
    // ───────────────────────────── ANILLO 1 ─────────────────────────────
    {
      slug: 'movilidad.la-piramide',
      anillo: 1,
      titulo_es: 'La pirámide de la movilidad',
      bajada_es: 'Quién va primero cuando se reparte una calle.',
      icono: 'Footprints',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 1,
      conceptos: [
        {
          slug: 'movilidad.piramide_movilidad',
          titulo_es: 'Quién va primero',
          enunciado_es:
            'Cuando se reparte el espacio de una calle, primero está quien camina, después la bici, después el transporte público, y último el auto particular.',
          detalle_es:
            'Se la llama pirámide invertida de la movilidad: al revés de como se diseñaron las ciudades durante casi todo el siglo XX.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -1.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'movilidad.espacio_de_la_calle',
          titulo_es: 'Cuánta calle ocupa cada uno',
          enunciado_es:
            'Mover a una persona en auto ocupa muchísimo más asfalto que moverla en colectivo, en bici o a pie.',
          detalle_es:
            'Fijate en cualquier avenida en hora pico: la mayoría de los autos lleva una sola persona adentro.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'movilidad.movilidad_activa',
          titulo_es: 'Moverte con tu propio cuerpo',
          enunciado_es:
            'Caminar y pedalear también son transporte: mueven gente sin motor y, de paso, hacen que quien se mueve esté más sano.',
          detalle_es:
            'Buena parte de los viajes urbanos son cortos, y son justo los que entran a pie o en bici.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -1.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'movilidad.pasajero_km',
          titulo_es: 'Por pasajero y por kilómetro',
          enunciado_es:
            'Para comparar dos formas de viajar hay que mirar la energía y las emisiones por pasajero y por kilómetro, no por vehículo: un auto con una sola persona y un colectivo lleno no se miden igual.',
          detalle_es:
            'Es la misma unidad para todos los modos. Sin ella, cualquier comparación entre auto y colectivo se puede acomodar para el lado que uno quiera.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['tronco.por_persona_vs_total'],
        },
      ],
      hojas: [
        {
          slug: 'movilidad.la-piramide.1',
          titulo_es: 'Quién va primero',
          bajada_es: 'La calle tiene un orden de prioridades. No es el que parece.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['movilidad.piramide_movilidad', 'movilidad.espacio_de_la_calle'],
        },
        {
          slug: 'movilidad.la-piramide.2',
          titulo_es: 'El asfalto que ocupa cada uno',
          bajada_es: 'La misma cuadra mueve muy distinta cantidad de gente según cómo se use.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['movilidad.espacio_de_la_calle', 'movilidad.movilidad_activa'],
        },
        {
          slug: 'movilidad.la-piramide.3',
          titulo_es: 'Contar bien antes de opinar',
          bajada_es: 'Por pasajero y por kilómetro: la unidad que hace justas las comparaciones.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: ['movilidad.pasajero_km', 'movilidad.piramide_movilidad'],
        },
        {
          slug: 'movilidad.la-piramide.4',
          titulo_es: 'A pie y pedaleando',
          bajada_es: 'Los viajes cortos son la mitad de la historia urbana.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['movilidad.movilidad_activa', 'movilidad.piramide_movilidad'],
        },
      ],
    },
    {
      slug: 'movilidad.aire-que-respiramos',
      anillo: 1,
      titulo_es: 'El aire que respiramos',
      bajada_es: 'Lo que sale del tránsito y no se ve.',
      icono: 'Wind',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 2,
      conceptos: [
        {
          slug: 'movilidad.material_particulado',
          titulo_es: 'Partículas que no se ven',
          enunciado_es:
            'El material particulado son partículas tan chicas que el ojo no las registra, y las más finas llegan hasta lo hondo del pulmón.',
          detalle_es:
            'PM10 y PM2.5 son medidas de tamaño: el número es el diámetro en micrones. Cuanto más chica, más adentro llega.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'movilidad.pm_del_transito',
          titulo_es: 'No todo sale del caño de escape',
          enunciado_es:
            'Buena parte del material particulado del tránsito no sale del escape: lo aportan los frenos, las cubiertas y el polvo que levantan las ruedas.',
          detalle_es:
            'Por eso un auto eléctrico mejora el aire, pero no lo deja impecable: sigue frenando y sigue teniendo cubiertas.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.material_particulado'],
        },
        {
          slug: 'movilidad.nox_y_ozono',
          titulo_es: 'Nitrógeno, sol y ozono de abajo',
          enunciado_es:
            'Los óxidos de nitrógeno que largan los motores, cocinados por el sol, forman ozono a nivel del suelo, que irrita las vías respiratorias.',
          detalle_es:
            'Ese ozono de abajo no tiene nada que ver con la capa de ozono de la estratósfera, que nos protege del ultravioleta. Mismo gas, dos historias distintas.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.material_particulado'],
        },
        {
          slug: 'movilidad.ruido_urbano',
          titulo_es: 'El ruido también contamina',
          enunciado_es:
            'El ruido del tránsito es contaminación: no deja descansar a las personas y cambia la forma en que se comunican los pájaros de la ciudad.',
          detalle_es:
            'Prestá atención una madrugada de domingo en tu cuadra: esa es la ciudad sin el motor de fondo.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -0.8,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
      ],
      hojas: [
        {
          slug: 'movilidad.aire-que-respiramos.1',
          titulo_es: 'Lo que no se ve del aire',
          bajada_es: 'Partículas chiquitas, con nombre y apellido.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['movilidad.material_particulado', 'movilidad.pm_del_transito'],
        },
        {
          slug: 'movilidad.aire-que-respiramos.2',
          titulo_es: 'Dos ozonos, no uno',
          bajada_es: 'El de arriba protege; el de abajo irrita. No los confundas nunca más.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['movilidad.nox_y_ozono', 'movilidad.material_particulado'],
        },
        {
          slug: 'movilidad.aire-que-respiramos.3',
          titulo_es: 'Bajar el volumen del barrio',
          bajada_es: 'El ruido no es solo molesto: es un contaminante más.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['movilidad.ruido_urbano', 'movilidad.material_particulado'],
        },
        {
          slug: 'movilidad.aire-que-respiramos.4',
          titulo_es: 'Aire de avenida',
          bajada_es: 'Frenos, cubiertas, motores y sol, todo junto en la misma esquina.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 4,
          conceptos: ['movilidad.pm_del_transito', 'movilidad.nox_y_ozono', 'movilidad.ruido_urbano'],
        },
      ],
    },
    {
      slug: 'movilidad.ciudad-que-se-camina',
      anillo: 1,
      titulo_es: 'La ciudad que se camina',
      bajada_es: 'Cómo está hecha una calle en la que cualquiera puede cruzar.',
      icono: 'TrafficCone',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 3,
      conceptos: [
        {
          slug: 'movilidad.velocidad_y_riesgo',
          titulo_es: 'Despacio se cruza mejor',
          enunciado_es:
            'Cuando los autos van más despacio, cruzar la calle se vuelve mucho más seguro: por eso existen las zonas 30 cerca de escuelas y plazas.',
          detalle_es:
            'La velocidad no cambia solo cuánto tarda un choque en pasar: cambia cuánta gente se anima a caminar y a andar en bici por ahí.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -0.9,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'movilidad.calle_compartida',
          titulo_es: 'Una calle para todo el mundo',
          enunciado_es:
            'Veredas anchas, cruces cortos y sombra son lo que hace que caminar sea posible para cualquiera: un pibe de siete años y una persona de ochenta.',
          detalle_es:
            'Si una calle solo funciona para alguien que camina rápido y ve bien, esa calle está mal hecha.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'movilidad.efecto_barrera',
          titulo_es: 'Cuando la avenida parte el barrio',
          enunciado_es:
            'Una autopista o una avenida muy ancha corta un barrio en dos: lo que queda del otro lado deja de estar cerca aunque esté a cien metros.',
          detalle_es:
            'Se lo llama efecto barrera. La distancia física no cambió; la distancia real, sí.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.calle_compartida'],
        },
        {
          slug: 'movilidad.red_no_tramo',
          titulo_es: 'Vale la red, no el tramo',
          enunciado_es:
            'Una ciclovía suelta sirve poco: lo que hace que la gente se anime a la bici es una red continua que conecte de donde salís con adonde vas.',
          detalle_es:
            'La red de ciclovías de CABA y las bicis de Ecobici funcionan con esa lógica: cada tramo vale por lo que conecta.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.movilidad_activa'],
        },
        {
          slug: 'movilidad.pedir_la_calle',
          titulo_es: 'Cómo se cambia una calle',
          enunciado_es:
            'Cambiar una calle no es solo una decisión técnica: la Ley General del Ambiente reconoce que la gente tiene derecho a informarse y a opinar antes, en instancias de participación como las audiencias públicas.',
          detalle_es:
            'Una vecinal, un centro de estudiantes o un grupo de la cuadra pueden presentarse. Es más común de lo que parece.',
          fuente: 'ley-25675-ambiente',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: [
            'movilidad.calle_compartida',
            { slug: 'tronco.acceso_informacion', fuerza: 0.6 },
          ],
        },
      ],
      hojas: [
        {
          slug: 'movilidad.ciudad-que-se-camina.1',
          titulo_es: 'Bajar la velocidad',
          bajada_es: 'Qué cambia en una cuadra cuando los autos van a 30.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['movilidad.velocidad_y_riesgo', 'movilidad.calle_compartida'],
        },
        {
          slug: 'movilidad.ciudad-que-se-camina.2',
          titulo_es: 'Del otro lado de la autopista',
          bajada_es: 'Cien metros que se sienten como diez cuadras.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['movilidad.efecto_barrera', 'movilidad.calle_compartida'],
        },
        {
          slug: 'movilidad.ciudad-que-se-camina.3',
          titulo_es: 'Una red, no un pedazo',
          bajada_es: 'Por qué una ciclovía sola no mueve a nadie.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['movilidad.red_no_tramo', 'movilidad.velocidad_y_riesgo'],
        },
        {
          slug: 'movilidad.ciudad-que-se-camina.4',
          titulo_es: 'Pedir la calle',
          bajada_es: 'Quién decide una obra y en qué momento podés meterte.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 4,
          conceptos: ['movilidad.pedir_la_calle', 'movilidad.efecto_barrera', 'movilidad.red_no_tramo'],
        },
      ],
    },
    {
      slug: 'movilidad.ir-todos-juntos',
      anillo: 1,
      titulo_es: 'Ir todos juntos',
      bajada_es: 'Colectivo, tren y subte: el sistema que sostiene el AMBA.',
      icono: 'Bus',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 4,
      conceptos: [
        {
          slug: 'movilidad.masivo_gana',
          titulo_es: 'Cuando el colectivo va lleno',
          enunciado_es:
            'Un colectivo, un tren o un subte llenos mueven a cada pasajero con mucha menos energía y mucho menos espacio que un auto con una sola persona adentro.',
          detalle_es:
            'La palabra clave es "llenos": el transporte masivo gana cuando lo usa mucha gente, y por eso la ocupación importa tanto como el motor.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.8,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'movilidad.espacio_de_la_calle',
            { slug: 'movilidad.pasajero_km', fuerza: 0.5 },
          ],
        },
        {
          slug: 'movilidad.brt_carril_propio',
          titulo_es: 'Un carril que es solo del colectivo',
          enunciado_es:
            'Un BRT es un colectivo con carril exclusivo y paradas fijas para que deje de estar atrapado en el mismo embotellamiento que los autos.',
          detalle_es:
            'El Metrobus porteño y los del conurbano son eso: la misma flota, pero con la calle ordenada a su favor.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.masivo_gana'],
        },
        {
          slug: 'movilidad.combinar_modos',
          titulo_es: 'Un viaje, varios modos',
          enunciado_es:
            'Un viaje no tiene por qué hacerse en un solo modo: caminar hasta la estación, tomar el tren y salir en bici del otro lado es un solo viaje bien armado.',
          detalle_es:
            'Los eslabones débiles suelen ser los extremos: la caminata hasta la parada y el último tramo hasta la puerta.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.piramide_movilidad'],
        },
        {
          slug: 'movilidad.frecuencia_manda',
          titulo_es: 'Cada cuánto pasa',
          enunciado_es:
            'Lo que vuelve usable al transporte público no es solo la tarifa: es la frecuencia, saber cuándo llega y poder caminar tranquilo hasta la parada.',
          detalle_es:
            'Un servicio barato que pasa cada cuarenta minutos pierde contra un auto. Uno que pasa cada cinco, no.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.masivo_gana'],
        },
      ],
      hojas: [
        {
          slug: 'movilidad.ir-todos-juntos.1',
          titulo_es: 'El colectivo lleno',
          bajada_es: 'Por qué la ocupación cambia todas las cuentas.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['movilidad.masivo_gana', 'movilidad.combinar_modos'],
        },
        {
          slug: 'movilidad.ir-todos-juntos.2',
          titulo_es: 'Metrobus, por dentro',
          bajada_es: 'Qué es exactamente un BRT y qué problema resuelve.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['movilidad.brt_carril_propio', 'movilidad.masivo_gana'],
        },
        {
          slug: 'movilidad.ir-todos-juntos.3',
          titulo_es: 'Bici, tren y a laburar',
          bajada_es: 'Armar un viaje con varios modos sin volverse loco.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['movilidad.combinar_modos', 'movilidad.brt_carril_propio'],
        },
        {
          slug: 'movilidad.ir-todos-juntos.4',
          titulo_es: 'La frecuencia es el servicio',
          bajada_es: 'Lo que hace que alguien deje el auto en casa.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 4,
          conceptos: ['movilidad.frecuencia_manda', 'movilidad.masivo_gana'],
        },
      ],
    },

    // ───────────────────────────── ANILLO 2 ─────────────────────────────
    {
      slug: 'movilidad.autos-y-corriente',
      anillo: 2,
      titulo_es: 'Autos, baterías y corriente',
      bajada_es: 'Qué cambia y qué no cuando el auto se enchufa.',
      icono: 'BatteryCharging',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 5,
      conceptos: [
        {
          slug: 'movilidad.ciclo_de_vida',
          titulo_es: 'Toda la vida del vehículo',
          enunciado_es:
            'Para comparar dos autos hay que sumar toda su vida: fabricarlo, moverlo durante años y qué pasa cuando se jubila.',
          detalle_es:
            'Mirar solo una etapa —solo el escape, o solo la fábrica— siempre da la respuesta que uno ya quería escuchar.',
          fuente: 'icct-ev',
          anillo: 2,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.no_todo_pesa_igual'],
        },
        {
          slug: 'movilidad.bateria_y_litio',
          titulo_es: 'De dónde sale la batería',
          enunciado_es:
            'La batería de un auto eléctrico necesita minerales, y buena parte del litio del mundo está disuelto en la salmuera de los salares de altura: Argentina, Chile y Bolivia comparten el llamado triángulo del litio.',
          detalle_es:
            'Salinas Grandes y el Salar del Hombre Muerto son dos nombres de ese mapa que quedan dentro del país.',
          fuente: 'unep',
          anillo: 2,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.ciclo_de_vida'],
        },
        {
          slug: 'movilidad.electrico_sin_tubo_de_escape',
          titulo_es: 'Sin humo no es sin huella',
          enunciado_es:
            'Un auto eléctrico no emite nada por el caño de escape, pero sí emite al fabricarse —sobre todo la batería— y según con qué se genere la electricidad que lo carga; aun así, a lo largo de toda su vida emite bastante menos que un naftero comparable.',
          detalle_es:
            'Las dos cosas son ciertas al mismo tiempo, y ahí es donde se traba la discusión de sobremesa.',
          fuente: 'icct-ev',
          anillo: 2,
          dificultad_base: 0.1,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.ciclo_de_vida'],
          misconceptions: [
            {
              slug: 'movilidad.mito_electrico_no_contamina',
              creencia_es: 'Los autos eléctricos no contaminan.',
              correccion_es:
                'La trampa es tentadora porque una parte es verdad y encima es la parte que se ve: en la esquina no hay humo ni olor a nafta, y el aire del barrio mejora de verdad. Lo que no se ve queda lejos —la fábrica de la batería y la usina que genera la electricidad— y ahí sí hay emisiones. Sumando toda la vida del auto, el eléctrico emite bastante menos que un naftero comparable, pero no cero.',
              fuente: 'icct-ev',
            },
          ],
        },
        {
          slug: 'movilidad.matriz_electrica_importa',
          titulo_es: 'Depende del enchufe',
          enunciado_es:
            'Cuánto emite un auto eléctrico depende de la red que lo carga: cuanto más limpia es la generación eléctrica del lugar, más grande se hace la diferencia con el naftero.',
          detalle_es:
            'Y la red no es una foto fija: a medida que entra más renovable, el mismo auto que ya está andando emite menos que el año pasado.',
          fuente: 'carbon-brief',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.electrico_sin_tubo_de_escape'],
          misconceptions: [
            {
              slug: 'movilidad.mito_electrico_igual_o_peor',
              creencia_es:
                'Total el eléctrico contamina igual o más, porque la electricidad también sale de quemar algo.',
              correccion_es:
                'Es la sobrecorrección del mito anterior y suena sofisticada, porque señala algo real: la generación eléctrica emite. Pero el motor eléctrico aprovecha mucho mejor la energía, y las comparaciones de ciclo de vida dan a favor del eléctrico en prácticamente todas las redes estudiadas, incluso en las bastante sucias. La diferencia es de cuánto, no de para qué lado.',
              fuente: 'carbon-brief',
            },
          ],
        },
        {
          slug: 'movilidad.litio_y_agua',
          titulo_es: 'Litio, salares y agua',
          enunciado_es:
            'Sacar litio de un salar es, antes que nada, un asunto de agua: se bombea salmuera y se evapora en una de las regiones más secas del país, donde viven comunidades que dependen de ese agua.',
          detalle_es:
            'No es una discusión con respuesta obvia: la transición energética necesita baterías y las comunidades de la Puna necesitan su agua. Por eso se decide con información pública y participación, no a puertas cerradas.',
          fuente: 'unep',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.bateria_y_litio'],
        },
      ],
      hojas: [
        {
          slug: 'movilidad.autos-y-corriente.1',
          titulo_es: 'Todo el ciclo, no solo el caño',
          bajada_es: 'Fabricación, uso y final: las tres etapas que hay que sumar.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 1,
          conceptos: ['movilidad.ciclo_de_vida', 'movilidad.electrico_sin_tubo_de_escape'],
        },
        {
          slug: 'movilidad.autos-y-corriente.2',
          titulo_es: 'Depende del enchufe',
          bajada_es: 'El mismo auto emite distinto según dónde carga.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['movilidad.matriz_electrica_importa', 'movilidad.electrico_sin_tubo_de_escape'],
        },
        {
          slug: 'movilidad.autos-y-corriente.3',
          titulo_es: 'De dónde sale la batería',
          bajada_es: 'Un salar altísimo, agua salada y un mineral liviano.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['movilidad.bateria_y_litio', 'movilidad.ciclo_de_vida'],
        },
        {
          slug: 'movilidad.autos-y-corriente.4',
          titulo_es: 'La discusión del litio',
          bajada_es: 'Baterías arriba, agua abajo, y gente viviendo en el medio.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 4,
          conceptos: ['movilidad.litio_y_agua', 'movilidad.bateria_y_litio', 'movilidad.matriz_electrica_importa'],
        },
      ],
    },
    {
      slug: 'movilidad.mas-asfalto-mas-autos',
      anillo: 2,
      titulo_es: 'Más asfalto, más autos',
      bajada_es: 'Por qué ensanchar la avenida no destraba nada.',
      icono: 'Route',
      age_groups: ['teen', 'adult'],
      sort_order: 6,
      conceptos: [
        {
          slug: 'movilidad.demanda_inducida',
          titulo_es: 'El carril que se llena solo',
          enunciado_es:
            'Cuando se agrega un carril, al poco tiempo se vuelve a llenar: más capacidad vial termina generando más viajes en auto.',
          detalle_es:
            'Se llama demanda inducida, y es el efecto rebote aplicado al asfalto: la mejora se consume a sí misma.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['tronco.efecto_rebote'],
          misconceptions: [
            {
              slug: 'movilidad.mito_mas_carriles',
              creencia_es: 'Si ensanchan la avenida, se destraba el tránsito.',
              correccion_es:
                'Es tentador porque las primeras semanas es cierto y se siente en el cuerpo: se viaja más rápido. Eso mismo es lo que atrae viajes nuevos —gente que antes tomaba el colectivo, salía a otra hora o no viajaba— hasta que la avenida vuelve a estar igual, ahora con más autos. Lo que cambia el tiempo de viaje en serio es mover gente en menos vehículos.',
              fuente: 'ipcc-ar6',
            },
          ],
        },
        {
          slug: 'movilidad.estacionamiento_gratis',
          titulo_es: 'Lo que parece gratis',
          enunciado_es:
            'Estacionar en la calle parece gratis, pero ocupa suelo urbano que se regala; cuando ese espacio se cobra o se reduce, cambian los viajes que se hacen en auto.',
          detalle_es:
            'Cada lugar de estacionamiento es una superficie que podría ser vereda, bicisenda, contenedores o un árbol.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.espacio_de_la_calle'],
        },
        {
          slug: 'movilidad.ciudad_de_distancias_cortas',
          titulo_es: 'Todo cerca de la estación',
          enunciado_es:
            'Si la vivienda, el trabajo, la escuela y el súper están cerca de una estación, mucha gente deja de necesitar el auto sin habérselo propuesto.',
          detalle_es:
            'Es lo que se llama desarrollo orientado al transporte: no se convence a nadie, se cambia la geografía de la decisión.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.0,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.combinar_modos'],
        },
        {
          slug: 'movilidad.teletrabajo_rebote',
          titulo_es: 'Teletrabajo y el viaje que vuelve',
          enunciado_es:
            'Teletrabajar borra viajes diarios, pero puede sumar otros —mudarse más lejos, salidas durante el día, más envíos a casa—: el ahorro real hay que medirlo, no darlo por hecho.',
          detalle_es:
            'No es un argumento en contra del teletrabajo: es un recordatorio de que el ahorro se mide en el total, no en el viaje que dejaste de hacer.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: [
            'tronco.efecto_rebote',
            { slug: 'movilidad.demanda_inducida', fuerza: 0.5 },
          ],
        },
      ],
      hojas: [
        {
          slug: 'movilidad.mas-asfalto-mas-autos.1',
          titulo_es: 'El carril que se llena solo',
          bajada_es: 'La obra que promete destrabar y termina atrayendo tránsito.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 1,
          conceptos: ['movilidad.demanda_inducida', 'movilidad.estacionamiento_gratis'],
        },
        {
          slug: 'movilidad.mas-asfalto-mas-autos.2',
          titulo_es: 'Vivir cerca de la estación',
          bajada_es: 'Cuando la ciudad hace fácil la decisión buena.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['movilidad.ciudad_de_distancias_cortas', 'movilidad.demanda_inducida'],
        },
        {
          slug: 'movilidad.mas-asfalto-mas-autos.3',
          titulo_es: 'Trabajar desde casa, ¿y después?',
          bajada_es: 'Los viajes que desaparecen y los que aparecen sin avisar.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: ['movilidad.teletrabajo_rebote', 'movilidad.ciudad_de_distancias_cortas', 'movilidad.estacionamiento_gratis'],
        },
      ],
    },
    {
      slug: 'movilidad.vuelos-y-envios',
      anillo: 2,
      titulo_es: 'Vuelos y envíos',
      bajada_es: 'Lo que viaja lejos: aviones, paquetes y la cuenta que no se ve.',
      icono: 'Plane',
      age_groups: ['teen', 'adult'],
      sort_order: 7,
      conceptos: [
        {
          slug: 'movilidad.volar_pesa',
          titulo_es: 'Un vuelo concentra mucho',
          enunciado_es:
            'Un vuelo largo concentra en pocas horas mucha más emisión que casi cualquier decisión de transporte del día a día.',
          detalle_es:
            'No es para dejar de viajar nunca: es para saber en qué renglón de tu año está el número grande antes de discutir los chicos.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: -0.1,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['tronco.orden_de_magnitud'],
        },
        {
          slug: 'movilidad.estelas_y_forzamiento',
          titulo_es: 'No solo el CO₂ del avión',
          enunciado_es:
            'El efecto de un avión sobre el clima no es solo su CO₂: las estelas de condensación y otros efectos en altura suman calentamiento adicional, con bastante más incertidumbre.',
          detalle_es:
            'Que un número tenga incertidumbre no lo vuelve inventado: lo vuelve un rango en vez de una cifra exacta.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.6,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: [
            'movilidad.volar_pesa',
            { slug: 'tronco.incertidumbre', fuerza: 0.6 },
          ],
        },
        {
          slug: 'movilidad.compensar_no_es_no_emitir',
          titulo_es: 'Compensar no es no emitir',
          enunciado_es:
            'Comprar una compensación no borra el vuelo: primero está no hacer el viaje, después hacerlo de otra manera, y recién al final compensar lo que quedó.',
          detalle_es:
            'La calidad de las compensaciones varía muchísimo, y varias auditorías encontraron créditos que no representaban emisiones realmente evitadas.',
          fuente: 'carbon-brief',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['tronco.compensacion_no_es_evitar', 'tronco.jerarquia_decisiones'],
          misconceptions: [
            {
              slug: 'movilidad.mito_compensar_vuelo',
              creencia_es: 'Si pago la compensación del pasaje, el vuelo queda en cero.',
              correccion_es:
                'Es tentador porque el checkbox aparece justo cuando estás incómodo y cuesta poca plata: resuelve la culpa en un clic. Pero el CO₂ ya se emite igual, y la compensación es una promesa de que en otro lado se evita o se captura una cantidad parecida, con calidad muy despareja. Compensar va después de evitar y de reducir, nunca en lugar de ellos.',
              fuente: 'carbon-brief',
            },
          ],
        },
        {
          slug: 'movilidad.ultima_milla',
          titulo_es: 'La última cuadra del paquete',
          enunciado_es:
            'Cada compra online termina en una camioneta haciendo la última cuadra; juntar pedidos en un solo envío o retirarlos en un punto de entrega cambia esos kilómetros.',
          detalle_es:
            'El envío exprés es el que más pesa: obliga a salir con el vehículo medio vacío para llegar a horario.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['movilidad.espacio_de_la_calle'],
        },
      ],
      hojas: [
        {
          slug: 'movilidad.vuelos-y-envios.1',
          titulo_es: 'El renglón grande del año',
          bajada_es: 'Dónde entra un vuelo largo en la cuenta de alguien.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 1,
          conceptos: ['movilidad.volar_pesa', 'movilidad.estelas_y_forzamiento'],
        },
        {
          slug: 'movilidad.vuelos-y-envios.2',
          titulo_es: 'El clic que compensa',
          bajada_es: 'Qué comprás exactamente cuando tildás esa casilla.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['movilidad.compensar_no_es_no_emitir', 'movilidad.volar_pesa'],
        },
        {
          slug: 'movilidad.vuelos-y-envios.3',
          titulo_es: 'Tres paquetes, tres viajes',
          bajada_es: 'La logística de última milla, vista desde tu portero eléctrico.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: ['movilidad.ultima_milla', 'movilidad.compensar_no_es_no_emitir'],
        },
        {
          slug: 'movilidad.vuelos-y-envios.4',
          titulo_es: 'Rangos, no certezas',
          bajada_es: 'Estelas, incertidumbre y cómo se lee un número que no es exacto.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 4,
          conceptos: ['movilidad.estelas_y_forzamiento', 'movilidad.ultima_milla'],
        },
      ],
    },
  ],
};
