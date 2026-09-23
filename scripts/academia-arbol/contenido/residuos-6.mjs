import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// RESIDUOS 6 — Residuos peligrosos y especiales.
// Qué hace peligroso a un residuo, la cadena de custodia de la Ley 24.051 y
// el Convenio de Basilea, los peligrosos del hogar, los del campo, la salud y
// la industria, y los residuos especiales con valor: neumáticos, aceites y
// aparatos. Cierra la rama: retoma la gestión integral (residuos-5), la
// basura electrónica (digital-1), la minería urbana (digital-4) y los
// contaminantes que se acumulan (oceanos-3).

export default unidad({
  slug: 'residuos-6',
  rama: 'residuos',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Residuos peligrosos y especiales',
  bajada: 'Pilas, lavandina, envases de agroquímicos, residuos de hospital, neumáticos y aparatos viejos: por qué no van a la bolsa común y qué camino tienen que seguir.',
  objetivos: [
    'Reconocer las características que hacen peligroso a un residuo y leer sus pictogramas',
    'Explicar la cadena de custodia de la Ley 24.051 y el Convenio de Basilea',
    'Manejar con seguridad los residuos peligrosos del hogar',
    'Describir la gestión de envases de fitosanitarios y residuos patogénicos',
    'Evaluar el destino de neumáticos, aceites y aparatos electrónicos',
  ],
  repasa: ['residuos-5', 'digital-1', 'digital-4', 'oceanos-3'],
  fuentes: ['ley-24051-peligrosos', 'basilea', 'ley-27279-fitosanitarios', 'unece-sga', 'ewaste-monitor', 'minamata', 'msal-dengue'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué hace peligroso a un residuo', 'Inflamable, corrosivo, reactivo, tóxico o infeccioso: las características del peligro y cómo reconocerlas en una etiqueta.', [
      teoria('Cinco características', [
        'Un residuo es peligroso cuando puede dañar a las personas o al ambiente por sus características. Puede ser inflamable (se prende fuego con facilidad, como solventes o nafta), corrosivo (quema la piel o destruye materiales, como ácidos o soda cáustica), reactivo (puede explotar o liberar gases al mezclarse, como algunos productos de limpieza), tóxico (daña la salud aun en pequeñas cantidades, como el mercurio o muchos plaguicidas) o infeccioso (puede transmitir enfermedades, como algunos residuos de hospital).',
      ], { lista: ['Inflamable', 'Corrosivo', 'Reactivo', 'Tóxico', 'Infeccioso'] }),
      par('Uní cada característica con un ejemplo.', [ // e1
        ['Inflamable', 'Restos de solvente para pintura'],
        ['Corrosivo', 'Ácido de una batería de auto'],
        ['Tóxico', 'Mercurio de un termómetro roto'],
        ['Infeccioso', 'Jeringas usadas de un hospital'],
      ], 'Conocer la característica indica cómo guardarlo, transportarlo y tratarlo.', { d: 1 }),
      teoria('Los pictogramas', [
        'Los productos químicos llevan pictogramas: rombos con borde rojo y un símbolo negro, definidos por un sistema internacional. Una llama indica inflamable; una mano y una superficie corroídas, corrosivo; una calavera, toxicidad aguda; una silueta humana con una estrella en el pecho, daño grave a la salud a largo plazo; un pez y un árbol secos, peligro para el ambiente acuático. Si el producto es peligroso, su envase vacío y sus restos también lo son.',
      ]),
      par('Uní cada pictograma con su significado.', [ // e2
        ['Llama', 'Inflamable'],
        ['Calavera', 'Toxicidad aguda'],
        ['Mano y superficie corroídas', 'Corrosivo'],
        ['Pez y árbol secos', 'Peligroso para el ambiente acuático'],
        ['Silueta con estrella en el pecho', 'Daño grave a la salud a largo plazo'],
      ], 'Los pictogramas son un idioma común: se leen igual en todo el mundo.', { d: 2 }),
      vf('Si un producto tiene pictogramas de peligro, su envase vacío puede tirarse con los reciclables sin más.', false, 'Los envases conservan restos del producto: siguen siendo peligrosos. Hay que seguir las indicaciones de la etiqueta y usar los circuitos adecuados.', { // e3
        razones: ['+Porque los restos del producto siguen siendo peligrosos', '-Porque los envases vacíos no existen', '-Porque los pictogramas son solo decorativos'],
        d: 2,
      }),
      clas('¿Qué característica peligrosa tiene cada residuo?', { // e4
        'Inflamable': ['Restos de thinner', 'Aerosol con gas propelente'],
        'Corrosivo': ['Destapacañerías a base de soda cáustica', 'Ácido muriático'],
        'Tóxico': ['Lámpara fluorescente rota', 'Insecticida vencido'],
      }, 'Muchos productos de uso diario son peligrosos: por eso sus restos no van a la bolsa común.', { d: 2 }),
      teoria('Mezclas peligrosas', [
        'Algunos residuos son peligrosos sobre todo al mezclarse. Por ejemplo, la lavandina mezclada con productos que contienen amoníaco o con ácidos, como el ácido muriático, libera gases tóxicos que dañan las vías respiratorias. Por eso nunca hay que mezclar productos de limpieza ni juntar sus restos en un mismo recipiente.',
      ]),
      cad('Armá la cadena de por qué no hay que mezclar productos de limpieza.', [ // e5
        'Alguien mezcla lavandina con ácido muriático para limpiar más',
        'Los productos reaccionan entre sí',
        'Se libera un gas tóxico',
        'Se respira en un baño cerrado',
        'Daña las vías respiratorias',
      ], ['La mezcla neutraliza todos los peligros'], 'Más fuerte no es mejor: algunas mezclas son muy peligrosas.', { d: 1 }),
      op('¿Qué conviene hacer con los restos de distintos productos de limpieza?', [ // e6
        'No mezclarlos y guardarlos en sus envases originales',
        'Juntarlos en una botella para tirarlos juntos',
        ['Mezclarlos para que se neutralicen entre sí', 'Algunas mezclas liberan gases tóxicos.'],
        'Tirarlos todos juntos por la pileta de una vez',
      ], 'Envase original, bien cerrado y etiquetado, sin mezclas: la regla básica de seguridad.', { d: 1 }),
      mult('¿Qué productos del hogar suelen tener pictogramas de peligro? Marcá todos.', [ // e7
        '+Lavandina',
        '+Insecticidas',
        '+Solventes para pintura',
        '+Destapacañerías',
        '-Jabón de tocador',
      ], 'Leer la etiqueta es el primer paso para usar y descartar bien un producto.', { d: 1 }),
      rank('Ordená estos residuos según su peligrosidad para una persona que los manipula sin protección, de mayor a menor.', [ // e8
        ['Jeringas usadas con restos de sangre', 'infeccioso y cortante'],
        ['Ácido de batería derramado', 'corrosivo'],
        ['Pila común agotada, entera', 'bajo riesgo inmediato'],
        ['Botella de plástico limpia', 'sin peligro'],
      ], 'El riesgo depende de la característica y del estado del residuo: una pila entera es menos riesgosa que una rota.', { d: 3, extremos: ['Más peligroso', 'Menos peligroso'] }),
      op('¿Por qué una pila rota es más riesgosa que una entera?', [ // e8b
        'Puede liberar sustancias corrosivas o tóxicas',
        'Porque pesa más que una pila entera',
        ['Porque deja de tener carga eléctrica', 'La carga no es el problema: lo es lo que se derrama.'],
        'Porque se vuelve inflamable al instante',
      ], 'El estado del residuo cambia su riesgo: por eso se guardan enteras y en recipientes cerrados.', { d: 1 }),
      det('Leé este cartel de un depósito y marcá lo equivocado.', [ // e9
        ['El pictograma de la llama indica material inflamable.', false],
        ['Guardamos juntos lavandina y ácido muriático para ahorrar espacio.', true, 'Mezclados pueden liberar gases tóxicos: se guardan separados.'],
        ['La calavera indica toxicidad aguda.', false],
        ['Los envases vacíos de productos corrosivos no tienen ningún riesgo.', true, 'Conservan restos del producto.'],
      ], 'La seguridad empieza por leer y respetar las etiquetas.', { d: 2 }),
      comp('Completá.', 'Un residuo que se prende fuego con facilidad es [inflamable]; uno que quema la piel o destruye materiales es [corrosivo]; y la lavandina nunca se mezcla con [ácidos].', ['reciclable', 'orgánico', 'agua'], 'Tres claves para reconocer residuos peligrosos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La cadena de custodia', 'Generador, transportista y operador: la Ley 24.051, el manifiesto y el Convenio de Basilea.', [
      teoria('De la cuna a la tumba', [
        'En Argentina, la Ley 24.051, de 1991, regula los residuos peligrosos. Su idea central es la responsabilidad "de la cuna a la tumba": quien genera un residuo peligroso es responsable de él hasta su tratamiento o disposición final. Intervienen tres actores inscriptos en un registro: el generador, que lo produce; el transportista, habilitado para llevarlo; y el operador, que lo trata o lo dispone en instalaciones autorizadas.',
      ]),
      par('Uní cada actor con su rol.', [ // e1
        ['Generador', 'Produce el residuo peligroso'],
        ['Transportista', 'Lo lleva en vehículos habilitados'],
        ['Operador', 'Lo trata o lo dispone en instalaciones autorizadas'],
        ['Autoridad de aplicación', 'Registra y controla a todos'],
      ], 'Cada eslabón tiene obligaciones y responsabilidades.', { d: 1 }),
      teoria('El manifiesto', [
        'Cada vez que un residuo peligroso se mueve, lo acompaña un documento llamado manifiesto. Indica qué residuo es, cuánto, quién lo genera, quién lo transporta y a dónde va. Lo firman el generador, el transportista y el operador. Así se puede seguir el recorrido del residuo y detectar si "desaparece" en el camino.',
      ]),
      ord('Ordená el recorrido de un residuo peligroso con su manifiesto.', [ // e2
        'El generador completa el manifiesto',
        'El transportista retira el residuo y firma',
        'El residuo llega a la planta del operador',
        'El operador firma la recepción y lo trata',
        'Se cierra el circuito con el manifiesto completo',
      ], 'El manifiesto permite comprobar que cada kilo llegó a destino.', { d: 2 }),
      op('¿Para qué sirve el manifiesto?', [ // e3
        'Para seguir el residuo desde que sale hasta que se trata',
        'Para cobrar un impuesto por cada camión',
        ['Para que el residuo pueda tirarse en cualquier lugar', 'Es al revés: sirve para controlar que llegue a un lugar autorizado.'],
        'Para publicitar a la empresa generadora',
      ], 'Sin trazabilidad, un residuo peligroso puede terminar en un basural o un arroyo sin que nadie lo sepa.', { d: 1 }),
      vf('Si una empresa entrega sus residuos peligrosos a un transportista, deja de ser responsable de ellos.', false, 'Por el principio de la cuna a la tumba, el generador sigue siendo responsable hasta su tratamiento o disposición final. Por eso debe elegir actores habilitados.', { // e4
        razones: ['+Por el principio de responsabilidad de la cuna a la tumba', '-Porque la ley no se aplica a las empresas', '-Porque el transportista es el dueño del residuo'],
        d: 2,
      }),
      teoria('El Convenio de Basilea', [
        'A nivel internacional, el Convenio de Basilea, de 1989, controla los movimientos de residuos peligrosos entre países. Nació para frenar la práctica de enviar residuos tóxicos de países ricos a países con menos controles. Exige, entre otras cosas, que el país que recibe dé su consentimiento previo e informado, y promueve que cada país gestione sus residuos lo más cerca posible de donde se generan.',
      ]),
      cad('Armá la cadena de por qué nació el Convenio de Basilea.', [ // e5
        'Tratar residuos peligrosos es caro en los países con controles estrictos',
        'Algunas empresas los enviaban a países con menos controles',
        'Los residuos contaminaban comunidades con menos recursos',
        'Se acordó un convenio internacional',
        'Los envíos requieren consentimiento previo del país receptor',
      ], ['Los países ricos dejaron de generar residuos'], 'Basilea es también una herramienta de justicia ambiental entre países.', { d: 2 }),
      clas('¿Esta práctica cumple o incumple el espíritu de Basilea?', { // e6
        'Cumple': ['Tratar los residuos cerca de donde se generan', 'Pedir consentimiento previo al país que recibe'],
        'Incumple': ['Enviar residuos tóxicos declarados como "materiales para reciclar" falsos', 'Exportar residuos a un país sin informarle qué son'],
      }, 'La transparencia y el consentimiento son el corazón del convenio.', { d: 2 }),
      numv(3, (i) => { // e7
        const [kg, meses] = [[300, 12], [150, 6], [500, 12]][i];
        return {
          enunciado: `Un taller genera ${kg} kg de residuos peligrosos por mes. ¿Cuántos kg genera en ${meses} meses, que deberán figurar en sus manifiestos?`,
          valor: kg * meses,
          unidad: 'kg',
          explicacion: `${kg} × ${meses} = ${(kg * meses).toLocaleString('es-AR')} kg. Comparar lo generado con lo que figura en los manifiestos permite detectar desvíos.`,
          ctx: `${kg} kg por mes durante ${meses} meses.`,
        };
      }, { d: 1 }),
      mult('¿Qué obligaciones tiene un generador de residuos peligrosos? Marcá todas.', [ // e8
        '+Inscribirse en el registro correspondiente',
        '+Entregar sus residuos solo a transportistas habilitados',
        '+Completar los manifiestos',
        '+Almacenarlos de forma segura hasta su retiro',
        '-Tirarlos en el contenedor de basura común',
      ], 'La ley busca que ningún residuo peligroso quede fuera del circuito controlado.', { d: 1 }),
      est('Estimá en qué año se firmó el Convenio de Basilea sobre residuos peligrosos.', 1989, { min: 1950, max: 2025, paso: 1, unidad: '' }, 'En 1989, tras varios escándalos por envíos de residuos tóxicos a países con menos controles.', { d: 2 }),
      det('Leé este informe de una auditoría y marcá los problemas.', [ // e9
        ['El taller está inscripto como generador.', false],
        ['El año pasado generó 3.600 kg, pero los manifiestos suman 900 kg.', true, 'Faltan 2.700 kg: hay que averiguar a dónde fueron.'],
        ['El transportista tiene habilitación vigente.', false],
        ['El taller guarda los residuos al aire libre, sin techo ni contención.', true, 'El almacenamiento debe ser seguro para evitar derrames.'],
      ], 'Los manifiestos permiten detectar el residuo que "desaparece".', { d: 3 }),
      comp('Completá.', 'La ley argentina de residuos peligrosos es la Ley [24.051]; el documento que acompaña al residuo es el [manifiesto]; y el convenio internacional que controla sus movimientos es el de [Basilea].', ['25.916', 'recibo', 'Kioto'], 'Tres claves de la cadena de custodia de los residuos peligrosos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Peligrosos del hogar', 'Pilas, lámparas, medicamentos, aerosoles, pinturas y aceites: pequeñas cantidades que suman mucho.', [
      teoria('En cada casa', [
        'En cada casa se generan residuos peligrosos en pequeñas cantidades: pilas y baterías, lámparas de bajo consumo y tubos fluorescentes (que contienen mercurio), termómetros de mercurio, medicamentos vencidos, aerosoles, restos de pinturas y solventes, insecticidas y aceite de motor. Sumados en toda una ciudad, son toneladas. Mezclados con la basura común, pueden contaminar el compost, el suelo, el agua o lastimar a quienes recolectan.',
      ]),
      clas('¿Este residuo del hogar es peligroso o no?', { // e1
        'Peligroso': ['Pilas usadas', 'Tubo fluorescente', 'Restos de solvente', 'Medicamentos vencidos'],
        'No peligroso': ['Cáscaras de papa', 'Diario viejo', 'Botella de agua vacía'],
      }, 'Los peligrosos del hogar necesitan circuitos especiales, distintos de los reciclables y los orgánicos.', { d: 1 }),
      teoria('Qué hacer con cada uno', [
        'Las pilas y baterías se llevan a puntos de recolección. Las lámparas con mercurio, sin romper, también. Los medicamentos vencidos, a farmacias o puntos habilitados donde existan: nunca al inodoro. El aceite de motor, en un bidón cerrado, a talleres o puntos de recolección. Las pinturas y solventes, en su envase original y bien cerrados, a puntos limpios. Si una lámpara con mercurio se rompe, hay que ventilar, no usar aspiradora y juntar los restos con cuidado.',
      ]),
      par('Uní cada residuo con su destino correcto.', [ // e2
        ['Pilas usadas', 'Punto de recolección de pilas'],
        ['Medicamentos vencidos', 'Farmacia o punto habilitado'],
        ['Aceite de motor', 'Taller o punto de recolección, en bidón cerrado'],
        ['Restos de pintura', 'Punto limpio, en su envase original'],
      ], 'Cada residuo peligroso tiene su circuito: conocerlo evita que termine en el agua o el suelo.', { d: 1 }),
      op('Se rompe una lámpara de bajo consumo en tu cuarto. ¿Qué conviene hacer?', [ // e3
        'Ventilar y juntar con cuidado, sin aspiradora',
        'Pasar la aspiradora enseguida para limpiar todo',
        ['Tirar los restos al inodoro', 'Contamina el agua con mercurio.'],
        'Cerrar la ventana para que no entre aire',
      ], 'Estas lámparas contienen pequeñas cantidades de mercurio: ventilar y evitar dispersar el polvo es la clave.', { d: 2 }),
      vf('Tirar medicamentos vencidos al inodoro es una forma segura de descartarlos.', false, 'Los medicamentos pueden llegar a ríos y arroyos, donde afectan a peces y otros organismos. Conviene llevarlos a farmacias o puntos habilitados.', { // e4
        razones: ['+Porque terminan en el agua y afectan a la fauna', '-Porque las plantas de tratamiento los eliminan por completo', '-Porque los medicamentos no tienen efectos fuera del cuerpo'],
        d: 2,
      }),
      numv(3, (i) => { // e5
        const [hog, pilas] = [[20000, 15], [50000, 12], [8000, 20]][i];
        return {
          enunciado: `En una ciudad hay ${hog.toLocaleString('es-AR')} hogares y cada uno descarta en promedio ${pilas} pilas por año. ¿Cuántas pilas por año se descartan en total?`,
          valor: hog * pilas,
          unidad: 'pilas',
          explicacion: `${hog.toLocaleString('es-AR')} × ${pilas} = ${(hog * pilas).toLocaleString('es-AR')} pilas por año. Pequeñas cantidades por hogar suman volúmenes que justifican un circuito especial. Datos de ejemplo.`,
          ctx: `${hog} hogares; ${pilas} pilas por hogar por año.`,
        };
      }, { d: 1 }),
      teoria('El aceite de cocina', [
        'El aceite de cocina usado no es tóxico como el de motor, pero es un problema: tirado por la pileta, tapa cañerías, dificulta el tratamiento de las cloacas y, si llega al agua, forma una película que impide el intercambio de oxígeno. Juntado en una botella cerrada y llevado a un punto de recolección, puede transformarse en biodiésel o en otros productos.',
      ]),
      cad('Armá el camino correcto del aceite de cocina usado.', [ // e6
        'Se deja enfriar el aceite después de cocinar',
        'Se guarda en una botella de plástico cerrada',
        'Se lleva a un punto de recolección',
        'Una planta lo procesa',
        'Se convierte en biodiésel u otros productos',
      ], ['Se tira por la pileta con agua caliente para que no tape'], 'Un residuo que tapa cañerías se convierte en recurso si se junta aparte.', { d: 1 }),
      mult('¿Qué hacer con los peligrosos del hogar hasta llevarlos a un punto de recolección? Marcá todo.', [ // e7
        '+Guardarlos en su envase original y bien cerrado',
        '+Mantenerlos fuera del alcance de chicos y mascotas',
        '+No mezclar productos distintos',
        '-Juntarlos todos en un balde abierto',
        '-Pasarlos a botellas de gaseosa sin etiqueta',
      ], 'Un envase sin etiqueta o una botella de gaseosa con un tóxico es una causa frecuente de intoxicaciones.', { d: 1 }),
      vf('El aceite de cocina usado, tirado por la pileta, puede tapar cañerías y dificultar el tratamiento de las cloacas.', true, 'Al enfriarse se pega a las cañerías y forma tapones; en las plantas y en el agua, complica el tratamiento y forma películas.', { // e7b
        razones: ['+Porque se solidifica y forma tapones en las cañerías', '-Porque el aceite se disuelve por completo en el agua', '-Porque las cloacas no reciben aceite'],
        d: 1,
      }),
      rank('Ordená estos destinos para una pila usada, del mejor al peor.', [ // e8
        ['Punto de recolección de pilas', 'el mejor'],
        ['Guardarla en un frasco cerrado hasta encontrar un punto', 'aceptable'],
        ['Bolsa de basura común', 'malo'],
        ['Tirarla en un arroyo o en la tierra', 'el peor'],
      ], 'Mientras no haya un punto cerca, guardarla bien es mejor que mezclarla con la basura.', { d: 1, extremos: ['Mejor', 'Peor'] }),
      det('Leé estos consejos de un grupo vecinal y marcá los errores.', [ // e9
        ['Llevamos las pilas al punto de recolección de la municipalidad.', false],
        ['Pasamos los restos de insecticida a una botella de gaseosa para ahorrar lugar.', true, 'Puede confundirse con una bebida: se guarda en el envase original.'],
        ['El aceite de cocina se junta en botellas cerradas.', false],
        ['Si se rompe una lámpara de bajo consumo, usamos la aspiradora.', true, 'Dispersa el polvo con mercurio: hay que ventilar y juntar con cuidado.'],
      ], 'Pequeños errores con residuos peligrosos pueden tener consecuencias graves.', { d: 2 }),
      comp('Completá.', 'Las lámparas de bajo consumo contienen [mercurio]; los medicamentos vencidos no se tiran al [inodoro]; y el aceite de cocina usado puede convertirse en [biodiésel].', ['plomo', 'jardín', 'vidrio'], 'Tres claves para manejar los peligrosos del hogar.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Del campo, la salud y la industria', 'Envases de agroquímicos y triple lavado, residuos patogénicos y residuos industriales.', [
      teoria('Envases de fitosanitarios', [
        'En el campo se usan grandes cantidades de fitosanitarios (agroquímicos) y sus envases vacíos conservan restos del producto. La Ley 27.279, de 2016, obliga a hacerles el triple lavado o lavado a presión, a guardarlos en un lugar adecuado y a entregarlos en un Centro de Almacenamiento Transitorio dentro del año de la compra. Prohíbe abandonarlos, quemarlos, enterrarlos o darlos a personas fuera del sistema, por ejemplo para usarlos como recipientes de agua.',
      ]),
      teoria('El triple lavado', [
        'El triple lavado consiste en llenar el envase vacío con agua hasta un cuarto de su capacidad, taparlo, agitarlo y volcar el agua de enjuague en el tanque de la pulverizadora, para usarla en la misma aplicación. Se repite tres veces. Después se perfora el envase para que no pueda reutilizarse y se guarda hasta llevarlo al centro de acopio.',
      ]),
      ord('Ordená los pasos del triple lavado de un envase de fitosanitario.', [ // e1
        'Llenar el envase con agua hasta un cuarto',
        'Taparlo y agitarlo',
        'Volcar el enjuague en el tanque de la pulverizadora',
        'Repetir el proceso tres veces',
        'Perforar el envase y guardarlo para el centro de acopio',
      ], 'El enjuague se aprovecha en la aplicación: no se tira al suelo ni al agua.', { d: 2 }),
      op('¿Por qué se vuelca el agua del enjuague en el tanque de la pulverizadora?', [ // e2
        'Para usarla en la aplicación y no tirar el químico',
        'Para limpiar el tanque de la pulverizadora',
        ['Para que la pulverizadora pese menos', 'No tiene relación con el peso: se trata de no contaminar.'],
        'Porque el agua de enjuague es potable',
      ], 'Así el resto del producto se usa donde corresponde y no contamina el suelo ni el agua.', { d: 2 }),
      vf('Un envase vacío de agroquímico, bien lavado, se puede usar para guardar agua de consumo.', false, 'La Ley 27.279 prohíbe entregarlos o reutilizarlos fuera del sistema: aun lavados, pueden conservar restos peligrosos. Por eso se perforan.', { // e3
        razones: ['+Porque pueden conservar restos y la ley lo prohíbe', '-Porque el agua disuelve el plástico', '-Porque el triple lavado vuelve potable cualquier envase'],
        d: 1,
      }),
      numv(3, (i) => { // e4
        const [env, litros] = [[200, 20], [500, 10], [80, 20]][i];
        return {
          enunciado: `Un productor usó ${env} envases de ${litros} litros. Si en cada triple lavado usa agua hasta un cuarto del envase tres veces, ¿cuántos litros de enjuague vuelca al tanque en total?`,
          valor: env * litros * 0.25 * 3,
          unidad: 'litros',
          explicacion: `Por envase: ${litros} × 0,25 × 3 = ${litros * 0.75} litros; × ${env} = ${(env * litros * 0.75).toLocaleString('es-AR')} litros. Todo ese enjuague se usa en la aplicación, no se tira.`,
          ctx: `${env} envases de ${litros} litros; un cuarto, tres veces.`,
        };
      }, { d: 2 }),
      teoria('Residuos patogénicos', [
        'Hospitales, centros de salud, laboratorios y consultorios generan residuos patogénicos: materiales que pueden contener agentes infecciosos, como gasas con sangre, jeringas o cultivos. Se separan en el lugar en bolsas y recipientes especiales (los objetos cortantes, en descartadores rígidos), se transportan en vehículos habilitados y se tratan, por ejemplo, con autoclaves que los esterilizan con vapor a alta temperatura, antes de su disposición final.',
      ]),
      cad('Armá el recorrido de una jeringa usada en un centro de salud.', [ // e5
        'Se descarta en un recipiente rígido para cortopunzantes',
        'El recipiente lleno se cierra y se guarda en un lugar seguro',
        'Un transportista habilitado lo retira',
        'Se esteriliza en una planta de tratamiento',
        'Se dispone de forma segura',
      ], ['Se tira en la bolsa de residuos comunes del consultorio'], 'La separación en el lugar protege a quienes limpian, recolectan y tratan los residuos.', { d: 1 }),
      clas('¿Es un residuo patogénico o no?', { // e6
        'Patogénico': ['Gasa con sangre de una curación', 'Aguja usada', 'Cultivo de laboratorio'],
        'No patogénico': ['Papel de la oficina del hospital', 'Restos de comida del bar del hospital'],
      }, 'Separar bien evita tratar como patogénico lo que no lo es, algo caro e innecesario.', { d: 1 }),
      teoria('Residuos industriales', [
        'Las industrias generan residuos muy variados: barros de tratamiento de efluentes, restos de procesos químicos, aceites, solventes, metales. Los que son peligrosos siguen el circuito de la Ley 24.051. Pero lo más efectivo es prevenir: cambiar procesos para usar sustancias menos peligrosas, recuperar solventes para volver a usarlos y diseñar productos que generen menos residuos.',
      ]),
      par('Uní cada residuo con su tratamiento o destino.', [ // e6b
        ['Jeringas usadas', 'Esterilización en autoclave'],
        ['Envases de fitosanitarios', 'Centro de almacenamiento transitorio'],
        ['Solvente industrial usado', 'Recuperación para volver a usarlo'],
        ['Barros industriales peligrosos', 'Relleno de seguridad'],
      ], 'Cada residuo peligroso tiene un tratamiento específico según su característica.', { d: 2 }),
      rank('Ordená estas estrategias para los residuos peligrosos de una industria, de la más preferible a la menos.', [ // e7
        ['Cambiar el proceso para no usar la sustancia peligrosa', 'prevenir'],
        ['Recuperar el solvente y volver a usarlo', 'reutilizar'],
        ['Tratarlo para reducir su peligrosidad', 'tratar'],
        ['Disponerlo en un relleno de seguridad', 'último recurso'],
      ], 'La escalera de los residuos también vale para los peligrosos: lo mejor es que no existan.', { d: 2, extremos: ['Más preferible', 'Menos preferible'] }),
      mult('¿Qué prohíbe la Ley 27.279 sobre los envases vacíos de fitosanitarios? Marcá todo.', [ // e8
        '+Abandonarlos en el campo',
        '+Quemarlos',
        '+Enterrarlos',
        '+Entregarlos a personas fuera del sistema',
        '-Llevarlos a un centro de almacenamiento transitorio',
      ], 'La ley busca que todos los envases lleguen al circuito controlado.', { d: 1 }),
      det('Leé esta práctica de un campo y marcá lo que está mal.', [ // e9
        ['Hacemos el triple lavado y volcamos el enjuague en la pulverizadora.', false],
        ['Quemamos los envases vacíos para no acumularlos.', true, 'La ley lo prohíbe: la quema libera sustancias tóxicas.'],
        ['Perforamos los envases antes de guardarlos.', false],
        ['Regalamos los bidones lavados a los vecinos para guardar agua.', true, 'Está prohibido: pueden conservar restos peligrosos.'],
      ], 'La gestión de envases protege la salud de las familias rurales y del agua.', { d: 2 }),
      comp('Completá.', 'Los envases de agroquímicos se lavan con el [triple] lavado; los residuos de salud que pueden transmitir enfermedades son [patogénicos]; y la ley de envases vacíos de fitosanitarios es la Ley [27.279].', ['doble', 'orgánicos', '24.051'], 'Tres claves de los residuos del campo, la salud y la industria.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Neumáticos, aceites y aparatos', 'Residuos especiales que no siempre son tóxicos, pero que tienen riesgos y mucho valor si se gestionan bien.', [
      teoria('Neumáticos fuera de uso', [
        'Los neumáticos fuera de uso no son tóxicos en sí mismos, pero son un problema. Acumulados al aire libre, juntan agua de lluvia y se convierten en criaderos del mosquito que transmite el dengue. Quemados, liberan humo con sustancias tóxicas. Bien gestionados, pueden recaparse para volver a usarse, triturarse para hacer caucho granulado (para pisos deportivos, asfaltos o baldosas) o usarse como combustible en hornos industriales con control de emisiones.',
      ]),
      cad('Armá la cadena de por qué los neumáticos acumulados son un riesgo para la salud.', [ // e1
        'Se acumulan neumáticos al aire libre',
        'Llueve y se junta agua en su interior',
        'Los mosquitos ponen huevos en esa agua',
        'Crece la población de mosquitos',
        'Aumenta el riesgo de dengue en el barrio',
      ], ['El caucho repele a todos los mosquitos'], 'Un residuo que parece inofensivo puede ser un problema de salud pública.', { d: 1 }),
      par('Uní cada destino del neumático con su resultado.', [ // e2
        ['Recapado', 'Vuelve a usarse como neumático'],
        ['Trituración', 'Caucho granulado para pisos y asfaltos'],
        ['Uso en hornos con control', 'Recuperación de energía'],
        ['Quema a cielo abierto', 'Humo tóxico y contaminación'],
      ], 'El mismo residuo puede ser un recurso o una fuente de contaminación.', { d: 1 }),
      op('En un terreno baldío hay cientos de neumáticos viejos. ¿Qué conviene hacer primero?', [ // e3
        'Retirarlos a un circuito de reciclaje',
        'Quemarlos para que desaparezcan rápido',
        ['Dejarlos, porque no son tóxicos', 'Acumulan agua y crían mosquitos del dengue.'],
        'Taparlos con tierra en el mismo lugar',
      ], 'Retirarlos elimina criaderos de mosquitos y permite recuperarlos.', { d: 1 }),
      teoria('Aceites usados', [
        'El aceite lubricante usado de autos y máquinas es un residuo peligroso: contiene metales y compuestos tóxicos. Un solo cambio de aceite tirado a la tierra o a un desagüe puede contaminar mucha agua. Recolectado, puede regenerarse (refinarse para volver a ser lubricante) o usarse como combustible con controles. Los talleres son generadores y deben entregarlo a transportistas habilitados.',
      ]),
      clas('¿Es una práctica correcta o incorrecta con el aceite de motor usado?', { // e4
        'Correcta': ['Guardarlo en un bidón cerrado', 'Entregarlo a un transportista habilitado', 'Llevarlo a un punto de recolección'],
        'Incorrecta': ['Tirarlo en la tierra del patio', 'Volcarlo en la rejilla de la calle', 'Usarlo para "curar" postes de madera sin control'],
      }, 'El aceite de motor usado es peligroso: siempre al circuito controlado.', { d: 1 }),
      teoria('Aparatos eléctricos y electrónicos', [
        'Lo viste en la rama digital: los aparatos eléctricos y electrónicos viejos contienen metales valiosos, como oro, cobre y cobalto, y también sustancias peligrosas, como plomo, mercurio, cadmio o retardantes de llama. Por eso son residuos especiales: hay que desarmarlos en plantas adecuadas, separar lo peligroso y recuperar lo valioso. La responsabilidad extendida del productor busca que quienes fabrican o importan los aparatos financien ese circuito.',
      ]),
      mult('¿Qué contiene un aparato electrónico viejo? Marcá todo lo que corresponde.', [ // e5
        '+Metales valiosos como cobre y oro',
        '+Sustancias peligrosas como plomo o mercurio',
        '+Plásticos que pueden recuperarse',
        '-Solo plástico sin ningún valor',
        '-Nada que pueda contaminar',
      ], 'Valor y peligro juntos: por eso necesitan un circuito especial.', { d: 1 }),
      numv(3, (i) => { // e6
        const [total, pct] = [[62, 22], [62, 22], [62, 22]][i];
        return {
          enunciado: [
            `Si en el mundo se generaron ${total} millones de toneladas de basura electrónica y se recicló de forma documentada el ${pct} %, ¿cuántos millones de toneladas se reciclaron? Redondeá a un decimal.`,
            `De ${total} millones de toneladas de aparatos descartados, el ${pct} % se recicló de forma documentada. ¿Cuántos millones de toneladas son? Redondeá a un decimal.`,
            `¿Cuántos millones de toneladas de basura electrónica se reciclaron de forma documentada, si fueron el ${pct} % de ${total} millones? Redondeá a un decimal.`,
          ][i],
          valor: Math.round(total * pct / 10) / 10,
          unidad: 'millones de toneladas',
          dec: 1,
          tol: 0.1,
          explicacion: `${total} × ${pct} % ≈ ${(Math.round(total * pct / 10) / 10).toLocaleString('es-AR')} millones de toneladas. La mayor parte de la basura electrónica todavía no tiene un destino documentado.`,
          ctx: `${total} millones de toneladas; ${pct} % reciclado.`,
        };
      }, { d: 1 }),
      numv(3, (i) => { // e6b
        const [n, kg, pct] = [[600, 8, 70], [1000, 8, 70], [400, 9, 65]][i];
        return {
          enunciado: `Si cada neumático de auto pesa unos ${kg} kg y alrededor del ${pct} % es caucho recuperable, ¿cuántos kilos de caucho se pueden recuperar de ${n} neumáticos?`,
          valor: Math.round(n * kg * pct / 100),
          unidad: 'kg',
          tol: 1,
          explicacion: `${n} × ${kg} × ${pct} % = ${Math.round(n * kg * pct / 100).toLocaleString('es-AR')} kg de caucho, que puede convertirse en pisos, baldosas o asfalto. Valores aproximados de ejemplo.`,
          ctx: `${n} neumáticos; ${kg} kg cada uno; ${pct} % de caucho.`,
        };
      }, { d: 2 }),
      teoria('Responsabilidad extendida del productor', [
        'En muchos países, los residuos especiales como neumáticos, aceites, pilas y aparatos tienen sistemas de responsabilidad extendida del productor: quienes los ponen en el mercado deben organizar y financiar su recolección y tratamiento, a veces con un cargo incluido en el precio. Así, el costo de gestionar el residuo queda en el producto y no en los municipios ni en el ambiente.',
      ]),
      vf('Con la responsabilidad extendida del productor, el costo de gestionar un residuo especial queda en el producto, y no en el municipio.', true, 'El productor organiza y financia la recolección y el tratamiento. Además, tiene incentivos para diseñar productos más fáciles de recuperar.', { // e7
        razones: ['+Porque el productor financia la gestión del residuo', '-Porque los residuos especiales desaparecen solos', '-Porque el municipio paga el doble'],
        d: 2,
      }),
      rank('Ordená estas opciones para un celular viejo que todavía funciona, de la mejor a la peor.', [ // e8
        ['Seguir usándolo o dárselo a alguien que lo use', 'la mejor'],
        ['Entregarlo para reacondicionar', 'muy buena'],
        ['Llevarlo a un punto de reciclaje de electrónicos', 'buena'],
        ['Tirarlo con la basura común', 'la peor'],
      ], 'Primero alargar la vida; el reciclaje, al final; la basura común, nunca.', { d: 1, extremos: ['Mejor', 'Peor'] }),
      det('Leé este volante municipal y marcá los errores.', [ // e9
        ['Los neumáticos viejos pueden convertirse en caucho granulado.', false],
        ['Quemar neumáticos es una buena forma de eliminarlos.', true, 'Libera humo con sustancias tóxicas.'],
        ['Los aparatos electrónicos tienen metales valiosos y sustancias peligrosas.', false],
        ['El aceite de motor usado puede tirarse en la rejilla si se diluye.', true, 'Contamina igual: debe ir a un circuito controlado.'],
      ], 'Los residuos especiales tienen soluciones: el problema es que lleguen a ellas.', { d: 2 }),
      comp('Completá.', 'Los neumáticos acumulados crían mosquitos del [dengue]; el aceite de motor usado puede [regenerarse] para volver a ser lubricante; y que el fabricante financie la gestión del residuo es responsabilidad [extendida].', ['resfrío', 'evaporarse', 'limitada'], 'Tres ideas sobre los residuos especiales con valor.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: residuos peligrosos y especiales', 'Características, cadena de custodia, peligrosos del hogar, campo, salud, industria y residuos especiales, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el punto limpio del barrio', 'Un municipio quiere abrir un punto limpio para los residuos peligrosos y especiales de los hogares. Diseñalo con los datos.', [
      teoria('Los datos', [
        'La ciudad tiene 30.000 hogares. Una encuesta estima que, por año, cada hogar descarta en promedio 12 pilas, 2 lámparas de bajo consumo, 1 litro de aceite de motor y medio litro de restos de pinturas y solventes. Hoy casi todo va a la basura común. Hay una gomería con 600 neumáticos acumulados al aire libre y una cooperativa de reciclaje interesada en recibir aparatos electrónicos.',
      ]),
      num('¿Cuántas pilas por año descartan en total los hogares de la ciudad?', 360000, 'pilas', '30.000 × 12 = 360.000 pilas por año. Un volumen que justifica un circuito especial.', { ctx: '30.000 hogares; 12 pilas por hogar por año.', d: 1 }),
      num('¿Cuántos litros de aceite de motor usado descartan por año los hogares?', 30000, 'litros', '30.000 × 1 litro = 30.000 litros por año, que hoy terminan en la tierra, los desagües o la basura.', { ctx: '30.000 hogares; 1 litro por hogar por año.', d: 1 }),
      mult('¿Qué debería tener el punto limpio? Marcá todo.', [ // e3
        '+Recipientes separados para cada tipo de residuo',
        '+Techo, piso impermeable y contención de derrames',
        '+Personal capacitado',
        '+Convenios con operadores habilitados para cada residuo',
        '-Un solo contenedor para mezclar todo',
      ], 'Un punto limpio mal diseñado puede convertirse en un foco de contaminación.', { d: 2 }),
      op('¿Qué conviene hacer primero con los 600 neumáticos acumulados de la gomería?', [ // e4
        'Retirarlos a un circuito de reciclaje antes de las lluvias',
        'Quemarlos en el mismo terreno para ahorrar el traslado',
        ['Esperar a que la gomería cierre', 'Mientras tanto siguen criando mosquitos.'],
        'Cubrirlos con una lona sin retirarlos',
      ], 'Retirarlos antes de la temporada de lluvias elimina criaderos de mosquitos.', { d: 2 }),
      clas('¿A qué circuito va cada residuo que llega al punto limpio?', { // e5
        'Operador de residuos peligrosos': ['Pilas', 'Lámparas de bajo consumo', 'Restos de pinturas y solventes'],
        'Regeneración o recolección de aceites': ['Aceite de motor usado'],
        'Cooperativa de reciclaje de electrónicos': ['Computadoras viejas', 'Celulares descartados'],
      }, 'Cada residuo tiene su operador: el punto limpio es el primer eslabón de la cadena.', { d: 2 }),
      vf('Como los hogares generan pocas cantidades, no hace falta llevar manifiestos ni trazabilidad desde el punto limpio.', false, 'Sumados, son toneladas. Desde el punto limpio, los residuos peligrosos deben seguir el circuito controlado, con transportistas y operadores habilitados.', { // e6
        razones: ['+Porque sumados son grandes volúmenes que deben seguir el circuito', '-Porque los residuos del hogar no son peligrosos', '-Porque el punto limpio los elimina en el lugar'],
        d: 2,
      }),
      det('El municipio redacta el proyecto. Marcá lo que conviene corregir.', [ // e7
        ['Habrá recipientes separados y personal capacitado.', false],
        ['Juntaremos pinturas, solventes y lavandina en un mismo tambor.', true, 'Mezclar puede provocar reacciones peligrosas: cada residuo va separado.'],
        ['Firmaremos convenios con operadores habilitados.', false],
        ['No informaremos a los vecinos para no generar filas.', true, 'Sin comunicación, el punto limpio no se usa.'],
      ], 'Un punto limpio funciona si es seguro, está bien conectado con los operadores y la gente lo conoce.', { d: 3 }),
    ]),
  ],
});
