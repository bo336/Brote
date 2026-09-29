import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ANIMALES 1 — La trama de la vida.
// La base de la rama: qué es la biodiversidad, cómo se arman las redes
// tróficas, qué especies sostienen a las demás, cómo se adaptan los animales
// y qué hacen por nosotros. Retoma la energía que fluye y se degrada y los
// sistemas (tronco-1), y la fotosíntesis (plantas-1 si ya la hiciste).

export default unidad({
  slug: 'animales-1',
  rama: 'animales',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'La trama de la vida',
  bajada: 'Genes, especies y ecosistemas: qué es la biodiversidad, cómo se conectan los seres vivos y por qué perder una especie mueve toda la red.',
  objetivos: [
    'Definir la biodiversidad en sus tres niveles',
    'Armar cadenas y redes tróficas con productores, consumidores y descomponedores',
    'Explicar el papel de las especies clave y los ingenieros de ecosistemas',
    'Relacionar adaptaciones de animales argentinos con su ambiente',
    'Reconocer los servicios que la fauna presta a las personas',
  ],
  repasa: ['tronco-1'],
  fuentes: ['ipbes-global', 'iucn-red-list', 'sib-apn', 'sarem-2019', 'aves-argentinas', 'parques-nacionales', 'gbif'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es la biodiversidad', 'Genes, especies y ecosistemas: tres niveles de la variedad de la vida.', [
      teoria('Tres niveles', [
        'Biodiversidad es la variedad de la vida en todas sus formas. Se mira en tres niveles: la diversidad genética (las diferencias entre individuos de una misma especie), la diversidad de especies (cuántas y cuáles especies hay) y la diversidad de ecosistemas (selvas, pastizales, humedales, mares).',
        'Los tres importan. Una especie con poca diversidad genética es más vulnerable a enfermedades o cambios del clima. Un paisaje con un solo tipo de ecosistema ofrece menos hábitats.',
      ]),
      clas('¿A qué nivel de la biodiversidad se refiere cada ejemplo?', { // e1
        'Genética': ['Los distintos colores de pelaje en una población de zorros', 'Las muchas variedades de maíz de los pueblos andinos'],
        'De especies': ['Las aves distintas que viven en una laguna', 'La cantidad de especies de ranas en las Yungas'],
        'De ecosistemas': ['Selvas, humedales y estepas en un mismo país', 'Bosques y pastizales en una misma provincia'],
      }, 'La biodiversidad no es solo contar especies: también son las diferencias dentro de ellas y entre paisajes.', { d: 2 }),
      teoria('Cuántas especies hay', [
        'La ciencia describió alrededor de 2 millones de especies, pero se estima que existen muchas más: solo de animales, plantas, hongos y otros organismos con células complejas podría haber alrededor de 8 a 9 millones. La mayoría son insectos y otros invertebrados, muchos todavía sin nombre.',
        'Argentina, con su enorme variedad de climas, tiene alrededor de 1.000 especies de aves y unas 400 de mamíferos, además de miles de especies de plantas, peces, anfibios, reptiles e invertebrados.',
      ], { destacado: { valor: '≈ 1.000', texto: 'especies de aves viven en Argentina: una de las avifaunas más ricas del mundo.' } }),
      est('Estimá cuántas especies de seres vivos describió la ciencia hasta hoy.', 2000000, { min: 10000, max: 100000000, unidad: 'especies', escala: 'log' }, 'Alrededor de 2 millones. Y se estima que existen varias veces más, sobre todo insectos y organismos chicos.', { d: 3 }),
      rank('Ordená estos grupos de animales por cantidad de especies descriptas en el mundo, de más a menos.', [ // e3
        ['Insectos', 'alrededor de un millón'],
        ['Peces', 'más de 30.000'],
        ['Aves', 'unas 11.000'],
        ['Mamíferos', 'unas 6.500'],
      ], 'Los insectos dominan la biodiversidad animal. Los mamíferos, el grupo que más miramos, son una fracción mínima.', { d: 2 }),
      vf('La mayoría de las especies del planeta ya fueron descubiertas y descriptas por la ciencia.', false, 'Se describieron alrededor de 2 millones, pero se estima que existen varias veces más. Cada año se describen miles de especies nuevas.', { // e4
        razones: ['+Porque se estima que existen varias veces más de las descriptas', '-Porque ya no quedan lugares por explorar', '-Porque todas las especies son grandes y fáciles de ver'],
        d: 2,
      }),
      teoria('Por qué importa la variedad', [
        'Un ecosistema con muchas especies suele ser más estable: si una especie falla por una sequía o una enfermedad, otras pueden cumplir funciones parecidas. Es como una red con muchos hilos: si se corta uno, no se cae todo.',
        'La biodiversidad también es la fuente de alimentos, medicinas, materiales y de muchos servicios que la naturaleza da gratis, como la polinización o el control de plagas.',
      ]),
      cad('Armá la cadena de por qué un cultivo con una sola variedad es más frágil.', [ // e5
        'Todas las plantas del campo son genéticamente iguales',
        'Aparece una enfermedad que afecta a esa variedad',
        'Ninguna planta tiene defensas distintas',
        'Se pierde todo el cultivo',
      ], ['Las plantas iguales se protegen entre sí'], 'La diversidad genética es un seguro. Por eso se conservan semillas de muchas variedades en bancos de germoplasma.', { d: 2 }),
      mult('¿Qué beneficios trae la biodiversidad a las personas? Marcá todos.', [ // e6
        '+Alimentos variados',
        '+Medicinas',
        '+Polinización de cultivos',
        '+Ecosistemas más estables',
        '-Más enfermedades en los cultivos',
      ], 'La biodiversidad es la base de lo que comemos, de muchos remedios y de la estabilidad de los ecosistemas.', { d: 1 }),
      par('Uní cada ecosistema argentino con un animal característico.', [ // e7
        ['Selva Paranaense', 'Yaguareté'],
        ['Estepa Patagónica', 'Guanaco'],
        ['Esteros del Iberá', 'Ciervo de los pantanos'],
        ['Altos Andes', 'Cóndor andino'],
      ], 'Cada ecosistema tiene su fauna. La diversidad de ecosistemas trae diversidad de especies.', { d: 2 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['La biodiversidad incluye genes, especies y ecosistemas.', false],
        ['Biodiversidad es solo la cantidad de animales grandes de un lugar.', true, 'Incluye todos los seres vivos y los tres niveles, no solo animales grandes.'],
        ['Argentina tiene alrededor de 1.000 especies de aves.', false],
        ['Un ecosistema con menos especies es más estable.', true, 'Suele ser al revés: más especies dan más estabilidad.'],
      ], 'La biodiversidad es mucho más que los animales que vemos.', { d: 2 }),
      numv(3, (i) => {
        const desc = [2, 2, 1.5][i];
        const tot = [8, 10, 6][i];
        return {
          enunciado: `Si se describieron ${desc.toLocaleString('es-AR')} millones de especies y se estima que existen ${tot} millones, ¿qué porcentaje conocemos?`,
          valor: (desc / tot) * 100,
          unidad: '%',
          explicacion: `${desc.toLocaleString('es-AR')} ÷ ${tot} × 100 = ${(desc / tot) * 100} %. La mayor parte de la vida del planeta todavía no tiene nombre científico.`,
        };
      }, { d: 2 }),
      vf('Una especie con poca diversidad genética es más vulnerable a una enfermedad nueva.', true, 'Si todos los individuos son parecidos, una enfermedad que afecta a uno puede afectar a casi todos. La variación genética es un seguro.', {
        razones: ['+Porque sin variación, lo que afecta a uno afecta a casi todos', '-Porque las enfermedades no afectan a los animales', '-Porque la diversidad genética aumenta las enfermedades'],
        d: 2,
      }),
      comp('Completá.', 'La biodiversidad se mira en tres niveles: [genética], de [especies] y de [ecosistemas].', ['química', 'ciudades', 'climas'], 'Los tres niveles de la variedad de la vida, en una sola línea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Quién come a quién', 'Productores, consumidores y descomponedores: cadenas y redes tróficas con animales argentinos.', [
      teoria('Los papeles de la red', [
        'En un ecosistema, los productores —plantas, algas— fabrican su alimento con la luz del sol. Los consumidores comen a otros seres vivos: los herbívoros comen plantas, los carnívoros comen animales y los omnívoros comen de todo. Los descomponedores —hongos, bacterias, lombrices— transforman los restos de los seres muertos en nutrientes que vuelven al suelo.',
        'Una cadena trófica muestra quién come a quién en línea: pasto, cuis, zorro. Pero en la realidad, cada especie come y es comida por varias: se forma una red trófica.',
      ]),
      clas('¿Qué papel cumple cada ser vivo en el ecosistema?', { // e1
        'Productor': ['Pasto del pastizal', 'Algas de una laguna'],
        'Consumidor': ['Ñandú', 'Puma', 'Carpincho'],
        'Descomponedor': ['Hongos del suelo', 'Lombrices', 'Bacterias'],
      }, 'Sin productores no entra energía; sin descomponedores, los nutrientes no vuelven al suelo.', { d: 1 }),
      ord('Ordená esta cadena trófica del pastizal, del productor al último consumidor.', [ // e2
        'Pasto',
        'Tucura (saltamontes)',
        'Sapo',
        'Culebra',
        'Aguilucho',
      ], 'La energía del sol entra por el pasto y va pasando, escalón por escalón, hasta el aguilucho.', { d: 2, extremos: ['Productor', 'Último consumidor'] }),
      teoria('La energía se achica en cada escalón', [
        'Como viste en el tronco, en cada escalón pasa alrededor del 10 % de la energía al siguiente: el resto se usa para vivir y se pierde como calor. Por eso hay mucho más pasto que tucuras, más tucuras que sapos y muy pocos aguiluchos.',
        'También por eso los grandes carnívoros, como el puma o el yaguareté, necesitan territorios enormes: tienen que recorrer mucho para encontrar suficiente alimento.',
      ]),
      numv(3, (i) => { // e3
        const e = [10000, 50000, 100000][i];
        return {
          enunciado: `Un pastizal captura ${e.toLocaleString('es-AR')} unidades de energía. Si pasa el 10 % a cada escalón, ¿cuántas llegan al tercer escalón (pasto → herbívoro → carnívoro)?`,
          valor: e * 0.01,
          unidad: 'unidades',
          explicacion: `Herbívoros: ${e.toLocaleString('es-AR')} × 0,1 = ${(e * 0.1).toLocaleString('es-AR')}. Carnívoros: × 0,1 = ${(e * 0.01).toLocaleString('es-AR')}. Por eso hay tan pocos carnívoros grandes.`,
        };
      }, { d: 2 }),
      vf('Un yaguareté necesita un territorio grande porque está en lo alto de la red trófica.', true, 'Llega poca energía a lo alto de la red, así que un carnívoro grande necesita recorrer mucha superficie para encontrar presas suficientes.', { // e4
        razones: ['+Porque llega poca energía a lo alto de la red', '-Porque los yaguaretés comen pasto', '-Porque no pueden dormir en el mismo lugar dos veces'],
        d: 2,
      }),
      teoria('Redes, no cadenas', [
        'En una laguna pampeana, las algas y las plantas acuáticas son comidas por caracoles, peces chicos y patos. Las mojarras comen insectos y plancton; las tarariras comen mojarras; las garzas comen mojarras, ranas y tarariras chicas; los biguás bucean por peces. Todos, al morir, alimentan a los descomponedores.',
        'En una red, si una especie desaparece, las que la comían buscan otro alimento, y las que eran comidas por ella pueden multiplicarse. Los efectos viajan por los hilos de la red.',
      ]),
      cad('Armá la cadena de qué puede pasar si en una laguna se pescan casi todas las tarariras.', [ // e5
        'Se pescan casi todas las tarariras',
        'Las mojarras tienen menos depredadores',
        'Aumenta mucho la cantidad de mojarras',
        'Las mojarras comen más plancton que filtra el agua',
        'El agua puede volverse más turbia',
      ], ['Las mojarras se convierten en tarariras'], 'Un cambio arriba de la red puede bajar en cascada hasta el agua. Es una cascada trófica.', { d: 3 }),
      par('Uní cada animal con lo que suele comer.', [ // e6
        ['Carpincho', 'Pastos y plantas acuáticas'],
        ['Garza blanca', 'Peces y ranas'],
        ['Hornero', 'Insectos y larvas'],
        ['Puma', 'Guanacos, liebres y otros mamíferos'],
      ], 'Cada animal ocupa un lugar en la red según lo que come.', { d: 2 }),
      op('¿Qué pasaría en un bosque si desaparecieran todos los descomponedores?', [ // e7
        'Se acumularían restos y faltarían nutrientes en el suelo',
        'Las plantas crecerían más rápido porque habría menos competencia',
        ['No pasaría nada: los descomponedores no cumplen ninguna función', 'Son los que devuelven los nutrientes al suelo: sin ellos, el ciclo se corta.'],
        'Los animales vivirían más años',
      ], 'Los descomponedores cierran el ciclo de la materia que viste en el tronco. Sin ellos, todo se detiene.', { d: 2 }),
      mult('¿Cuáles de estos animales son omnívoros (comen plantas y animales)? Marcá todos.', [ // e8
        '+Zorro gris',
        '+Comadreja overa',
        '+Ñandú',
        '-Puma',
        '-Guanaco',
      ], 'El zorro, la comadreja y el ñandú comen frutos, semillas, insectos y pequeños animales. El puma es carnívoro; el guanaco, herbívoro.', { d: 3 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e9
        ['Los productores fabrican su alimento con la luz del sol.', false],
        ['Hay más aguiluchos que tucuras en un pastizal.', true, 'Es al revés: arriba de la red llega menos energía y hay menos individuos.'],
        ['Los hongos son descomponedores.', false],
        ['Cada especie come a una sola especie y es comida por una sola.', true, 'En la realidad se forman redes: cada especie come y es comida por varias.'],
      ], 'Redes, no cadenas, y menos energía en cada escalón.', { d: 2 }),
      comp('Completá.', 'Las plantas son [productores], los animales son [consumidores] y los hongos y bacterias que reciclan restos son [descomponedores].', ['predadores', 'parásitos', 'polinizadores'], 'Los tres papeles básicos de cualquier ecosistema.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Especies que sostienen a otras', 'Depredadores tope, polinizadores e ingenieros de ecosistemas: algunas especies pesan mucho más que su número.', [
      teoria('Especies clave', [
        'Algunas especies tienen un efecto sobre el ecosistema mucho mayor de lo que haría pensar su cantidad: si desaparecen, el ecosistema cambia mucho. Se las llama especies clave.',
        'Los depredadores tope, como el yaguareté o el puma, suelen ser especies clave: regulan a los herbívoros, que a su vez afectan a las plantas. Sin ellos, los herbívoros pueden multiplicarse y sobrepastorear.',
      ]),
      cad('Armá la cadena de qué puede pasar cuando desaparece un depredador tope.', [ // e1
        'Desaparece el depredador tope de una región',
        'Los herbívoros tienen menos depredadores',
        'Aumentan mucho los herbívoros',
        'Comen más plantas de las que se regeneran',
        'Cambia la vegetación y todo el ecosistema',
      ], ['Las plantas se multiplican porque hay menos carnívoros'], 'Un efecto en cascada que baja desde lo alto de la red hasta el suelo.', { d: 2 }),
      teoria('Ingenieros de ecosistemas', [
        'Otras especies son ingenieras: modifican el ambiente y crean hábitats para otras. Las vizcachas cavan vizcacheras que usan muchos otros animales; los horneros construyen nidos que después ocupan otras aves; las lombrices airean y mezclan el suelo.',
        'Pero un ingeniero también puede ser destructivo fuera de su lugar: el castor, traído de América del Norte a Tierra del Fuego, construye diques que inundan y matan bosques nativos que no evolucionaron con él.',
      ]),
      par('Uní cada ingeniero con lo que hace.', [ // e2
        ['Vizcacha', 'Cava cuevas que usan otros animales'],
        ['Hornero', 'Construye nidos que después ocupan otras aves'],
        ['Lombriz', 'Airea y mezcla el suelo'],
        ['Castor en Tierra del Fuego', 'Hace diques que inundan bosques nativos'],
      ], 'Los ingenieros cambian el ambiente. En su lugar de origen lo enriquecen; fuera de él, pueden destruirlo.', { d: 2 }),
      vf('El castor es un ingeniero de ecosistemas que beneficia a los bosques de Tierra del Fuego.', false, 'Allí es una especie exótica invasora: sus diques inundan y matan bosques de lenga y ñire que no evolucionaron con castores.', { // e3
        razones: ['+Porque es invasor y sus diques matan bosques que no evolucionaron con él', '-Porque los castores no construyen diques', '-Porque en Tierra del Fuego no hay bosques'],
        d: 3,
      }),
      teoria('Polinizadores y dispersores', [
        'Los polinizadores —abejas, mariposas, picaflores, murciélagos— permiten que se reproduzcan muchas plantas, incluidos cultivos. Los dispersores de semillas —aves, murciélagos, monos, tapires, zorros— llevan las semillas lejos de la planta madre.',
        'Si faltan, las plantas que dependen de ellos dejan de reproducirse o se quedan en un solo lugar. En selvas donde se cazaron los grandes dispersores, algunos árboles de semillas grandes casi no logran regenerarse.',
      ]),
      mult('¿Cuáles de estos animales pueden dispersar semillas? Marcá todos.', [ // e4
        '+Zorzal',
        '+Tapir',
        '+Murciélago frugívoro',
        '+Zorro',
        '-Lombriz',
      ], 'Los animales que comen frutos llevan las semillas en su interior y las dejan lejos. Las lombrices mezclan el suelo, pero no dispersan semillas grandes.', { d: 2 }),
      op('¿Por qué el yaguareté se considera una especie clave en la selva?', [ // e5
        'Porque regula a sus presas, y eso mueve todo',
        'Porque es el animal más numeroso de la selva',
        ['Porque dispersa las semillas de los árboles', 'No es dispersor: su papel es el de depredador tope.'],
        'Porque come los frutos que caen al suelo',
      ], 'Su efecto sobre el ecosistema es mucho mayor que su número, que es chico.', { d: 2 }),
      teoria('Volver a traerlos', [
        'Cuando una especie clave desaparece de una región, a veces se puede reintroducir. En los Esteros del Iberá, en Corrientes, proyectos de conservación reintrodujeron especies que habían desaparecido de la zona, como el oso hormiguero, el pecarí de collar, el guacamayo rojo, la nutria gigante y el yaguareté, que volvió a nacer en libertad allí después de décadas.',
        'Esto se llama restauración o renaturalización: devolver a un ecosistema las piezas que le faltaban para que vuelva a funcionar.',
      ]),
      clas('¿Esta especie fue reintroducida en los Esteros del Iberá o no?', { // e6
        'Reintroducida': ['Yaguareté', 'Oso hormiguero', 'Guacamayo rojo'],
        'No (nunca desapareció de allí o no es de la zona)': ['Carpincho', 'Yacaré', 'Pingüino de Magallanes'],
      }, 'Carpinchos y yacarés siguieron en los esteros. El pingüino es del mar patagónico, no de Corrientes.', { d: 3 }),
      rank('Ordená estos efectos de reintroducir un depredador tope, del más inmediato al más lejano.', [ // e7
        ['Aparece un depredador que caza herbívoros', 'inmediato'],
        ['Los herbívoros cambian su comportamiento y su número', 'meses a años'],
        ['La vegetación se recupera en algunas zonas', 'años'],
        ['Se recupera la estructura completa del ecosistema', 'décadas'],
      ], 'Los efectos de una especie clave se despliegan con el tiempo, como los retrasos que viste en el tronco.', { d: 3, extremos: ['Más inmediato', 'Más lejano'] }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['El yaguareté volvió a nacer en libertad en los Esteros del Iberá.', false],
        ['Los depredadores tope no afectan a las plantas.', true, 'Al regular a los herbívoros, afectan indirectamente a la vegetación.'],
        ['Las vizcachas cavan cuevas que usan otros animales.', false],
        ['Todo ingeniero de ecosistemas es beneficioso en cualquier lugar.', true, 'Fuera de su lugar de origen, como el castor en Tierra del Fuego, puede ser destructivo.'],
      ], 'Algunas especies pesan mucho más que su número. Y el contexto importa.', { d: 3 }),
      vf('Una especie con pocos individuos nunca puede ser importante para el ecosistema.', false, 'Las especies clave, como los depredadores tope, suelen ser pocas y sin embargo cambian todo el ecosistema.', {
        razones: ['+Porque algunas especies escasas tienen efectos enormes', '-Porque solo importan las especies más abundantes', '-Porque los depredadores tope son siempre los más numerosos'],
        d: 2,
      }),
      mult('¿Cuáles de estos animales son ingenieros de ecosistemas? Marcá todos.', [
        '+Vizcacha',
        '+Hornero',
        '+Lombriz de tierra',
        '+Castor',
        '-Mariposa espejito',
      ], 'Todos modifican el ambiente. El castor también, aunque en Tierra del Fuego para mal. La mariposa poliniza, pero no construye ni transforma el hábitat.', { d: 2 }),
      comp('Completá.', 'Un depredador [tope] como el yaguareté regula a los herbívoros; un [ingeniero] de ecosistemas modifica el ambiente y crea hábitats para otros.', ['exótico', 'turista', 'productor'], 'Dos ideas para entender por qué algunas especies importan tanto.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Adaptados a su lugar', 'Guanacos, pingüinos, playeros y peludos: cómo el cuerpo y el comportamiento de los animales responden a su ambiente.', [
      teoria('Qué es una adaptación', [
        'Una adaptación es una característica —del cuerpo, del funcionamiento o del comportamiento— que ayuda a un organismo a sobrevivir y reproducirse en su ambiente. Aparece a lo largo de muchas generaciones, por selección natural: los individuos con esa característica sobreviven y dejan más crías.',
        'Las adaptaciones explican por qué cada ambiente tiene animales tan particulares.',
      ]),
      teoria('Ejemplos argentinos', [
        'El guanaco tiene una sangre muy eficiente para captar oxígeno, lo que le permite vivir en la altura, y puede sobrevivir con poca agua en la estepa. El pingüino de Magallanes tiene plumas muy apretadas y grasa que lo aíslan del agua fría. El peludo (un tipo de armadillo) tiene un caparazón y garras para cavar. El ñandú, que no vuela, corre a gran velocidad por los pastizales.',
      ]),
      par('Uní cada animal con una adaptación a su ambiente.', [ // e1
        ['Guanaco', 'Sangre eficiente para la altura y resistencia a la sequía'],
        ['Pingüino de Magallanes', 'Plumas apretadas y grasa contra el frío'],
        ['Peludo', 'Garras para cavar madrigueras'],
        ['Ñandú', 'Patas largas para correr en el pastizal'],
      ], 'Cada adaptación responde a un desafío del ambiente: altura, frío, depredadores, distancias.', { d: 2 }),
      clas('¿Es una adaptación del cuerpo o del comportamiento?', { // e2
        'Del cuerpo': ['El pelaje blanco de invierno de algunos animales de montaña', 'Las garras del peludo', 'El pico largo del picaflor'],
        'Del comportamiento': ['Migrar en invierno', 'Cazar de noche', 'Enterrarse en las horas de más calor'],
      }, 'Las adaptaciones no son solo de forma: también son formas de actuar.', { d: 2 }),
      teoria('Grandes viajeros', [
        'Algunas aves hacen migraciones enormes. El playero rojizo viaja cada año unos 15.000 kilómetros en cada sentido, entre el Ártico de Canadá, donde se reproduce, y la costa de Tierra del Fuego, donde pasa el verano austral. En el camino necesita parar en ciertas playas para alimentarse.',
        'Si esas paradas se degradan, la especie no puede completar su viaje. Por eso la conservación de aves migratorias requiere cooperación entre muchos países.',
      ], { destacado: { valor: '≈ 15.000 km', texto: 'recorre en cada sentido el playero rojizo entre el Ártico y Tierra del Fuego.' } }),
      numv(3, (i) => { // e3
        const km = 15000;
        const dia = [500, 600, 750][i];
        return {
          enunciado: `Si un playero rojizo recorre ${km.toLocaleString('es-AR')} km en su migración a un promedio de ${dia} km por día de vuelo, ¿cuántos días de vuelo necesita?`,
          valor: km / dia,
          unidad: 'días',
          explicacion: `${km.toLocaleString('es-AR')} ÷ ${dia} = ${km / dia} días de vuelo, sin contar las paradas para comer. Por eso las playas de descanso son vitales.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de por qué perder una playa de descanso afecta al playero rojizo.', [ // e4
        'Se construye sobre una playa de descanso',
        'Los playeros no encuentran alimento en su viaje',
        'Llegan débiles o no llegan al destino',
        'Se reproducen menos y la población baja',
      ], ['Los playeros aprenden a volar sin parar'], 'Una especie migratoria depende de una cadena de lugares. Si falla uno, falla todo el viaje.', { d: 2 }),
      vf('Un animal puede "decidir" adaptarse a un ambiente nuevo en pocos días.', false, 'Las adaptaciones aparecen por selección natural a lo largo de muchas generaciones. Un individuo puede cambiar su comportamiento, pero no su cuerpo, de un día para otro.', { // e5
        razones: ['+Porque las adaptaciones aparecen en muchas generaciones', '-Porque los animales nunca cambian', '-Porque las adaptaciones las eligen los individuos'],
        d: 2,
      }),
      teoria('Cuando el ambiente cambia rápido', [
        'Las adaptaciones funcionan para el ambiente en el que evolucionaron. Si el ambiente cambia muy rápido —por el cambio climático, un desmonte o una especie invasora—, muchas especies no tienen tiempo de adaptarse. Algunas pueden moverse a otros lugares; otras, no.',
      ]),
      op('¿Por qué el cambio climático rápido es un problema para muchas especies?', [ // e6
        'Porque cambia más rápido de lo que pueden adaptarse',
        'Porque todas las especies prefieren el frío extremo',
        ['Porque los animales no sienten la temperatura', 'La sienten, y justamente sus adaptaciones dependen de ella.'],
        'Porque los animales solo viven en ciudades',
      ], 'La selección natural necesita generaciones. Si el ambiente cambia en décadas, muchas especies quedan desacopladas.', { d: 2 }),
      mult('¿Qué pueden hacer las especies ante un ambiente que cambia? Marcá las posibilidades.', [ // e7
        '+Moverse a otras zonas más adecuadas',
        '+Cambiar algunos comportamientos',
        '+Adaptarse si hay tiempo y variación genética',
        '-Cambiar su cuerpo en una semana a voluntad',
        '-Detener el cambio del clima',
      ], 'Moverse, cambiar comportamientos o adaptarse en generaciones. Si ninguna alcanza, la especie declina.', { d: 3 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['El pingüino de Magallanes tiene plumas y grasa que lo aíslan del frío.', false],
        ['El guanaco se volvió resistente a la sequía porque quiso.', true, 'Las adaptaciones aparecen por selección natural en muchas generaciones, no por voluntad.'],
        ['El playero rojizo migra miles de kilómetros.', false],
        ['Cualquier especie se adapta sin problema a cambios rápidos.', true, 'Muchas no tienen tiempo de adaptarse a cambios muy rápidos.'],
      ], 'Las adaptaciones son lentas. El problema actual es la velocidad del cambio.', { d: 2 }),
      op('Un animal del Monte pasa las horas de más calor enterrado y sale a buscar comida de noche. ¿Qué tipo de adaptación es?', [
        'Una adaptación de comportamiento',
        'Una adaptación de la forma del cuerpo',
        ['Una costumbre que aprendió de las personas', 'Es una conducta heredada que lo ayuda a evitar el calor y perder menos agua.'],
        'Una enfermedad que le impide salir de día',
      ], 'Cambiar el horario de actividad es una de las adaptaciones más comunes en los desiertos.', { d: 2 }),
      mult('¿Qué características ayudan a un animal a soportar el frío? Marcá todas.', [
        '+Una capa gruesa de grasa',
        '+Pelaje o plumas densos',
        '+Un cuerpo compacto',
        '+Refugiarse en madrigueras',
        '-Orejas enormes y finas',
      ], 'Las orejas grandes y finas sirven para perder calor: son típicas de animales de desiertos cálidos, no de zonas frías.', { d: 3 }),
      comp('Completá.', 'Las adaptaciones aparecen por selección [natural] a lo largo de muchas [generaciones].', ['artificial', 'semanas', 'horas'], 'Por eso los cambios muy rápidos del ambiente son tan peligrosos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Lo que la fauna hace por nosotros', 'Polinizar, controlar plagas, limpiar y dispersar: el trabajo invisible de los animales.', [
      teoria('Trabajo gratis', [
        'Los animales prestan servicios que las personas necesitan: polinizan cultivos y plantas silvestres, controlan plagas, dispersan semillas que regeneran bosques, reciclan nutrientes y eliminan cadáveres. Si hubiera que reemplazar esos servicios con trabajo humano o máquinas, costaría fortunas, y muchas veces sería imposible.',
      ]),
      par('Uní cada animal con el servicio que presta.', [ // e1
        ['Abejas nativas', 'Polinizar flores y cultivos'],
        ['Murciélagos insectívoros', 'Comer insectos que pueden ser plagas'],
        ['Cóndor andino', 'Eliminar cadáveres de animales'],
        ['Zorzal', 'Dispersar semillas'],
      ], 'Cuatro trabajos que hacen los animales sin cobrar.', { d: 1 }),
      teoria('Murciélagos, lechuzas y plagas', [
        'Un murciélago insectívoro puede comer cientos de insectos en una noche, incluidos mosquitos y polillas que dañan cultivos. Una familia de lechuzas del campanario puede cazar cientos o miles de roedores en un año. Por eso, en muchos campos se colocan cajas nido para lechuzas como control natural de roedores.',
        'Matar murciélagos o lechuzas por miedo o superstición termina trayendo más plagas.',
      ]),
      cad('Armá la cadena de por qué matar lechuzas puede traer más ratas.', [ // e2
        'Se matan las lechuzas de un campo',
        'Hay menos depredadores de roedores',
        'Los roedores se multiplican',
        'Aumentan los daños en los cultivos y los riesgos sanitarios',
      ], ['Las lechuzas traen las ratas al campo'], 'Un depredador natural es un control de plagas que trabaja todas las noches, gratis.', { d: 2 }),
      vf('Los murciélagos son animales dañinos que conviene eliminar.', false, 'La mayoría de los murciélagos de Argentina come insectos o frutos: controlan plagas y dispersan semillas. No hay que tocarlos con las manos, pero tampoco eliminarlos.', { // e3
        razones: ['+Porque controlan insectos y dispersan semillas', '-Porque todos los murciélagos se alimentan de sangre', '-Porque los murciélagos no comen nada'],
        d: 2,
      }),
      teoria('Carroñeros: el servicio de limpieza', [
        'Los carroñeros, como el cóndor andino, los jotes, los caranchos y muchos insectos, comen cadáveres de animales. Así evitan que los restos se pudran durante semanas y que se propaguen enfermedades.',
        'El cóndor andino, una de las aves voladoras más grandes del mundo, con unos 3 metros de envergadura, está amenazado sobre todo por envenenamientos: comen cadáveres con cebos tóxicos que se ponen para matar a otros animales.',
      ]),
      cad('Armá la cadena de cómo un cebo envenenado mata cóndores.', [ // e4
        'Se pone veneno en un cadáver para matar zorros o pumas',
        'Un grupo de cóndores come del cadáver',
        'Los cóndores se envenenan',
        'Mueren varios cóndores de una sola vez',
      ], ['El veneno solo afecta a la especie buscada'], 'Los venenos no eligen: matan a todo lo que come del cebo. Por eso están prohibidos y son tan dañinos.', { d: 2 }),
      mult('¿Qué servicios prestan los carroñeros? Marcá todos.', [ // e5
        '+Eliminan cadáveres',
        '+Reducen la propagación de enfermedades',
        '+Reciclan nutrientes',
        '-Polinizan flores',
        '-Fabrican oxígeno',
      ], 'Son el servicio de limpieza de la naturaleza. Sin ellos, los cadáveres duran mucho más y pueden contagiar enfermedades.', { d: 2 }),
      teoria('El valor de lo que no se ve', [
        'Según la plataforma científica IPBES, alrededor de las tres cuartas partes de los tipos de cultivos alimentarios del mundo dependen, al menos en parte, de la polinización animal. Muchos de ellos son frutas, verduras y frutos secos que aportan vitaminas y minerales esenciales.',
        'Casi nunca vemos estos servicios en acción, y por eso es fácil subestimarlos. Se notan cuando faltan.',
      ], { destacado: { valor: '≈ 75 %', texto: 'de los tipos de cultivos alimentarios del mundo dependen en parte de la polinización animal.' } }),
      est('Estimá qué porcentaje de los tipos de cultivos alimentarios del mundo depende, al menos en parte, de polinizadores animales.', 75, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor de tres de cada cuatro. No todos dependen del mismo modo, pero sin polinizadores muchas frutas y verduras rendirían mucho menos.', { d: 3 }),
      op('¿Qué medida es mejor para controlar roedores en un campo a largo plazo?', [ // e7
        'Instalar cajas nido para lechuzas',
        'Poner cebos envenenados por todo el campo',
        ['Matar a los zorros y las lechuzas que hay', 'Sacarías justamente a los depredadores que controlan a los roedores.'],
        'Quemar los pastizales cercanos',
      ], 'Aliarse con los depredadores naturales es barato, permanente y no envenena a otras especies.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['Las lechuzas cazan muchos roedores.', false],
        ['Hay que matar a los murciélagos porque traen plagas.', true, 'Los murciélagos insectívoros comen insectos que pueden ser plagas.'],
        ['El cóndor andino come cadáveres.', false],
        ['Poner veneno en un cadáver solo mata al zorro que se busca.', true, 'Los cebos envenenados matan a todo lo que come de ellos, incluidos cóndores.'],
      ], 'La fauna trabaja para nosotros. Atacarla suele salir caro.', { d: 2 }),
      numv(3, (i) => {
        const n = [200, 500, 1000][i];
        const ins = [300, 500, 400][i];
        return {
          enunciado: `Una colonia de ${n.toLocaleString('es-AR')} murciélagos insectívoros come en promedio ${ins} insectos por murciélago por noche. ¿Cuántos insectos come la colonia en una noche?`,
          valor: n * ins,
          unidad: 'insectos',
          explicacion: `${n.toLocaleString('es-AR')} × ${ins} = ${(n * ins).toLocaleString('es-AR')} insectos por noche. En un verano, decenas de millones: un control de plagas gratuito.`,
        };
      }, { d: 2 }),
      est('Estimá la envergadura (de punta a punta de las alas) de un cóndor andino adulto.', 3, { min: 0.5, max: 6, paso: 0.1, unidad: 'm' }, 'Alrededor de 3 metros. Es una de las aves voladoras más grandes del mundo, y aprovecha las corrientes de aire para planear horas sin aletear.', { d: 2 }),
      comp('Completá.', 'Los murciélagos y las lechuzas controlan [plagas]; los cóndores eliminan [cadáveres]; y las abejas [polinizan] cultivos.', ['semillas', 'nidos', 'envenenan'], 'Tres servicios que la fauna presta gratis todos los días.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: la trama de la vida', 'Biodiversidad, redes tróficas, especies clave, adaptaciones y servicios, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la laguna de los Álamos', 'En una laguna pampeana algo se desequilibró. Con los datos, encontrá la causa y proponé qué hacer.', [
      teoria('La laguna', [
        'Los vecinos de una laguna pampeana notan que el agua está cada vez más turbia y verde, y que casi no se ven tarariras. Desde hace tres años, un grupo pesca con redes todas las tarariras que encuentra para venderlas. Los pescadores deportivos cuentan que hay "mojarras por todos lados".',
        'Un estudio de la universidad midió la cantidad de mojarras: se triplicó en tres años. El plancton que filtra el agua bajó a la mitad.',
      ]),
      cad('Armá la cadena más probable de lo que pasó en la laguna.', [ // e1
        'Se pescan casi todas las tarariras',
        'Las mojarras pierden a su principal depredador',
        'Las mojarras se triplican',
        'Comen mucho del plancton que filtra el agua',
        'Crecen las algas y el agua se pone turbia y verde',
      ], ['Las tarariras enturbian el agua al desaparecer'], 'Una cascada trófica: un cambio arriba de la red baja hasta el color del agua.', { d: 3 }),
      numv(3, (i) => { // e2
        const m = [2000, 5000, 1500][i];
        return {
          enunciado: `Si había ${m.toLocaleString('es-AR')} mojarras por hectárea y la cantidad se triplicó, ¿cuántas hay ahora por hectárea?`,
          valor: m * 3,
          unidad: 'mojarras por hectárea',
          explicacion: `${m.toLocaleString('es-AR')} × 3 = ${(m * 3).toLocaleString('es-AR')}. Sin su depredador, la población crece hasta que otro factor la limita.`,
        };
      }, { d: 1 }),
      op('¿Cuál es la medida más directa para empezar a recuperar la laguna?', [ // e3
        'Regular la pesca de tarariras',
        'Echar productos químicos para matar las algas',
        ['Pescar todas las mojarras con redes', 'Ayudaría un tiempo, pero sin el depredador las mojarras vuelven a crecer.'],
        'Traer peces exóticos para que coman mojarras',
      ], 'Atacar la causa: devolverle a la red su depredador. Los químicos y los exóticos suelen traer problemas nuevos.', { d: 3 }),
      vf('Traer un pez exótico para que coma mojarras es una buena solución.', false, 'Un pez exótico puede volverse invasor y causar daños mayores. Mejor recuperar al depredador nativo, la tararira.', { // e4
        razones: ['+Porque puede volverse invasor y causar nuevos daños', '-Porque los peces exóticos no comen', '-Porque las mojarras son exóticas'],
        d: 3,
      }),
      clas('Clasificá las propuestas de los vecinos.', { // e5
        'Ayudan a recuperar la laguna': ['Veda de pesca de tarariras por dos temporadas', 'Talla mínima para las tarariras que se pescan', 'Controlar los vuelcos de fertilizantes de los campos cercanos'],
        'No ayudan o empeoran': ['Echar alguicidas al agua', 'Soltar peces de acuario', 'Pescar más tarariras antes de que se prohíba'],
      }, 'Las buenas medidas atacan la causa y cuidan la red. Las malas tapan síntomas o agregan problemas.', { d: 3 }),
      mult('¿Qué datos conviene seguir midiendo para saber si la laguna se recupera? Marcá todos.', [ // e6
        '+Cantidad de tarariras',
        '+Cantidad de mojarras',
        '+Turbidez del agua',
        '+Cantidad de plancton',
        '-Cantidad de autos en la costanera',
      ], 'Medir las piezas de la red permite ver si la cascada se revierte. Como en el tronco: medir antes y después.', { d: 2 }),
      det('La municipalidad publica su plan. Marcá lo equivocado.', [ // e7
        ['Habrá veda de pesca de tarariras durante dos temporadas.', false],
        ['Como el problema son las algas, las mataremos con químicos y listo.', true, 'Las algas son un síntoma; la causa es la falta de depredadores. Los químicos dañan toda la red.'],
        ['La universidad seguirá midiendo peces y plancton.', false],
        ['Soltaremos truchas para que coman mojarras.', true, 'Traer un pez exótico puede generar una invasión.'],
      ], 'Un buen plan ataca la causa, respeta la red y mide los resultados.', { d: 4 }),
    ]),
  ],
});
