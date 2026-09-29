import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AGUA 3 — Del desagüe al río.
// Intermedio. Retoma la cloaca y el pluvial de agua-1 y los sigue hasta el
// final: qué trae el agua usada, cómo se trata, qué le hace a un río cuando no
// se trata, el caso Matanza-Riachuelo y qué se puede hacer desde casa. Usa las
// herramientas de medición del tronco 2 (concentraciones, porcentajes).

export default unidad({
  slug: 'agua-3',
  rama: 'agua',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Del desagüe al río',
  bajada: 'Qué lleva el agua que se va por la cloaca, cómo se limpia en una planta, qué pasa cuando llega sucia a un río y qué se puede hacer.',
  objetivos: [
    'Nombrar qué contaminantes trae el agua usada y de dónde salen',
    'Explicar las etapas del tratamiento de efluentes cloacales',
    'Describir cómo el exceso de materia orgánica y nutrientes deja a un río sin oxígeno',
    'Contar el caso de la cuenca Matanza-Riachuelo y el fallo de la Corte Suprema de 2008',
    'Elegir hábitos de casa que reducen lo que llega al agua',
  ],
  repasa: ['agua-1', 'tronco-1', 'tronco-2'],
  fuentes: ['acumar', 'aysa', 'unep', 'unep-plasticos', 'oms-agua-potable', 'ley-25675-ambiente'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué lleva el agua usada', 'Materia orgánica, nutrientes, microbios, grasas, químicos y microplásticos: el inventario de lo que se va por el desagüe.', [
      teoria('Un inventario invisible', [
        'El agua que sale de una casa parece solo "agua sucia", pero lleva cosas muy distintas. Materia orgánica: restos de comida, desechos del cuerpo, jabón. Nutrientes: nitrógeno y fósforo, que vienen de la orina, los alimentos y algunos detergentes. Microorganismos: bacterias y virus, algunos causantes de enfermedades.',
        'También lleva grasas y aceites, sólidos (arena, pelo, restos), químicos (productos de limpieza, restos de medicamentos, cosméticos) y microplásticos, sobre todo fibras que se sueltan de la ropa sintética al lavarla.',
      ], { lista: ['Materia orgánica', 'Nutrientes (nitrógeno y fósforo)', 'Microorganismos', 'Grasas y aceites', 'Sólidos', 'Químicos y fármacos', 'Microplásticos'] }),
      par('Uní cada contaminante con de dónde sale en una casa.', [
        ['Materia orgánica', 'Restos de comida y desechos del cuerpo'],
        ['Fósforo', 'Algunos detergentes y la orina'],
        ['Microfibras plásticas', 'Lavar ropa sintética'],
        ['Grasas', 'La pileta de la cocina'],
        ['Restos de fármacos', 'Medicamentos que el cuerpo elimina o que se tiran'],
      ], 'Cada contaminante tiene una puerta de entrada distinta en la casa. Conocerlas es la base para reducirlos en el origen.', { d: 1 }),
      teoria('Medir la suciedad: la DBO', [
        'La materia orgánica, cuando llega al agua, alimenta bacterias que la descomponen consumiendo el oxígeno disuelto. Para medir cuánta materia orgánica hay, se usa la demanda biológica de oxígeno (DBO): cuánto oxígeno necesitarían las bacterias para descomponerla, en miligramos por litro.',
        'Como referencia aproximada, el agua cloacal cruda suele tener cientos de miligramos por litro de DBO, mientras que un río limpio tiene apenas unos pocos. Cuanto más alta la DBO, más oxígeno le va a robar esa agua al río.',
      ], { destacado: { valor: 'DBO', texto: 'cuánto oxígeno consumirían las bacterias para descomponer la materia orgánica del agua.' } }),
      op('Un análisis da una DBO muy alta en un arroyo. ¿Qué indica?', [
        'Que tiene mucha materia orgánica que va a consumir oxígeno',
        'Que el agua tiene mucho oxígeno disponible para los peces',
        ['Que el agua está más fría de lo normal para la estación', 'La temperatura influye en el oxígeno, pero la DBO mide materia orgánica que se descompone.'],
        'Que el arroyo tiene muchos peces sanos y activos',
      ], 'DBO alta = mucha "comida" para bacterias = mucho oxígeno que se va a consumir. Es una señal de contaminación orgánica.', { d: 2 }),
      op('¿Qué agua tiene más probablemente la DBO más alta?', [
        'El agua cloacal cruda que sale de un barrio',
        'El agua de un arroyo de montaña sin poblaciones cerca',
        ['El agua de lluvia recién caída en un balde limpio', 'La lluvia recién caída casi no tiene materia orgánica.'],
        'El agua potable que sale de la canilla de tu casa',
      ], 'El agua cloacal cruda es la que más materia orgánica lleva: por eso, sin tratar, es la que más oxígeno le roba a un río.', { d: 1 }),
      clas('¿Estos contaminantes son biológicos, químicos o físicos?', {
        'Biológicos': ['Bacterias', 'Virus', 'Huevos de parásitos'],
        'Químicos': ['Fósforo', 'Restos de medicamentos', 'Detergentes'],
        'Físicos': ['Arena', 'Microfibras plásticas', 'Pelos'],
      }, 'Cada tipo se trata de forma distinta en una planta: los físicos se separan, los biológicos se desactivan y muchos químicos son los más difíciles de sacar.', { d: 2 }),
      teoria('Lo más difícil de sacar', [
        'Las plantas de tratamiento son muy buenas sacando sólidos y materia orgánica, pero algunos contaminantes pasan con más facilidad: restos de medicamentos, ciertos químicos de productos de limpieza y cosmética, y los microplásticos más finos.',
        'Por eso reducirlos en el origen —no tirar medicamentos por el inodoro, elegir productos más simples, lavar menos la ropa sintética— es más efectivo que confiar en que la planta los saque después.',
      ]),
      vf('Una planta de tratamiento saca del agua absolutamente todos los contaminantes.', false, 'Las plantas sacan muy bien sólidos y materia orgánica, y con etapas avanzadas también nutrientes y microbios. Pero algunos químicos, fármacos y microplásticos finos pasan en parte. Reducirlos en el origen es la mejor defensa.', {
        razones: ['+Porque algunos químicos, fármacos y microplásticos pasan en parte', '-Porque las plantas no sacan ningún contaminante', '-Porque el agua tratada vuelve directo a la canilla'],
        d: 2,
      }),
      teoria('Las fibras de la ropa', [
        'Cada vez que se lava ropa sintética (poliéster, nailon, acrílico) se sueltan miles de fibras microscópicas. Distintos estudios estimaron que un solo lavado de una carga puede liberar cientos de miles de ellas. Muchas atraviesan las plantas de tratamiento y terminan en ríos y mares.',
        'Lavar con carga completa y a menor temperatura, usar ciclos más cortos, lavar solo cuando hace falta y elegir fibras naturales cuando se puede reduce la cantidad que se suelta.',
      ]),
      mult('¿Qué hábitos reducen las microfibras que llegan al agua? Marcá todos.', [
        '+Lavar la ropa sintética solo cuando hace falta',
        '+Usar carga completa y agua fría',
        '+Elegir fibras naturales cuando se puede',
        '-Lavar prendas sintéticas en ciclos largos y calientes para que se limpien mejor',
        '-Usar más suavizante para que no se suelten fibras',
      ], 'La fricción y el calor sueltan más fibras. Menos lavados, cargas completas y agua fría las reducen.', { d: 2 }),
      det('Leé esta explicación de una clase y marcá los errores.', [
        ['El agua que sale de las casas lleva materia orgánica y nutrientes.', false],
        ['La DBO mide la temperatura del agua.', true, 'Mide cuánto oxígeno consumirían las bacterias para descomponer la materia orgánica.'],
        ['La ropa sintética suelta microfibras al lavarse.', false],
        ['Como las plantas lo sacan todo, no importa lo que tiremos al desagüe.', true, 'Hay contaminantes que pasan en parte: lo mejor es no tirarlos.'],
      ], 'DBO es oxígeno, no temperatura, y ninguna planta es perfecta.', { d: 3 }),
      comp('Completá.', 'Cuanto más [materia orgánica] tiene el agua, más alta es su [DBO] y más [oxígeno] le quita al río.', ['arena', 'temperatura', 'sal'], 'Es la cadena básica de la contaminación orgánica, y la vas a usar en toda la unidad.', { d: 2 }),
      rank('Ordená estas aguas por su DBO típica, de más alta a más baja.', [
        ['Efluente sin tratar de un frigorífico', 'miles de mg/L'],
        ['Agua cloacal cruda de un barrio', 'cientos de mg/L'],
        ['Agua cloacal con buen tratamiento secundario', 'decenas o menos'],
        ['Arroyo limpio de montaña', 'unos pocos mg/L'],
      ], 'Valores de referencia aproximados. Los efluentes de industrias alimenticias pueden ser mucho más cargados que las cloacas de un barrio.', { d: 3 }),
      numv(3, (i) => {
        const hab = [1000, 5000, 20000][i];
        return {
          enunciado: `Para dimensionar plantas de tratamiento se usa el "habitante equivalente": unos 60 gramos de DBO por persona por día. ¿Cuántos kg de DBO por día genera un barrio de ${hab.toLocaleString('es-AR')} habitantes?`,
          valor: hab * 60 / 1000,
          unidad: 'kg de DBO por día',
          explicacion: `${hab.toLocaleString('es-AR')} × 60 g = ${(hab * 60).toLocaleString('es-AR')} g = ${(hab * 60 / 1000).toLocaleString('es-AR')} kg por día. Esa es la carga que la planta tiene que sacar para que no le quite oxígeno al río.`,
          ctx: `${hab} habitantes; 60 g de DBO por persona por día.`,
        };
      }, { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Cómo se limpia el agua cloacal', 'Rejas, piletas, bacterias y desinfección: las etapas de una planta de tratamiento.', [
      teoria('Primero, lo grande', [
        'Cuando el agua cloacal llega a una planta, primero pasa por el pretratamiento: rejas que retienen lo grande (trapos, toallitas, plásticos), desarenadores donde se asienta la arena, y separadores donde flotan y se quitan grasas.',
        'Después viene el tratamiento primario: grandes piletas donde el agua se queda quieta un tiempo y los sólidos más pesados se van al fondo. Se forma un barro que se retira. Solo con esto se saca una parte de la materia orgánica, pero no la mayoría.',
      ]),
      ord('Ordená las primeras etapas de una planta de tratamiento.', [
        'Rejas que retienen objetos grandes',
        'Desarenador donde se asienta la arena',
        'Separación de grasas',
        'Piletas de sedimentación primaria',
      ], 'Primero se saca lo que rompería o taparía las etapas siguientes: objetos grandes, arena y grasas. Después se deja decantar.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('El trabajo de las bacterias', [
        'El tratamiento secundario usa bacterias, las mismas que en un río consumirían el oxígeno. La diferencia es que en la planta se les inyecta aire con sopladores, así pueden comerse la materia orgánica sin dejar al agua sin oxígeno. Este sistema se llama, entre otros nombres, barros activados.',
        'Las bacterias forman flóculos que después se separan en otra pileta. Con el tratamiento secundario se elimina la mayor parte de la materia orgánica: la DBO baja muchísimo.',
      ], { destacado: { valor: 'Aire + bacterias', texto: 'el corazón del tratamiento secundario: descomponer la materia orgánica dentro de la planta y no en el río.' } }),
      op('¿Por qué en el tratamiento secundario se inyecta aire al agua?', [
        'Para que las bacterias coman la materia orgánica',
        'Para enfriar el agua antes de volcarla al río',
        ['Para que el agua huela a limpio al salir de la planta', 'El olor mejora, pero el objetivo es que las bacterias trabajen con oxígeno.'],
        'Para separar la arena del agua en el desarenador',
      ], 'Es controlar dentro de la planta el mismo proceso que en un río sería un problema: la descomposición que consume oxígeno.', { d: 2 }),
      teoria('Terciario y desinfección', [
        'El tratamiento terciario, cuando existe, saca lo que queda: nutrientes como el nitrógeno y el fósforo (los que alimentan las algas en los ríos), partículas finas y, en algunos casos, contaminantes específicos. Al final suele haber una desinfección para reducir los microorganismos.',
        'No todas las plantas tienen todas las etapas. Una planta solo con pretratamiento y primario deja salir mucha más materia orgánica y nutrientes que una con secundario y terciario.',
      ]),
      par('Uní cada etapa con lo principal que saca.', [
        ['Pretratamiento', 'Objetos grandes, arena y grasas'],
        ['Primario', 'Sólidos que se decantan'],
        ['Secundario', 'La mayor parte de la materia orgánica'],
        ['Terciario', 'Nutrientes y partículas finas'],
      ], 'Cada etapa suma una limpieza distinta. Cuantas más etapas, más limpia vuelve el agua al río.', { d: 2 }),
      rank('Ordená estos niveles de tratamiento según qué tan limpia sale el agua, de más a menos.', [
        ['Pretratamiento + primario + secundario + terciario', 'saca también nutrientes'],
        ['Pretratamiento + primario + secundario', 'saca la mayor parte de la materia orgánica'],
        ['Pretratamiento + primario', 'saca sólidos, poca materia orgánica'],
        ['Solo pretratamiento', 'saca lo grande, casi nada más'],
      ], 'Cada etapa que falta deja pasar algo más al río. Por eso ampliar el tratamiento es una de las grandes obras de saneamiento.', { d: 3 }),
      teoria('Qué pasa con el barro', [
        'Todo lo que se saca del agua queda como barro o lodo, y hay que hacer algo con él. Se puede estabilizar (por ejemplo, en digestores donde otras bacterias sin oxígeno lo descomponen y producen biogás, que se usa como energía), deshidratar y disponer en rellenos o, si cumple los controles, usar como enmienda de suelos.',
        'Es otra vez la idea del tronco: nada desaparece. Limpiar el agua es trasladar la suciedad a un barro que también hay que gestionar.',
      ]),
      cad('Armá el recorrido del barro en una planta con digestor.', [
        'Se separa el barro en las piletas',
        'Va a un digestor sin oxígeno',
        'Las bacterias lo descomponen y producen biogás',
        'El biogás se usa como energía en la planta',
      ], ['El barro se evapora y desaparece'], 'El barro no desaparece: se transforma. Y de paso, parte de su energía se recupera como biogás.', { d: 3 }),
      numv(3, (i) => {
        const e = [250, 300, 200][i];
        const s = [25, 20, 30][i];
        return {
          enunciado: `Una planta recibe agua con DBO de ${e} mg/L y la devuelve con ${s} mg/L. ¿Qué porcentaje de la DBO sacó?`,
          valor: ((e - s) / e) * 100,
          unidad: '%',
          dec: 1,
          explicacion: `Sacó ${e} − ${s} = ${e - s} mg/L de ${e}: ${e - s} ÷ ${e} × 100 = ${(((e - s) / e) * 100).toLocaleString('es-AR')} %. Es un valor típico de un buen tratamiento secundario.`,
        };
      }, { d: 3 }),
      vf('Si una planta solo tiene rejas y desarenador, el agua que devuelve al río está prácticamente limpia.', false, 'Rejas y desarenador sacan lo grande y la arena, pero casi nada de la materia orgánica, los nutrientes y los microbios. El agua sigue siendo muy contaminante.', {
        razones: ['+Porque el pretratamiento casi no saca materia orgánica ni nutrientes', '-Porque la arena es el principal contaminante del agua cloacal', '-Porque las rejas filtran las bacterias'],
        d: 3,
      }),
      det('Leé este folleto de una planta y marcá los errores.', [
        ['En el pretratamiento retenemos objetos y arena.', false],
        ['En el tratamiento secundario, bacterias con aire descomponen la materia orgánica.', false],
        ['Por eso no necesitamos ocuparnos del barro: desaparece en el proceso.', true, 'El barro queda y hay que estabilizarlo y disponerlo.'],
        ['El tratamiento primario ya saca todos los nutrientes.', true, 'Los nutrientes se sacan, cuando se sacan, en el terciario.'],
      ], 'Etapas bien ubicadas y la idea de que nada desaparece: el barro es la otra cara del agua limpia.', { d: 3 }),
      comp('Completá.', 'En el tratamiento [secundario] se inyecta [aire] para que las bacterias descompongan la materia orgánica; el terciario saca [nutrientes].', ['primario', 'cloro', 'arena'], 'Secundario = bacterias con aire; terciario = nutrientes. Son las dos etapas que más cambian lo que llega al río.', { d: 2 }),
      clas('¿En qué nivel de tratamiento ocurre cada paso?', {
        'Primario': ['Dejar que los sólidos se asienten en piletas', 'Separar las grasas que flotan'],
        'Secundario': ['Bacterias que descomponen la materia orgánica con aire', 'Piletas de barros activados'],
        'Terciario': ['Quitar nitrógeno y fósforo', 'Filtrados y desinfecciones finales más exigentes'],
      }, 'Cada nivel saca algo que el anterior deja pasar: por eso importa hasta dónde llega una planta.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Cuando el agua sucia llega al río', 'Oxígeno que se acaba, algas que explotan y peces que mueren: qué le pasa a un río que recibe más de lo que puede limpiar.', [
      teoria('Un río se limpia solo… hasta cierto punto', [
        'Los ríos tienen una capacidad natural de autodepuración: sus bacterias descomponen materia orgánica, el agua toma oxígeno del aire en las corrientes y la luz del sol ayuda a eliminar microbios. Un poco de materia orgánica, un río sano la procesa.',
        'El problema es la cantidad. Cuando lo que llega supera lo que el río puede procesar, el oxígeno baja más rápido de lo que se repone. Es la misma idea de ritmo de uso contra reposición que viste en el tronco.',
      ]),
      cad('Armá lo que pasa cuando un río recibe demasiada materia orgánica.', [
        'Llega agua cloacal sin tratar',
        'Las bacterias se alimentan de la materia orgánica',
        'Consumen el oxígeno disuelto del agua',
        'El oxígeno baja más rápido de lo que se repone',
        'Los peces y otros animales se asfixian',
      ], ['El agua se calienta hasta hervir'], 'Es la cadena de la DBO: más materia orgánica, más consumo de oxígeno, menos vida.', { d: 2 }),
      teoria('El oxígeno disuelto', [
        'Los peces respiran el oxígeno disuelto en el agua, que se mide en miligramos por litro. Un agua bien oxigenada puede tener alrededor de 8 a 10 mg/L; por debajo de unos 4 a 5, muchas especies sufren, y por debajo de 2 casi ninguna sobrevive. Esos valores son de referencia y cambian según la especie y la temperatura.',
        'El agua caliente guarda menos oxígeno que la fría. Por eso las mortandades de peces son más comunes en verano, cuando el agua está más caliente y las bacterias trabajan más rápido.',
      ], {
        datos: barras('Oxígeno disuelto aguas abajo de una descarga (ejemplo)', 'mg/L', [
          ['Antes de la descarga', 8.5],
          ['En la descarga', 3.1],
          ['1 km aguas abajo', 1.8],
          ['5 km aguas abajo', 4.2],
          ['15 km aguas abajo', 7.4],
        ], 'Datos ilustrativos de un caso típico: el oxígeno cae, toca fondo y se recupera lejos.'),
      }),
      op('En el gráfico, ¿dónde es más probable que haya una mortandad de peces?', [
        'Un kilómetro aguas abajo de la descarga',
        'Antes de la descarga, río arriba',
        ['Quince kilómetros aguas abajo', 'Ahí el oxígeno ya se recuperó a valores cercanos a los de antes de la descarga.'],
        'Justo en el punto de medición inicial',
      ], 'El mínimo de oxígeno no está en la descarga misma sino un poco más abajo, donde las bacterias ya están trabajando a pleno.', { d: 3 }),
      num('Según el gráfico, ¿cuántos mg/L de oxígeno se perdieron entre "antes de la descarga" y el punto más bajo?', 6.7, 'mg/L', 'El máximo es 8,5 y el mínimo 1,8 (a 1 km): 8,5 − 1,8 = 6,7 mg/L. Casi el 80 % del oxígeno desapareció.', { d: 3, dec: 1 }),
      teoria('Cuando sobran nutrientes', [
        'El nitrógeno y el fósforo son fertilizantes: en un lago o río lento, alimentan una explosión de algas y cianobacterias. Es la eutrofización. El agua se pone verde, turbia, a veces con una capa como pintura en la superficie.',
        'Cuando esas algas mueren, se descomponen y consumen oxígeno: el mismo problema de antes, pero causado por los nutrientes. Además, algunas cianobacterias producen toxinas: en el Río de la Plata y en muchos embalses del país hay floraciones en verano, y en esos casos no conviene bañarse ni que los perros tomen esa agua.',
      ], { destacado: { valor: 'Agua verde', texto: 'una capa verde o como pintura puede ser una floración de cianobacterias: mejor no bañarse.' } }),
      cad('Armá la cadena de la eutrofización de una laguna.', [
        'Llegan fertilizantes y efluentes con fósforo',
        'Las algas y cianobacterias crecen sin control',
        'El agua se vuelve verde y turbia',
        'Las algas mueren y se descomponen',
        'Baja el oxígeno y mueren peces',
      ], ['El fósforo le agrega oxígeno al agua'], 'Los nutrientes no roban oxígeno directamente: lo hacen a través de las algas que alimentan. Es una cadena de dos pasos.', { d: 3 }),
      clas('¿Estas situaciones son señales de un río o laguna con problemas, o de uno sano?', {
        'Señal de problemas': ['Espuma y olor a podrido', 'Una capa verde en la superficie', 'Peces boqueando en la superficie'],
        'Señal de agua sana': ['Muchas larvas de insectos sensibles en las piedras', 'Agua clara con plantas sumergidas', 'Aves que pescan todo el año'],
      }, 'Los seres vivos son buenos indicadores: algunas larvas de insectos solo viven en agua bien oxigenada. Lo verás en la rama de Ciencia.', { d: 2 }),
      vf('Si un río tiene mucho caudal, puede recibir cualquier cantidad de efluentes sin problemas.', false, 'Un río grande diluye más y se recupera más rápido, pero su capacidad también tiene límite. Además, diluir no es eliminar: los contaminantes persistentes se acumulan en el fondo o en los seres vivos.', {
        razones: ['+Porque su capacidad de autodepuración también tiene un límite', '-Porque el caudal convierte los contaminantes en agua limpia', '-Porque los ríos grandes no tienen seres vivos'],
        d: 3,
      }),
      op('Hace mucho calor y en la costa de un embalse el agua está verde y con olor. Tu perro quiere tomar. ¿Qué hacés?', [
        'No lo dejo: puede ser una floración tóxica',
        'Lo dejo, el agua verde es solo pasto flotando',
        ['Lo dejo tomar un poco, que el calor le hace mal', 'Mejor darle agua que hayas llevado: algunas cianobacterias producen toxinas peligrosas para los animales.'],
        'Lo baño en esa agua para refrescarlo un rato',
      ], 'Las floraciones de cianobacterias pueden tener toxinas. Ante agua verde o con capa, lo prudente es no bañarse ni dejar tomar a los animales.', { d: 2 }),
      det('Un vecino explica en una radio lo que pasa en la laguna. Marcá los errores.', [
        ['En verano la laguna se pone verde por exceso de nutrientes.', false],
        ['El fósforo le da oxígeno al agua, así que los peces respiran mejor.', true, 'El fósforo alimenta algas; al descomponerse, consumen oxígeno.'],
        ['Con calor el agua guarda menos oxígeno.', false],
        ['Por eso no hay que preocuparse: la laguna es grande y se limpia sola siempre.', true, 'La autodepuración tiene un límite, y con nutrientes constantes se supera.'],
      ], 'Nutrientes, algas, descomposición, menos oxígeno: y un límite que no se puede estirar para siempre.', { d: 4 }),
      par('Uní cada problema del agua con su causa principal.', [
        ['Falta de oxígeno aguas abajo de una descarga', 'Materia orgánica con DBO alta'],
        ['Agua verde con una capa en la superficie', 'Exceso de nitrógeno y fósforo'],
        ['Mortandad de peces en verano', 'Menos oxígeno por el calor y la descomposición'],
        ['Espuma persistente en un arroyo', 'Detergentes y efluentes industriales'],
      ], 'Cada síntoma tiene una causa más probable. Identificarla orienta qué medir y qué reclamar.', { d: 3 }),
      mult('¿Qué situaciones bajan el oxígeno disuelto de un río? Marcá todas.', [
        '+Mucha materia orgánica de cloacas sin tratar',
        '+Agua más caliente en verano',
        '+Poco caudal durante una sequía',
        '+Exceso de nutrientes que dispara algas',
        '-Una cascada que mezcla el agua con el aire',
      ], 'El calor, la poca agua y la carga orgánica se suman: por eso las mortandades de peces suelen ocurrir en verano.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('El Riachuelo: una cuenca en recuperación', 'Historia de uno de los ríos más contaminados del país, el fallo que obligó a limpiarlo y lo que todavía falta.', [
      teoria('Una cuenca, muchas historias', [
        'La cuenca Matanza-Riachuelo recorre unos 60 kilómetros desde el oeste del conurbano hasta el Río de la Plata, en La Boca. En ella viven millones de personas, repartidas entre la Ciudad de Buenos Aires y más de una docena de municipios de la provincia.',
        'Durante más de un siglo recibió efluentes de industrias (curtiembres, frigoríficos, químicas), aguas cloacales sin tratar y basura. Se convirtió en uno de los ríos más contaminados del país, con barrios enteros viviendo sobre sus orillas en condiciones de riesgo.',
      ]),
      mult('¿Qué fuentes contaminaron históricamente el Riachuelo? Marcá todas.', [
        '+Efluentes de industrias como curtiembres y frigoríficos',
        '+Aguas cloacales sin tratar',
        '+Basurales a cielo abierto en las orillas',
        '-El agua de lluvia de las montañas',
        '-Los barcos de pasajeros del Delta',
      ], 'Industria, cloacas y basura: tres fuentes que se sumaron durante décadas en una cuenca muy poblada.', { d: 1 }),
      teoria('El fallo Mendoza', [
        'En 2004, un grupo de vecinos y profesionales encabezado por Beatriz Mendoza demandó al Estado y a empresas por los daños causados por la contaminación de la cuenca. En 2008, la Corte Suprema de Justicia dictó un fallo histórico: ordenó recomponer el ambiente de la cuenca, mejorar la calidad de vida de sus habitantes y prevenir daños futuros.',
        'Para cumplirlo, el fallo se apoyó en la Autoridad de Cuenca Matanza Riachuelo (ACUMAR), un organismo creado por ley en 2006 que coordina a la Nación, la Provincia de Buenos Aires y la Ciudad. Es un ejemplo de gestión por cuenca: el agua no respeta los límites de los municipios.',
      ], { destacado: { valor: '2008', texto: 'la Corte Suprema ordenó recomponer la cuenca Matanza-Riachuelo en el fallo Mendoza.' } }),
      ord('Ordená los hechos del caso Riachuelo.', [
        'Durante décadas se vuelcan efluentes y basura a la cuenca',
        'Vecinos demandan al Estado y a empresas',
        'Se crea por ley la ACUMAR',
        'La Corte Suprema dicta el fallo Mendoza',
        'Se ejecutan obras y controles bajo supervisión judicial',
      ], 'De la contaminación acumulada a la demanda, y de ahí a una obligación judicial con un organismo que la coordina.', { d: 2, extremos: ['Primero', 'Último'] }),
      op('¿Por qué la cuenca se gestiona con un organismo que junta a Nación, Provincia y Ciudad?', [
        'Porque el río cruza varias jurisdicciones',
        'Porque la Ciudad no tiene ríos propios para cuidar',
        ['Porque así se pueden cobrar más impuestos por el agua', 'El motivo es de gestión: un río compartido necesita decisiones compartidas.'],
        'Porque la Corte Suprema administra los ríos del país',
      ], 'Lo que un municipio tira río arriba lo recibe otro río abajo. Por eso la unidad de gestión del agua es la cuenca, no el límite político.', { d: 2 }),
      teoria('Qué cambió y qué falta', [
        'Desde el fallo se limpiaron márgenes y se sacaron cascos de barcos hundidos, se relocalizaron familias que vivían sobre el borde del río, se controlaron industrias (muchas tuvieron que tratar sus efluentes o cerraron), se cerraron basurales y se hicieron grandes obras de cloacas.',
        'Aun así, la recuperación es lenta: la calidad del agua mejoró en algunos tramos y sigue siendo mala en otros, y el sedimento del fondo guarda contaminación de décadas. Es un ejemplo de algo que viste en el tronco: los retrasos. Lo que tardó un siglo en ensuciarse no se limpia en pocos años.',
      ]),
      clas('¿Qué acciones atacan la causa de la contaminación y cuáles alivian sus efectos?', {
        'Atacan la causa': ['Obligar a las industrias a tratar sus efluentes', 'Conectar barrios a la red cloacal', 'Cerrar basurales en las orillas'],
        'Alivian los efectos': ['Sacar basura flotante del río', 'Relocalizar familias en zonas de riesgo', 'Atender la salud de quienes viven cerca'],
      }, 'Las dos columnas hacen falta: una evita que siga entrando contaminación y la otra protege a la gente mientras tanto.', { d: 3 }),
      vf('Si desde mañana nadie tirara nada más al Riachuelo, al día siguiente el río estaría limpio.', false, 'El fondo del río acumula sedimentos contaminados de décadas, y el ecosistema tarda en recuperarse. Cortar las descargas es imprescindible, pero la recuperación lleva años.', {
        razones: ['+Porque los sedimentos y el ecosistema tardan años en recuperarse', '-Porque el río nunca se puede recuperar', '-Porque la contaminación no tiene nada que ver con las descargas'],
        d: 3,
      }),
      teoria('Justicia ambiental', [
        'La contaminación de la cuenca no afectó a todos por igual: la sufrieron sobre todo los barrios más pobres, que viven más cerca del río y tienen menos acceso a agua segura y cloacas. Cuando los daños ambientales recaen más sobre quienes menos tienen, se habla de injusticia ambiental.',
        'Por eso el fallo no habló solo de agua limpia sino de calidad de vida de los habitantes. Lo vas a ver en profundidad en la rama de Comunidad.',
      ]),
      op('¿Por qué el caso Riachuelo es también un caso de justicia ambiental?', [
        'Porque los más afectados fueron los barrios pobres cercanos al río',
        'Porque la Justicia intervino en un tema ambiental',
        ['Porque todos los habitantes del país sufrieron igual la contaminación', 'La contaminación afectó mucho más a quienes viven cerca del río y con menos servicios.'],
        'Porque el río tiene derechos propios reconocidos por ley',
      ], 'La justicia ambiental mira quién sufre los daños y quién recibe los beneficios. En la cuenca, el daño se concentró en quienes menos tenían.', { d: 3 }),
      det('Leé este resumen escolar sobre el Riachuelo y marcá los errores.', [
        ['La cuenca atraviesa la Ciudad y varios municipios del conurbano.', false],
        ['En 2008 la Corte Suprema ordenó recomponerla en el fallo Mendoza.', false],
        ['Como el fallo ya salió, el problema está resuelto y el agua es apta para bañarse.', true, 'El fallo obligó a actuar, pero la recuperación es lenta y el agua sigue sin ser apta en muchos tramos.'],
        ['ACUMAR es una empresa privada que vende el agua del río.', true, 'ACUMAR es un organismo público interjurisdiccional creado por ley.'],
      ], 'Un fallo es el comienzo de una obligación, no el final del problema. Y ACUMAR es un organismo público.', { d: 3 }),
      comp('Completá.', 'El agua se gestiona por [cuenca] porque lo que se tira río [arriba] lo recibe quien vive río [abajo].', ['provincia', 'adentro', 'afuera'], 'Es la idea que justifica organismos como ACUMAR: el agua no respeta los límites de los mapas políticos.', { d: 2 }),
      vf('El fallo Mendoza solo ordenó limpiar el agua del río, sin mencionar a las personas que viven en la cuenca.', false, 'El fallo ordenó recomponer el ambiente, mejorar la calidad de vida de los habitantes de la cuenca y prevenir daños futuros. Las personas estaban en el centro de la decisión.', {
        razones: ['+Porque también ordenó mejorar la calidad de vida de sus habitantes', '-Porque el fallo no mencionó el río', '-Porque la Corte Suprema no puede ordenar nada sobre el ambiente'],
        d: 2,
      }),
      par('Uní cada actor con su papel en el saneamiento de la cuenca.', [
        ['Corte Suprema', 'Dictó el fallo y controla que se cumpla'],
        ['ACUMAR', 'Coordina el plan entre Nación, Provincia y Ciudad'],
        ['Industrias de la cuenca', 'Deben tratar sus efluentes antes de volcarlos'],
        ['Vecinos y organizaciones', 'Participan y controlan los avances'],
      ], 'El saneamiento de una cuenca necesita a todos los actores, cada uno con su parte.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Lo que se puede hacer desde casa', 'Qué hábitos reducen lo que llega al río, y cómo participar cuando el problema es más grande que una casa.', [
      teoria('Reducir en el origen', [
        'Todo lo que no entra al agua no hay que sacarlo después. En casa, las acciones más efectivas son las que evitan que ciertas cosas lleguen al desagüe: el aceite en botellas, los medicamentos a la farmacia, las toallitas y los algodones al tacho, las pinturas y solventes a puntos de recolección.',
        'También se pueden elegir productos de limpieza con menos fosfatos y usar la cantidad justa: más detergente no limpia más, pero sí agrega más químicos al agua.',
      ]),
      clas('¿Adónde va cada cosa?', {
        'Al tacho de residuos': ['Toallitas húmedas', 'Algodones y cotonetes', 'Hilo dental'],
        'A un punto de recolección': ['Aceite usado en botella', 'Medicamentos vencidos', 'Restos de pintura'],
        'Puede ir por el desagüe': ['Agua con jabón de lavar platos', 'Agua del lavarropas'],
      }, 'Tres destinos distintos. El desagüe es solo para el agua usada, no para residuos.', { d: 2 }),
      op('Te sobraron dos litros de pintura al agua. ¿Qué conviene hacer?', [
        'Guardarla, donarla o llevarla a un punto limpio',
        'Tirarla por la pileta del lavadero con mucha agua',
        ['Tirarla en la rejilla de la calle cuando llueve', 'La rejilla lleva directo al arroyo, sin ningún tratamiento.'],
        'Enterrarla en el jardín en un pozo profundo',
      ], 'La pintura sirve a otro, se guarda o se lleva a un punto de recolección. Nunca por el desagüe ni la tierra.', { d: 2 }),
      teoria('La casa conectada', [
        'Si en tu barrio hay red cloacal pero tu casa todavía usa pozo ciego, conectarse es de las acciones con más impacto: saca las aguas negras del suelo y de la napa. En barrios sin red, el mantenimiento correcto de las cámaras sépticas y la distancia entre pozos son claves.',
        'Otra conexión que importa: que las canaletas del techo vayan al pluvial y no a la cloaca. Si la lluvia entra a la cloaca, en las tormentas la red se satura y puede desbordar.',
      ]),
      vf('Conectar las canaletas del techo a la cloaca ayuda a que la red funcione mejor.', false, 'La cloaca no está pensada para recibir la lluvia: en una tormenta se satura y puede desbordar aguas negras. Las canaletas van al pluvial.', {
        razones: ['+Porque la lluvia satura la cloaca y la hace desbordar', '-Porque la lluvia limpia los caños de la cloaca', '-Porque el pluvial y la cloaca son el mismo caño'],
        d: 2,
      }),
      teoria('Cuando el problema es más grande que tu casa', [
        'Si ves un caño que vuelca agua de color o con olor a un arroyo, basura acumulada en una orilla o una mortandad de peces, se puede reportar a la autoridad ambiental local o de la cuenca. En la cuenca Matanza-Riachuelo, ACUMAR recibe denuncias; en otras zonas, el municipio o el organismo provincial de ambiente.',
        'Un reporte útil tiene lugar exacto, fecha y hora, qué se ve o se huele, y si es posible una foto. Así la autoridad puede ir a medir y encontrar la fuente.',
      ], { lista: ['Dónde: lugar exacto o coordenadas', 'Cuándo: fecha y hora', 'Qué: color, olor, espuma, peces muertos', 'Prueba: una foto o un video'] }),
      mult('¿Qué datos hacen útil una denuncia de un vuelco a un arroyo? Marcá todos.', [
        '+El lugar exacto del caño o la mancha',
        '+La fecha y la hora en que lo viste',
        '+Una foto o un video',
        '+Cómo se ve y cómo huele el agua',
        '-Tu opinión sobre el gobierno de turno',
      ], 'Lugar, momento, descripción y prueba: con eso se puede ir a tomar muestras y rastrear la fuente.', { d: 2 }),
      ord('Ordená los pasos si encontrás una mancha extraña en el arroyo del barrio.', [
        'No tocar el agua ni dejar que la toquen animales',
        'Sacar fotos y anotar lugar, fecha y hora',
        'Hacer la denuncia a la autoridad ambiental',
        'Contarle a los vecinos y hacer seguimiento del reclamo',
      ], 'Primero la seguridad, después la evidencia, la denuncia y el seguimiento. Un reclamo que nadie sigue suele quedar en la nada.', { d: 2, extremos: ['Primero', 'Último'] }),
      rank('Ordená estas acciones por cuánta contaminación evitan que llegue al agua, de más a menos (para una casa con pozo ciego en un barrio con red cloacal nueva).', [
        ['Conectar la casa a la red cloacal', 'saca todas las aguas negras del suelo'],
        ['Llevar el aceite usado a un punto de recolección', 'evita un contaminante muy potente'],
        ['Usar la cantidad justa de detergente', 'menos químicos por lavado'],
        ['Cerrar la canilla al cepillarse', 'ahorra agua, pero casi no cambia la contaminación'],
      ], 'Ahorrar agua y reducir la contaminación son objetivos distintos: la última acción es muy buena para el primero, pero poco para el segundo.', { d: 4 }),
      comp('Completá.', 'Lo mejor es reducir la contaminación en el [origen]: lo que no entra al agua no hay que [sacarlo] después en una [planta].', ['destino', 'diluirlo', 'pileta'], 'Es la regla de oro de todo el tema: prevenir es más barato y más efectivo que limpiar.', { d: 2 }),
      det('Leé este cartel de un club y marcá los consejos equivocados.', [
        ['Tirá los algodones y las toallitas al tacho, no al inodoro.', false],
        ['Para limpiar mejor, usá el doble de detergente.', true, 'Más detergente no limpia más: agrega químicos al agua.'],
        ['Juntá el aceite de la parrilla en una botella.', false],
        ['Conectá las canaletas del techo a la cloaca para que no se tape.', true, 'Las canaletas van al pluvial; en la cloaca la saturan en las tormentas.'],
      ], 'Cantidad justa de productos y cada agua por su red: dos reglas simples que cualquiera puede aplicar.', { d: 3 }),
      cad('Armá la cadena de por qué conectar una casa a la cloaca protege el agua del barrio.', [
        'La casa deja de usar el pozo ciego',
        'Las aguas negras van por la red a una planta',
        'Dejan de infiltrarse en el suelo',
        'La napa del barrio se contamina menos',
      ], ['El agua de la canilla sale más caliente'], 'La conexión saca la contaminación del suelo y la lleva a donde se puede tratar. Es de las obras con más impacto en la salud de un barrio.', { d: 3 }),
      op('¿Por qué conviene barrer la vereda en seco en lugar de baldearla hacia la calle?', [
        'Lo que llega a la calle termina en el arroyo por el pluvial',
        'Porque el agua de baldear se va directo a la cloaca',
        ['Porque así la vereda queda más brillante', 'No es estética: es evitar que la suciedad llegue al arroyo sin tratar.'],
        'Porque el pluvial lleva todo a una planta de tratamiento',
      ], 'Barrer en seco ahorra agua y evita mandar tierra, colillas y aceites al arroyo.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: del desagüe al río', 'Contaminantes, tratamiento, oxígeno y cuencas, todo junto.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el arroyo El Talar', 'Datos de un arroyo, una fábrica y un barrio. Leé los números y decidí qué hacer.', [
      teoria('El caso', [
        'El arroyo El Talar cruza un barrio del conurbano. Río arriba hay campos; en el medio, una fábrica de alimentos; y más abajo, un barrio sin cloacas donde las casas usan pozos ciegos. Los vecinos notaron olor, espuma y peces muertos en verano.',
        'Un grupo de la escuela técnica tomó muestras en cuatro puntos y midió oxígeno disuelto y DBO. Con sus datos vas a encontrar qué pasa y qué conviene hacer.',
      ], {
        datos: tabla('Mediciones del arroyo El Talar (enero)', ['Punto', 'Oxígeno disuelto (mg/L)', 'DBO (mg/L)'], [
          ['A · Antes de los campos', '8,2', '3'],
          ['B · Después de los campos', '7,1', '6'],
          ['C · Después de la fábrica', '2,4', '48'],
          ['D · Después del barrio', '1,6', '60'],
        ], 'Datos del caso, inventados para el ejercicio.'),
      }),
      op('¿Entre qué puntos se produce el mayor salto de DBO?', [
        'Entre B y C, después de la fábrica',
        'Entre A y B, después de los campos',
        ['Entre C y D, después del barrio', 'El barrio suma 12 mg/L; la fábrica, 42. El salto grande está antes.'],
        'No hay diferencias importantes entre puntos',
      ], 'La DBO pasa de 6 a 48: un aumento de 42 mg/L. La fábrica es la principal fuente de materia orgánica del tramo.', { ctx: 'Arroyo El Talar: A 8,2 mg/L de oxígeno y DBO 3 · B 7,1 y 6 · C 2,4 y 48 · D 1,6 y 60.', d: 3 }),
      num('¿En cuántos mg/L baja el oxígeno disuelto entre el punto B y el punto C?', 4.7, 'mg/L', '7,1 − 2,4 = 4,7 mg/L. El oxígeno cae a un valor en el que muchas especies ya no pueden vivir.', { ctx: 'Arroyo El Talar: B 7,1 mg/L de oxígeno · C 2,4 mg/L.', d: 3, dec: 1 }),
      cad('Armá la explicación de los peces muertos en verano.', [
        'La fábrica vuelca efluentes con mucha materia orgánica',
        'Sube la DBO del arroyo',
        'Las bacterias consumen el oxígeno disuelto',
        'Con el calor el agua guarda todavía menos oxígeno',
        'Los peces se asfixian',
      ], ['Los campos le agregan oxígeno al agua'], 'Materia orgánica, consumo de oxígeno y calor: tres factores que se suman en verano. Los campos no agregan oxígeno; si acaso, agregan nutrientes.', { d: 4 }),
      clas('¿Qué medida corresponde a cada fuente?', {
        'Para la fábrica': ['Exigir una planta de tratamiento de efluentes', 'Controles periódicos de lo que vuelca'],
        'Para el barrio': ['Obras de red cloacal', 'Mantenimiento y vaciado de pozos ciegos'],
        'Para los campos': ['Franjas de vegetación junto al arroyo', 'Usar la dosis justa de fertilizante'],
      }, 'Cada fuente tiene su medida. Un plan serio actúa sobre las tres, empezando por la que más pesa.', { d: 3 }),
      rank('Ordená las fuentes por cuánta DBO le agregan al arroyo, de más a menos.', [
        ['La fábrica de alimentos', '+42 mg/L'],
        ['El barrio sin cloacas', '+12 mg/L'],
        ['Los campos', '+3 mg/L'],
      ], 'Con los datos a la vista, la prioridad es clara. Sin medir, lo más probable era culpar al barrio, que es lo que más se ve.', { d: 3 }),
      vf('Como el barrio también contamina, la fábrica no es responsable del problema.', false, 'Las dos fuentes suman, pero la fábrica agrega casi cuatro veces más DBO que el barrio. Que haya varias fuentes no borra la responsabilidad de cada una.', {
        razones: ['+Porque cada fuente es responsable de lo que aporta, y la fábrica aporta más', '-Porque el barrio es la única fuente', '-Porque la DBO no tiene relación con los peces'],
        d: 3,
      }),
      mult('El grupo de la escuela quiere actuar. ¿Qué pasos son razonables? Marcá todos.', [
        '+Presentar los datos a la autoridad ambiental con fechas y lugares',
        '+Repetir las mediciones en otras estaciones del año',
        '+Invitar a la fábrica y a los vecinos a una reunión con los datos',
        '-Publicar que el agua del barrio es venenosa sin más mediciones',
        '-Tirar cal al arroyo para "neutralizar" la contaminación',
      ], 'Datos, repetición y diálogo con los responsables. Exagerar sin evidencia o improvisar "soluciones" químicas puede empeorar todo.', { d: 3 }),
      det('La radio local cuenta el caso. Marcá los errores.', [
        ['Estudiantes midieron oxígeno y DBO en cuatro puntos del arroyo.', false],
        ['El mayor aumento de la contaminación orgánica aparece después de la fábrica.', false],
        ['El oxígeno más bajo está antes de los campos.', true, 'Antes de los campos está el valor más alto (8,2 mg/L).'],
        ['Con más caudal el problema desaparece solo, así que no hace falta hacer nada.', true, 'Diluir no elimina la fuente: el verano siguiente vuelve el problema.'],
      ], 'Leer bien una tabla y no confiar en la dilución: las dos claves del caso.', { d: 4 }),
    ]),
  ],
});
