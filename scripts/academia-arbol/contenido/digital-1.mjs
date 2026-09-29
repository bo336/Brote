import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// DIGITAL 1 — La huella de lo digital.
// La base de la rama: internet es física, cuánta energía usa lo digital,
// dónde está la huella de los dispositivos, qué pasa con la basura
// electrónica y qué hábitos digitales pesan de verdad. Retoma energía y kWh
// (tronco-2) y el ciclo de vida de los productos (consumo-1 si ya la
// hiciste).

export default unidad({
  slug: 'digital-1',
  rama: 'digital',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'La huella de lo digital',
  bajada: 'La nube no está en el cielo: son cables, edificios llenos de computadoras y millones de dispositivos. Cuánto pesa lo digital y qué hábitos importan de verdad.',
  objetivos: [
    'Describir la infraestructura física que sostiene internet',
    'Dimensionar el consumo de energía de centros de datos, redes y dispositivos',
    'Explicar por qué la mayor huella de los dispositivos está en su fabricación',
    'Reconocer los riesgos y el valor de la basura electrónica',
    'Distinguir los hábitos digitales de mucho y de poco impacto',
  ],
  repasa: ['tronco-2', 'tronco-3'],
  fuentes: ['iea-datacenters', 'iea-streaming', 'ewaste-monitor', 'carbon-brief'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Internet es física', 'Cables submarinos, centros de datos, antenas y dispositivos: lo que hay detrás de un mensaje.', [
      teoria('La nube tiene cables', [
        'Cuando mandamos un mensaje o miramos un video, los datos viajan por una infraestructura física enorme: el dispositivo se conecta por wifi o por la red móvil a una antena o un router; de ahí, por cables de fibra óptica, llegan a centros de datos donde están guardados los contenidos. Entre continentes, casi todo el tráfico de internet viaja por cables submarinos.',
        'Los centros de datos son edificios llenos de servidores —computadoras que funcionan todo el día— que necesitan electricidad para funcionar y para enfriarse.',
      ]),
      ord('Ordená el recorrido de un video que mirás en el celular.', [ // e1
        'El video está guardado en un servidor de un centro de datos',
        'Viaja por cables de fibra óptica',
        'Llega a la antena o al router de tu casa',
        'Se transmite por wifi o red móvil a tu celular',
        'Tu celular lo muestra en la pantalla',
      ], 'Cinco eslabones físicos, cada uno con su consumo de energía.', { d: 1, extremos: ['Primero', 'Último'] }),
      par('Uní cada parte de la infraestructura con lo que hace.', [ // e2
        ['Centro de datos', 'Guarda y procesa la información'],
        ['Cable submarino', 'Conecta continentes'],
        ['Antena de telefonía', 'Conecta los celulares a la red'],
        ['Router', 'Distribuye internet dentro de una casa'],
      ], 'La "nube" es un nombre lindo para una infraestructura muy concreta.', { d: 1 }),
      vf('La nube es un espacio virtual que no usa recursos físicos.', false, 'La nube son centros de datos reales, con miles de servidores que usan electricidad, agua para enfriamiento y materiales para fabricarse.', { // e3
        razones: ['+Porque son centros de datos reales que usan energía y materiales', '-Porque los datos flotan en el aire', '-Porque la nube funciona con energía solar gratis siempre'],
        d: 1,
      }),
      teoria('Las tres partes de la huella digital', [
        'La huella de lo digital tiene tres grandes partes: los dispositivos (celulares, computadoras, televisores, consolas), las redes que transmiten los datos, y los centros de datos que los guardan y procesan.',
        'De las tres, la que más pesa para una persona suele ser la fabricación de sus propios dispositivos, como vas a ver en esta unidad.',
      ]),
      clas('¿A qué parte de la huella digital pertenece cada cosa?', { // e4
        'Dispositivos': ['Tu celular', 'La notebook', 'El televisor inteligente'],
        'Redes': ['La antena de telefonía', 'La fibra óptica del barrio'],
        'Centros de datos': ['Los servidores de una plataforma de video', 'El almacenamiento de tus fotos en la nube'],
      }, 'Tres partes con impactos distintos. Saber cuál pesa más ordena las decisiones.', { d: 2 }),
      cad('Armá la cadena de por qué un centro de datos necesita tanta electricidad.', [ // e5
        'Miles de servidores funcionan las 24 horas',
        'Consumen electricidad y generan mucho calor',
        'Hace falta enfriarlos constantemente',
        'El enfriamiento suma todavía más consumo',
      ], ['Los servidores se apagan de noche para ahorrar'], 'Energía para calcular y energía para enfriar: las dos grandes cuentas de un centro de datos.', { d: 2 }),
      mult('¿Qué recursos usa un centro de datos? Marcá todos.', [ // e6
        '+Electricidad',
        '+Agua para refrigeración, en muchos casos',
        '+Materiales para fabricar servidores',
        '+Terreno para el edificio',
        '-Ningún recurso, porque es virtual',
      ], 'Lo digital tiene una base muy material, aunque no se vea.', { d: 1 }),
      op('¿Por qué casi todo el tráfico de internet entre continentes viaja por cables submarinos y no por satélites?', [ // e7
        'Porque transmiten muchos más datos',
        'Porque los satélites no pueden transmitir ningún dato',
        ['Porque los cables no usan energía', 'Usan energía, pero transmiten enormes volúmenes con menos demora que los satélites.'],
        'Porque el agua del mar acelera los datos',
      ], 'La fibra óptica submarina tiene una capacidad enorme. Los satélites sirven, sobre todo, donde no llegan los cables.', { d: 2 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['Los datos viajan por cables de fibra óptica.', false],
        ['La nube no tiene impacto ambiental porque es invisible.', true, 'Son centros de datos físicos que usan energía, agua y materiales.'],
        ['Los centros de datos necesitan refrigeración.', false],
        ['Los satélites llevan casi todo el tráfico entre continentes.', true, 'Casi todo viaja por cables submarinos.'],
      ], 'Lo digital no es inmaterial: tiene cables, edificios y aparatos.', { d: 2 }),
      comp('Completá.', 'La nube está formada por centros de [datos]; entre continentes, internet viaja por cables [submarinos].', ['nubes', 'aéreos'], 'La infraestructura física de internet, en una línea.', { d: 1 }),
      rank('Ordená estos eslabones según su distancia a vos, del más cercano al más lejano.', [ // e10
        ['Tu celular', 'en tu mano'],
        ['El router de tu casa', 'a pocos metros'],
        ['La central del proveedor de internet', 'en tu ciudad'],
        ['El centro de datos', 'puede estar en otro país'],
      ], 'Cada clic recorre una cadena física que puede cruzar el planeta.', { d: 1, extremos: ['Más cercano', 'Más lejano'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Cuánta energía usa lo digital', 'Centros de datos, redes y streaming: los números reales y los mitos.', [
      teoria('Los números globales', [
        'Según la Agencia Internacional de Energía, en 2024 los centros de datos del mundo consumieron alrededor de 415 teravatios-hora de electricidad, cerca del 1,5 % de la electricidad mundial. Las redes de datos consumen una cantidad parecida. Y el consumo de los centros de datos está creciendo rápido, sobre todo por la inteligencia artificial.',
        'Para comparar: Argentina entera consume alrededor de 140 teravatios-hora por año.',
      ], { destacado: { valor: '≈ 1,5 %', texto: 'de la electricidad mundial consumieron los centros de datos en 2024, según la Agencia Internacional de Energía.' } }),
      numv(3, (i) => { // e1
        const dc = 415;
        const pais = ['Argentina', 'Chile', 'Uruguay'][i];
        const ar = [140, 85, 12][i];
        return {
          enunciado: `Los centros de datos del mundo consumieron unos ${dc} TWh en 2024 y ${pais} consume unos ${ar} TWh de electricidad por año. ¿Cuántas veces el consumo de ${pais} es el de los centros de datos? Redondeá a un decimal.`,
          valor: Math.round((dc / ar) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${dc} ÷ ${ar} ≈ ${(Math.round((dc / ar) * 10) / 10).toLocaleString('es-AR')} veces. Una forma de dimensionar un número enorme comparándolo con algo conocido.`,
        };
      }, { d: 2 }),
      teoria('El streaming', [
        'Hubo titulares que decían que mirar media hora de video emitía kilos de CO₂. Eran exageraciones basadas en cálculos equivocados. La Agencia Internacional de Energía estimó que una hora de video en streaming usa alrededor de 0,08 kWh en todo el recorrido —centro de datos, redes y dispositivo— y emite unos 36 gramos de CO₂ con la mezcla eléctrica promedio del mundo.',
        'Es poco por hora, aunque, multiplicado por miles de millones de horas, suma. Y el dispositivo que se usa pesa: un televisor grande consume mucho más que un celular.',
      ]),
      est('Estimá cuántos gramos de CO₂ emite una hora de streaming de video, según la Agencia Internacional de Energía (promedio mundial).', 36, { min: 1, max: 5000, unidad: 'g', escala: 'log' }, 'Alrededor de 36 gramos. Los titulares que hablaban de kilos por media hora eran exagerados.', { d: 3 }),
      numv(3, (i) => { // e3
        const h = [2, 3, 4][i];
        return {
          enunciado: `Una persona mira ${h} horas de video por día. Con 36 g de CO₂ por hora, ¿cuántos kg emite en un año de 365 días? Redondeá a un decimal.`,
          valor: Math.round(((h * 36 * 365) / 1000) * 10) / 10,
          unidad: 'kg de CO₂',
          dec: 1,
          tol: 0.2,
          explicacion: `${h} × 36 × 365 = ${(h * 36 * 365).toLocaleString('es-AR')} g ≈ ${(Math.round(((h * 36 * 365) / 1000) * 10) / 10).toLocaleString('es-AR')} kg por año. Comparalo con los ~ 500 kg por año de ir 12 km diarios solo en auto.`,
        };
      }, { d: 2 }),
      rank('Ordená estas actividades por emisiones típicas, de más a menos.', [ // e4
        ['Un vuelo de 1.000 km ida y vuelta', '≈ 500 kg de CO₂e'],
        ['Un año yendo 12 km diarios solo en auto', '≈ 500 kg de CO₂e'],
        ['Un año mirando 2 horas de video por día', '≈ 26 kg de CO₂'],
        ['Mandar un mail', 'unos pocos gramos'],
      ], 'Los órdenes de magnitud del tronco: lo digital suma, pero pesa mucho menos que volar o manejar.', { d: 3 }),
      vf('Mirar media hora de video emite varios kilos de CO₂.', false, 'Era un cálculo exagerado. Según la Agencia Internacional de Energía, una hora emite unos 36 gramos con la mezcla eléctrica promedio del mundo.', { // e5
        razones: ['+Porque esos cálculos fueron corregidos: son decenas de gramos por hora', '-Porque el video no usa electricidad', '-Porque el video emite toneladas por minuto'],
        d: 2,
      }),
      teoria('La inteligencia artificial', [
        'Entrenar y usar grandes modelos de inteligencia artificial requiere muchísimo cálculo, y por eso mucha electricidad. La Agencia Internacional de Energía proyecta que el consumo de los centros de datos podría más que duplicarse hacia 2030, impulsado en buena parte por la inteligencia artificial.',
        'Que ese crecimiento se cubra con energía limpia o con combustibles fósiles es una de las grandes preguntas energéticas de esta década.',
      ]),
      cad('Armá la cadena de cómo el crecimiento de la inteligencia artificial afecta al sistema eléctrico.', [ // e6
        'Se usan cada vez más modelos de inteligencia artificial',
        'Hacen falta más centros de datos y más cálculo',
        'Aumenta la demanda de electricidad',
        'Hay que generar más electricidad',
        'Las emisiones dependen de si esa electricidad es limpia',
      ], ['La inteligencia artificial produce su propia energía'], 'La huella de la IA depende de cuánto crece y de cómo se genera su electricidad.', { d: 2 }),
      clas('¿Qué parte de la huella digital pesa más en cada caso?', { // e7
        'La fabricación del dispositivo': ['Un celular usado dos años', 'Una notebook nueva'],
        'La electricidad de uso': ['Un televisor grande encendido muchas horas', 'Una consola de juegos siempre encendida'],
      }, 'Los aparatos chicos tienen su huella en la fabricación; los grandes que están siempre encendidos, en el uso.', { d: 3 }),
      par('Uní cada número con lo que mide.', [
        ['≈ 415 TWh', 'Consumo de los centros de datos del mundo en 2024'],
        ['≈ 140 TWh', 'Consumo eléctrico anual de Argentina'],
        ['≈ 36 g', 'CO₂ de una hora de video en streaming'],
        ['≈ 1,5 %', 'Parte de la electricidad mundial que usan los centros de datos'],
      ], 'Cuatro números para ubicar lo digital en su escala real.', { d: 2 }),
      op('Mirando la misma serie una hora, ¿qué aparato hace que el consumo sea mayor?', [
        'Un televisor grande',
        'Un celular',
        ['Una tablet chica', 'Las pantallas chicas consumen mucho menos que un televisor grande.'],
        'Un reloj inteligente',
      ], 'El dispositivo pesa en el consumo del streaming: un televisor grande consume muchas veces más que un celular.', { d: 1 }),
      det('Leé este titular y marcá lo exagerado o equivocado.', [ // e8
        ['Los centros de datos usan alrededor del 1,5 % de la electricidad mundial.', false],
        ['Mirar una serie contamina más que un viaje en avión.', true, 'Un vuelo emite cientos de kilos; una hora de video, unos 36 gramos.'],
        ['El consumo de los centros de datos crece por la inteligencia artificial.', false],
        ['Lo digital no tiene ningún impacto ambiental.', true, 'Tiene impacto, aunque cada actividad individual sea chica.'],
      ], 'Ni exagerar ni ignorar: la clave es dimensionar con datos.', { d: 2 }),
      comp('Completá.', 'Los centros de datos usan alrededor del [1,5] % de la electricidad mundial; una hora de video emite unos [36] gramos de CO₂.', ['15', '3.600'], 'Dos números para dimensionar lo digital sin exagerar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Dispositivos: la huella está en fabricarlos', 'Por qué el celular que ya tenés es el más sustentable, y cuántos aparatos hay en una casa.', [
      teoria('Muchos aparatos por casa', [
        'Hoy una casa típica puede tener varios celulares, una o dos computadoras, televisores, tablets, consolas, parlantes inteligentes, relojes y routers. Cada uno se fabricó con minerales, energía y agua, y tiene su huella antes de encenderse por primera vez.',
        'Como viste en la rama de Consumo, en celulares y notebooks la mayor parte de la huella de carbono de toda su vida está en la fabricación.',
      ]),
      numv(3, (i) => { // e1
        const cel = [4, 3, 5][i];
        const kg = [70, 60, 80][i];
        return {
          enunciado: `En una casa hay ${cel} celulares. Si fabricar cada uno emite unos ${kg} kg de CO₂e, ¿cuántos kg suma la fabricación de todos?`,
          valor: cel * kg,
          unidad: 'kg CO₂e',
          explicacion: `${cel} × ${kg} = ${cel * kg} kg CO₂e solo en fabricar los celulares. Por eso cambiarlos seguido multiplica la huella.`,
        };
      }, { d: 1 }),
      teoria('Cuánto dura un celular', [
        'Muchas personas cambian el celular cada dos o tres años, aunque podría durar más. Pasar de dos a cuatro años de uso reduce casi a la mitad la huella de fabricación por año. Cambiar la batería, usar funda y protector, y mantener el sistema actualizado ayudan a estirar su vida.',
      ]),
      numv(3, (i) => { // e2
        const kg = [70, 60, 80][i];
        return {
          enunciado: `Fabricar un celular emite ${kg} kg de CO₂e. ¿Cuántos kg por año de uso se ahorran si se usa 4 años en lugar de 2?`,
          valor: kg / 2 - kg / 4,
          unidad: 'kg por año',
          dec: 1,
          explicacion: `Con 2 años: ${kg} ÷ 2 = ${kg / 2} kg por año. Con 4 años: ${kg} ÷ 4 = ${kg / 4}. Se ahorran ${kg / 2 - kg / 4} kg por año.`,
        };
      }, { d: 2 }),
      vf('Comprar un celular nuevo más eficiente reduce la huella porque consume menos batería.', false, 'El ahorro en la carga es mínimo comparado con la huella de fabricar uno nuevo. Para los celulares, lo más sustentable es usar más tiempo el que ya se tiene.', { // e3
        razones: ['+Porque la fabricación pesa mucho más que la carga', '-Porque los celulares nuevos no se fabrican', '-Porque la batería es la parte más contaminante del uso'],
        d: 2,
      }),
      mult('¿Qué alarga la vida de un dispositivo? Marcá todo.', [ // e4
        '+Funda y protector de pantalla',
        '+Cambiar la batería cuando se gasta',
        '+Mantener el sistema actualizado',
        '+Liberar espacio en lugar de cambiar el aparato',
        '-Cambiarlo cuando sale un modelo nuevo',
      ], 'Cuidar, mantener y reparar son las mejores decisiones digitales.', { d: 1 }),
      teoria('Segunda vida', [
        'Cuando un celular o una computadora ya no sirve para quien lo tenía, muchas veces sirve para otra persona: un familiar, una escuela, una organización. También existen equipos reacondicionados, revisados y con garantía, que cuestan menos y evitan fabricar uno nuevo.',
      ]),
      ord('Ordená qué conviene hacer con un celular que ya no usás, de la mejor a la última opción.', [ // e5
        'Seguir usándolo si funciona',
        'Dárselo a alguien que lo necesite',
        'Venderlo o entregarlo para reacondicionar',
        'Llevarlo a un punto de reciclaje de electrónicos',
      ], 'La jerarquía de siempre: usar, reutilizar y, al final, reciclar.', { d: 2, extremos: ['Mejor', 'Última opción'] }),
      clas('¿Esta acción reduce la huella de los dispositivos de una casa o la aumenta?', { // e6
        'La reduce': ['Compartir una tablet entre hermanos', 'Comprar una notebook reacondicionada', 'Arreglar el puerto de carga'],
        'La aumenta': ['Un celular nuevo cada año para cada integrante', 'Guardar celulares viejos en un cajón para siempre', 'Tirar los aparatos rotos con la basura común'],
      }, 'Menos aparatos, más años de uso y un buen destino final.', { d: 2 }),
      op('Tu celular de tres años funciona bien pero la batería dura poco. ¿Qué conviene?', [ // e7
        'Cambiar la batería',
        'Comprar uno nuevo del mismo modelo',
        ['Cargarlo menos veces para cuidarlo', 'No resuelve que la batería esté gastada.'],
        'Guardarlo y comprar uno nuevo',
      ], 'Una batería nueva cuesta una fracción del aparato y puede darle dos o tres años más de vida.', { d: 1 }),
      det('Leé este consejo y marcá lo equivocado.', [ // e8
        ['Usar el celular más años reduce su huella anual.', false],
        ['Guardar el celular viejo en un cajón es tan bueno como reciclarlo.', true, 'En un cajón no sirve a nadie: conviene darlo, venderlo o reciclarlo.'],
        ['Los equipos reacondicionados evitan fabricar uno nuevo.', false],
        ['Cambiar la batería no vale la pena, conviene un celular nuevo.', true, 'Cambiar la batería alarga la vida útil con una fracción del impacto.'],
      ], 'La decisión digital más importante es cuánto dura cada aparato.', { d: 2 }),
      comp('Completá.', 'En un celular, la mayor parte de la huella está en su [fabricación]; usarlo el [doble] de años reduce casi a la mitad su huella anual.', ['carga', 'triple'], 'La idea central sobre la huella de los dispositivos.', { d: 1 }),
      est('Estimá cuántos años conviene usar, como mínimo, un celular para que su huella de fabricación por año sea la mitad que si se usara 2 años.', 4, { min: 1, max: 10, paso: 1, unidad: 'años' }, 'Cuatro años: la huella de fabricación se reparte entre el doble de años. Y cada año más la sigue diluyendo.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('La basura electrónica', 'Metales valiosos y sustancias peligrosas: qué tiene un aparato viejo y adónde tiene que ir.', [
      teoria('El residuo que más crece', [
        'Los residuos de aparatos eléctricos y electrónicos (RAEE) son todo lo que tiene enchufe o pilas y se descarta: celulares, computadoras, cargadores, electrodomésticos, juguetes con pilas. Según el Monitor Mundial de Residuos Electrónicos, en 2022 se generaron unos 62 millones de toneladas en el mundo, alrededor de 7,8 kg por persona, y solo un 22 % se recolectó y recicló de forma documentada.',
        'Es uno de los tipos de residuos que más rápido crece.',
      ], { destacado: { valor: '≈ 22 %', texto: 'de la basura electrónica del mundo se recolectó y recicló de forma documentada en 2022.' } }),
      est('Estimá cuántos kilos de basura electrónica por persona se generaron en el mundo en 2022.', 7.8, { min: 0.1, max: 100, unidad: 'kg', escala: 'log' }, 'Alrededor de 7,8 kg por persona, según el Monitor Mundial de Residuos Electrónicos. Mucho más en los países de altos ingresos.', { d: 3 }),
      teoria('Lo valioso y lo peligroso', [
        'Un aparato electrónico tiene metales valiosos —cobre, oro, plata, paladio— que se pueden recuperar, y también sustancias peligrosas, como plomo, mercurio, cadmio y retardantes de llama. Si se tira con la basura común o se quema, esas sustancias pueden contaminar el suelo, el agua y el aire, y dañar la salud de quienes manipulan los residuos.',
        'Las baterías de litio, además, pueden incendiarse si se aplastan en un camión o en un relleno.',
      ]),
      clas('¿Es un material valioso para recuperar o una sustancia peligrosa?', { // e1
        'Valioso': ['Cobre', 'Oro', 'Plata'],
        'Peligroso': ['Plomo', 'Mercurio', 'Cadmio'],
      }, 'La basura electrónica es a la vez un tesoro y un riesgo. Todo depende de adónde va.', { d: 2 }),
      cad('Armá la cadena de qué puede pasar si una batería de litio va a la basura común.', [ // e2
        'Se tira una batería de litio con la basura común',
        'El camión compactador la aplasta',
        'La batería se daña y se calienta',
        'Puede iniciar un incendio en el camión o en el relleno',
      ], ['La batería se descarga sola y desaparece'], 'Las baterías de litio nunca van a la basura común: tienen que ir a puntos de recolección.', { d: 2 }),
      vf('Un celular viejo se puede tirar con la basura común sin problema.', false, 'Tiene sustancias peligrosas y una batería que puede incendiarse, además de metales valiosos que se pierden. Tiene que ir a un punto de recolección de electrónicos.', { // e3
        razones: ['+Porque tiene sustancias peligrosas y metales recuperables', '-Porque los celulares se descomponen en semanas', '-Porque la basura común separa los celulares automáticamente'],
        d: 1,
      }),
      num('Si se generaron 62 millones de toneladas de basura electrónica y se recicló de forma documentada el 22 %, ¿cuántos millones de toneladas se reciclaron? Redondeá a un decimal.', 13.6, 'millones de toneladas', '62 × 22 ÷ 100 ≈ 13,6 millones de toneladas. El resto, más de 48 millones, no tuvo un destino documentado.', { dec: 1, tol: 0.1, d: 2 }),
      teoria('Adónde llevarla', [
        'Muchos municipios tienen puntos verdes o campañas de recolección de electrónicos y pilas. Algunos comercios y fabricantes reciben aparatos viejos. Antes de entregar un celular o una computadora, conviene borrar los datos personales.',
        'En varios lugares, cooperativas y empresas especializadas desarman los aparatos, recuperan los metales y tratan de forma segura las sustancias peligrosas.',
      ]),
      ord('Ordená los pasos para desprenderte bien de una notebook vieja.', [ // e5
        'Evaluar si alguien puede seguir usándola',
        'Hacer una copia de tus archivos',
        'Borrar tus datos personales',
        'Entregarla para reutilizar o en un punto de recolección de electrónicos',
      ], 'Primero reutilizar; si no se puede, reciclar bien y cuidando tus datos.', { d: 2, extremos: ['Primero', 'Último'] }),
      mult('¿Qué cosas son residuos electrónicos que no van a la basura común? Marcá todas.', [ // e6
        '+Cargadores viejos',
        '+Pilas y baterías',
        '+Auriculares rotos',
        '+Un secador de pelo roto',
        '-Una caja de cartón del celular',
      ], 'Todo lo que tuvo enchufe o pilas es RAEE. La caja de cartón va con los reciclables de papel.', { d: 1 }),
      rank('Ordená estos destinos para un celular roto, del mejor al peor.', [
        ['Repararlo y seguir usándolo', 'el mejor'],
        ['Llevarlo a un punto de recolección de electrónicos', 'bueno'],
        ['Guardarlo años en un cajón', 'malo'],
        ['Tirarlo con la basura común', 'muy malo'],
      ], 'Reparar primero; si no, reciclar bien. El cajón y la basura desperdician materiales valiosos.', { d: 2, extremos: ['Mejor', 'Peor'] }),
      vf('Antes de entregar un celular para reciclar o donar, conviene borrar tus datos personales.', true, 'Así se protege tu información. Se hace una copia de lo que quieras conservar y se restablece el equipo de fábrica.', {
        razones: ['+Porque así se protege tu información personal', '-Porque los datos hacen más pesado el celular', '-Porque sin borrar los datos no se puede reciclar el cobre'],
        d: 1,
      }),
      det('Leé estos consejos y marcá los equivocados.', [ // e7
        ['Llevá las pilas a un punto de recolección.', false],
        ['Quemá los cables viejos para sacar el cobre.', true, 'Quemar cables libera humos tóxicos: es peligroso y contaminante.'],
        ['Borrá tus datos antes de entregar un celular.', false],
        ['Las baterías de litio van con la basura común.', true, 'Pueden incendiarse: van a puntos de recolección.'],
      ], 'Un buen destino protege el ambiente, la salud de los trabajadores y tus datos.', { d: 2 }),
      comp('Completá.', 'Los residuos de aparatos con enchufe o pilas se llaman [RAEE]; solo un [22] % de la basura electrónica del mundo se recicla de forma documentada.', ['RSU', '80'], 'Dos datos clave sobre la basura electrónica.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Hábitos digitales que importan', 'Borrar mails, bajar la resolución, apagar el router o conservar el celular: qué pesa y qué casi no.', [
      teoria('Ordenar por impacto', [
        'Hay muchos consejos sobre "higiene digital": borrar mails, no guardar fotos repetidas, bajar la calidad del video. Tienen algún efecto, pero chico comparado con otras decisiones. Lo que más pesa en la huella digital de una persona es cuántos aparatos tiene y cuánto le duran, y cuánto tiempo están encendidos los aparatos grandes, como televisores y consolas.',
        'Como en el tronco: primero lo grande, después lo chico.',
      ]),
      rank('Ordená estos hábitos digitales por su efecto en la huella, de mayor a menor.', [ // e1
        ['Usar el celular 4 años en vez de 2', 'efecto grande'],
        ['Apagar el televisor y la consola cuando no se usan', 'efecto moderado'],
        ['Mirar video en calidad estándar en vez de 4K', 'efecto chico'],
        ['Borrar mails viejos', 'efecto muy chico'],
      ], 'La duración de los dispositivos pesa mucho más que la limpieza de la bandeja de entrada.', { d: 3 }),
      vf('Borrar todos los mails viejos es una de las acciones más efectivas para el clima.', false, 'Tiene un efecto muy chico. Usar los dispositivos más años o cambiar un hábito de transporte pesan muchísimo más.', { // e2
        razones: ['+Porque su efecto es muy chico comparado con otras acciones', '-Porque los mails no se guardan en ningún lado', '-Porque borrar mails aumenta las emisiones'],
        d: 2,
      }),
      teoria('El stand-by digital', [
        'Televisores, decodificadores, consolas y parlantes inteligentes pueden consumir energía aunque parezcan apagados. Una consola que queda en modo de encendido rápido puede consumir bastante más que en apagado total. Como viste en la rama de Energía, el stand-by suma a lo largo del año.',
      ]),
      numv(3, (i) => { // e3
        const w = [15, 10, 20][i];
        return {
          enunciado: `Una consola en modo de encendido rápido consume ${w} W las 20 horas del día que no se usa. ¿Cuántos kWh usa por año así? Redondeá al entero.`,
          valor: Math.round((w / 1000) * 20 * 365),
          unidad: 'kWh',
          tol: 1,
          explicacion: `${(w / 1000).toLocaleString('es-AR')} kW × 20 h × 365 ≈ ${Math.round((w / 1000) * 20 * 365)} kWh por año, sin usarla. Apagarla del todo evita casi todo ese consumo.`,
        };
      }, { d: 2 }),
      clas('¿Este hábito tiene un efecto grande o chico sobre la huella digital?', { // e4
        'Grande': ['Cambiar el celular cada 4 años en lugar de cada año', 'No tener un televisor en cada habitación', 'Comprar una notebook reacondicionada'],
        'Chico': ['Borrar fotos repetidas de la nube', 'Mandar menos mails de "gracias"', 'Usar el modo oscuro en el celular'],
      }, 'Los hábitos chicos no están mal, pero no reemplazan a los grandes.', { d: 2 }),
      teoria('Lo digital que ahorra', [
        'Lo digital también puede ahorrar mucho: una videollamada en lugar de un vuelo de negocios, trabajar desde casa algunos días en lugar de viajar en auto, una factura electrónica en lugar de una en papel que se imprime y se transporta. En esos casos, la huella digital es muy chica comparada con lo que se evita.',
      ]),
      numv(3, (i) => { // e5
        const km = [1000, 700, 1500][i];
        return {
          enunciado: `Una reunión presencial requiere un vuelo de ida y vuelta de ${km.toLocaleString('es-AR')} km por tramo (246 g por km). Una videollamada de 2 horas emite unos 100 g. ¿Cuántos kg de CO₂e se ahorran con la videollamada? Redondeá al entero.`,
          valor: Math.round((2 * km * 246 - 100) / 1000),
          unidad: 'kg CO₂e',
          tol: 1,
          explicacion: `Vuelo: 2 × ${km.toLocaleString('es-AR')} × 246 = ${(2 * km * 246).toLocaleString('es-AR')} g. Menos 100 g de la videollamada: se ahorran unos ${Math.round((2 * km * 246 - 100) / 1000)} kg.`,
        };
      }, { d: 3 }),
      cad('Armá la cadena de cómo el trabajo remoto algunos días puede bajar emisiones.', [ // e6
        'Una persona trabaja desde casa dos días por semana',
        'Deja de viajar en auto esos días',
        'Ahorra el combustible de esos viajes',
        'Su huella baja mucho más de lo que suma la videollamada',
      ], ['La computadora de casa emite más que el auto'], 'Pero ojo: si trabajar desde casa implica calefaccionar toda la casa todo el día, parte del ahorro se pierde. Siempre hay que mirar el sistema completo.', { d: 2 }),
      mult('¿Qué hábitos digitales valen la pena? Marcá todos.', [ // e7
        '+Usar los dispositivos el mayor tiempo posible',
        '+Apagar del todo televisores y consolas',
        '+Evitar tener aparatos duplicados que no se usan',
        '+Reemplazar viajes largos por videollamadas cuando se puede',
        '-Comprar un parlante inteligente para cada habitación',
      ], 'Menos aparatos, más años de uso, menos stand-by y viajes evitados.', { d: 2 }),
      op('Mirando lo mismo durante una hora, ¿qué consume más energía?', [
        'Un televisor de 55 pulgadas',
        'Un celular',
        ['Una notebook con la pantalla al mínimo', 'Consume más que un celular, pero bastante menos que un televisor grande.'],
        'Un parlante chico con radio',
      ], 'La pantalla grande es la que más consume. Mirar en el dispositivo más chico que sirva ahorra energía.', { d: 2 }),
      vf('Usar el modo oscuro en el celular es uno de los hábitos digitales de mayor impacto.', false, 'Puede ahorrar un poco de batería en algunas pantallas, pero su efecto es mínimo comparado con usar el celular más años.', {
        razones: ['+Porque su efecto es mínimo comparado con la vida útil del aparato', '-Porque el modo oscuro aumenta mucho las emisiones', '-Porque el celular no usa energía'],
        d: 2,
      }),
      det('Leé este plan digital de una familia y marcá lo que casi no ayuda o empeora.', [ // e8
        ['Vamos a usar los celulares hasta que no den más.', false],
        ['Vamos a borrar los mails todos los días para salvar el planeta, y cambiar los celulares cada año.', true, 'Borrar mails casi no ayuda, y cambiar los celulares cada año aumenta mucho la huella.'],
        ['Vamos a apagar la consola del todo cuando no se usa.', false],
        ['Vamos a comprar un televisor más para cada cuarto.', true, 'Más aparatos es más huella de fabricación y de uso.'],
      ], 'Un buen plan digital pone primero lo que más pesa.', { d: 2 }),
      comp('Completá.', 'Lo que más pesa en la huella digital personal es cuánto [duran] los dispositivos; borrar mails tiene un efecto muy [chico].', ['cuestan', 'grande'], 'La regla para ordenar los hábitos digitales.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: la huella de lo digital', 'Infraestructura, energía, dispositivos, basura electrónica y hábitos, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la casa conectada de los Romero', 'Los Romero quieren bajar su huella digital. Con los números, ordená qué hacer primero.', [
      teoria('La casa', [
        'Los Romero son cuatro. Cada uno cambia el celular cada dos años. Tienen tres televisores, una consola que queda en modo de encendido rápido (15 W, 20 horas por día), un cajón con cinco celulares viejos y dos notebooks rotas. Miran unas 4 horas de video por día entre todos.',
        'Supongamos que fabricar un celular emite 70 kg de CO₂e.',
      ]),
      num('¿Cuántos kg de CO₂e por año suma la fabricación de los celulares, si cada uno de los cuatro cambia el suyo cada dos años?', 140, 'kg CO₂e por año', '4 celulares × 70 kg ÷ 2 años = 140 kg por año solo en fabricar celulares nuevos.', { ctx: '4 personas, cambian el celular cada 2 años; 70 kg de CO₂e por celular.', d: 2 }),
      num('¿Y si cada uno lo usara 4 años?', 70, 'kg CO₂e por año', '4 × 70 ÷ 4 = 70 kg por año: la mitad, solo con usar los celulares más tiempo.', { ctx: 'Los mismos 4 celulares, usados 4 años cada uno.', d: 2 }),
      num('¿Cuántos kWh por año usa la consola en modo de encendido rápido? Redondeá al entero.', 110, 'kWh', '0,015 kW × 20 h × 365 ≈ 110 kWh por año sin usarla. Apagarla del todo evita casi todo.', { ctx: 'Consola: 15 W, 20 horas por día en encendido rápido.', tol: 1, d: 2 }),
      rank('Ordená las medidas por impacto, de mayor a menor.', [ // e4
        ['Usar los celulares 4 años en vez de 2', 'ahorra ≈ 70 kg CO₂e por año'],
        ['Apagar del todo la consola', 'ahorra ≈ 110 kWh por año'],
        ['Llevar los celulares y notebooks viejos a reciclar', 'evita contaminación y recupera metales'],
        ['Borrar los mails de todos', 'efecto muy chico'],
      ], 'Primero la vida útil de los aparatos, después el stand-by y el destino final. Los mails, al final.', { d: 4 }),
      op('¿Qué conviene hacer con los cinco celulares viejos del cajón?', [ // e5
        'Donar los que funcionan y llevar el resto a reciclar',
        'Dejarlos en el cajón por si algún día sirven',
        ['Tirarlos con la basura común', 'Tienen baterías que pueden incendiarse y sustancias peligrosas.'],
        'Quemarlos para recuperar metales',
      ], 'En un cajón no sirven a nadie. Donados o reciclados, sí.', { d: 2 }),
      clas('Clasificá las propuestas de la familia.', { // e6
        'Ayudan': ['Cambiar la batería del celular de la abuela', 'Desenchufar el televisor del cuarto que casi no se usa', 'Llevar las notebooks rotas a un punto de RAEE'],
        'No ayudan o empeoran': ['Comprar un cuarto televisor para la cocina', 'Guardar los aparatos rotos en el cajón', 'Cambiar todos los celulares por el último modelo'],
      }, 'Menos aparatos, más años de uso, menos stand-by y buen destino final.', { d: 3 }),
      det('Los Romero escriben su plan. Marcá lo que no conviene.', [ // e7
        ['Vamos a usar los celulares al menos 4 años.', false],
        ['Como miramos 4 horas de video por día, es lo que más contamina en casa: vamos a dejar de mirar.', true, '4 horas de video son unos 144 g por día: mucho menos que la fabricación de los celulares.'],
        ['Llevamos los celulares viejos a un punto de recolección, con los datos borrados.', false],
        ['Dejamos la consola en encendido rápido para que arranque antes.', true, 'Consume unos 110 kWh por año sin usarse.'],
      ], 'Un plan digital eficaz empieza por lo que más pesa.', { d: 3 }),
    ]),
  ],
});
