// Aire y suelo — el humo, el fuego, la tierra viva y el aire de adentro.
import { d, c, organico, nada } from '../dsl.mjs';

const dom = 'aire_suelo';
const frio = ['otono', 'invierno'];

export default [
  // ── Del día ────────────────────────────────────────────────────────────────
  d('air-ventilar-al-cocinar', 'Ventilá mientras cocinás', {
    dom, e: 'easy', i: 'medium', min: 1, rut: true,
    corto: 'El aire de adentro de una casa puede estar más contaminado que el de la calle.',
    desc: 'Cocinar a gas, freír o usar el horno libera gases y partículas. La OMS advierte sobre la contaminación del aire dentro de las casas. Abrir una ventana o prender el extractor mientras cocinás, y un rato después, renueva el aire.',
    pasos: ['Al prender las hornallas, abrí una ventana o prendé el extractor.', 'Dejalo unos minutos más al terminar.'],
    ef: nada(), fuente: 'oms-aire-hogar', tags: ['aire', 'cocina', 'gas'],
  }),
  d('aire-ventilar-corto', 'Ventilá fuerte y corto, no a medias todo el día', {
    dom, e: 'easy', i: 'low', min: 5, rut: true, ahorra: true,
    corto: 'Abrir del todo unos minutos renueva el aire sin enfriar ni calentar las paredes.',
    desc: 'Una ventana entreabierta todo el día deja escapar la calefacción o el aire acondicionado y casi no renueva. Abrir de par en par 5 a 10 minutos, mejor con ventanas enfrentadas, cambia todo el aire. Si hay mucho tránsito afuera, hacelo fuera de la hora pico.',
    pasos: ['Abrí ventanas enfrentadas de par en par 5 a 10 minutos.', 'Cerrá y volvé a la temperatura de siempre.', 'Si vivís en una avenida, ventilá temprano o tarde, no en hora pico.'],
    ef: nada(), fuente: 'gcba-energia', tags: ['aire'], hereda: ['aire-ventilar-en-el-momento-justo'],
  }),
  d('air-limpieza-sin-aerosol', 'Limpiá sin aerosoles', {
    dom, e: 'easy', i: 'low', min: 1, edad: 'ta', rut: true,
    corto: 'Los aerosoles y desodorantes de ambiente empeoran el aire de tu casa.',
    desc: 'Los aerosoles de limpieza y los aromatizantes largan compuestos que quedan flotando en el aire de adentro. Un trapo húmedo, agua con detergente o vinagre limpian casi todo, y para el olor, nada como ventilar.',
    pasos: ['Para limpiar, usá un trapo húmedo y un producto líquido en vez de aerosol.', 'Para el olor, ventilá en vez de usar aromatizante.'],
    ef: nada(), fuente: 'oms-aire-hogar', tags: ['aire', 'limpieza'],
  }),
  d('ene-lena-seca', 'Quemá sólo leña seca y estacionada', {
    dom, e: 'easy', i: 'medium', min: 2, req: ['lena'], est: frio, rut: true, ahorra: true,
    corto: 'La leña húmeda humea más, calienta menos y ensucia el aire del barrio.',
    desc: 'En la Patagonia, la montaña y muchas zonas rurales, la leña es la calefacción. La leña verde o mojada gasta su energía en evaporar agua: humea, calienta poco y llena la chimenea de hollín. La seca, guardada bajo techo de un año para el otro, rinde más con menos humo.',
    pasos: ['Usá leña que suene "hueca" al golpear dos troncos y tenga grietas en las puntas.', 'Prendé con papel y ramitas secas, no con plástico ni nafta.', 'Mantené la estufa con buena entrada de aire, sin ahogarla.'],
    ef: { c: 0.5 }, fuente: 'oms-aire-hogar', tags: ['lena', 'humo', 'invierno'],
  }),
  d('aire-asado-sin-plastico', 'Prendé el fuego del asado sin alcohol ni plásticos', {
    dom, e: 'easy', i: 'low', min: 5, req: ['parrilla'], dias: 'finde',
    corto: 'Bolsitas, telgopor o alcohol dan humo tóxico y sabor feo.',
    desc: 'Para prender el carbón o la leña alcanza con papel de diario, ramitas secas o el clásico "chimenea" de lata. Las bolsas, el telgopor, el alcohol o la nafta largan humo tóxico que respiran todos (y que llega a la carne).',
    pasos: ['Armá la base con papel de diario y ramitas secas.', 'Usá una chimenea de lata para prender el carbón.', 'Nunca uses plásticos, alcohol ni nafta.'],
    ef: nada(), tags: ['asado', 'humo'],
  }),

  // ── Catálogo ───────────────────────────────────────────────────────────────
  c('evita-quemar-residuos-al-aire-libre', 'No quemes la basura: separala y sacala', {
    dom, e: 'easy', i: 'high', min: 10, req: ['campo'], edad: 'ta', cool: 720,
    corto: 'Quemar basura en el patio libera humo tóxico que respiran tu familia y tus vecinos.',
    desc: 'En pueblos y zonas rurales sin recolección es común quemar la basura en el fondo. Plásticos y otros materiales quemados a baja temperatura largan sustancias muy tóxicas. Separar, compostar lo orgánico y llevar lo demás a un punto de recolección cuida el aire y la salud.',
    pasos: ['Separá lo orgánico para compost y lo reciclable.', 'Averiguá dónde se recibe la basura en tu localidad (punto de acopio, contenedor, recolección).', 'No quemes plásticos, gomas ni envases.'],
    ef: nada(), fuente: 'oms-aire-exterior', tags: ['campo', 'humo', 'basura'], hereda: ['aire-no-quemar-basura'],
  }),
  c('air-no-quemar-hojas', 'Compostá las hojas en vez de quemarlas', {
    dom, e: 'easy', i: 'high', min: 20, req: ['jardin'], est: ['otono', 'invierno'], edad: 'ta', cool: 336,
    corto: 'El humo de las quemas de hojas es de lo peor para el aire del barrio.',
    desc: 'Las hojas del otoño son oro para la tierra: apiladas en un rincón o en la compostera se vuelven mantillo en unos meses. Quemarlas llena el barrio de humo y partículas que afectan sobre todo a chicos y personas con asma.',
    pasos: ['Juntá las hojas en un rincón del jardín o en bolsas.', 'Usalas de mantillo sobre los canteros o sumalas al compost.', 'Nunca las quemes.'],
    ef: organico(5), fuente: 'oms-aire-exterior', tags: ['hojas', 'compost', 'humo'],
  }),
  c('aire-campo-no-quemar-pastizal', 'No quemes pastizales ni rastrojos', {
    dom, e: 'easy', i: 'high', min: 10, formato: 'aprender', req: ['campo'], edad: 'a', frec: 'one_time',
    corto: 'Una quema "controlada" puede volverse un incendio con un cambio de viento.',
    desc: 'La Ley de Manejo del Fuego regula las quemas. Quemar pastizales, banquinas o rastrojos degrada el suelo, mata fauna, llena de humo las rutas y muchas veces se escapa de control. Hay alternativas: pastoreo, corte, incorporación al suelo.',
    pasos: ['No quemes pastizales, banquinas ni rastrojos.', 'Consultá con el INTA o la autoridad provincial las alternativas para tu caso.', 'Si ves una quema que se descontrola, llamá a bomberos o a la brigada.'],
    ef: nada(), fuente: 'ley-27604-fuego', tags: ['campo', 'fuego', 'suelo'],
  }),
  c('aire-sierras-sin-fuego', 'En temporada de incendios, no hagas fuego en las sierras ni el monte', {
    dom, e: 'easy', i: 'high', min: 5, formato: 'salida', reg: ['centro', 'cuyo', 'noa'], est: ['invierno', 'primavera'], edad: 'kta', lugar: 'naturaleza', cool: 720,
    corto: 'En invierno y primavera, en las sierras, una chispa alcanza para quemar miles de hectáreas.',
    desc: 'En Córdoba, San Luis, las sierras del NOA y Cuyo, el fin del invierno es la época de más riesgo: pasto seco, viento y heladas. Si salís a la naturaleza, nada de fuego fuera de los fogones habilitados (mejor ninguno), y las colillas, siempre apagadas y con vos.',
    pasos: ['Antes de salir, fijate el índice de riesgo de incendio de tu provincia.', 'No hagas fuego fuera de los fogones habilitados.', 'Si ves humo, avisá al 911 o a la brigada.'],
    ef: nada(), fuente: 'ley-27604-fuego', tags: ['fuego', 'sierras', 'naturaleza'],
  }),
  c('reduci-el-uso-de-lena-o-usa-cocinas-mas-limpias', 'Guardá la leña bajo techo para que se seque', {
    dom, e: 'easy', i: 'medium', min: 30, req: ['lena'], est: ['verano', 'otono'], edad: 'ta', cool: 2160,
    corto: 'La leña de este invierno se prepara en verano.',
    desc: 'La leña recién cortada tiene mucha agua. Apilada bajo techo, separada del piso y con aire entre los troncos, en unos meses se seca y rinde mucho más, con menos humo. Es el mejor ahorro para quien se calefacciona a leña.',
    pasos: ['Apilá la leña bajo un techo, sobre palos o pallets, no en el piso.', 'Dejá aire entre las filas.', 'Usá primero la que lleva más tiempo guardada.'],
    ef: { c: 2 }, tags: ['lena', 'invierno'],
  }),
  c('usa-cortadora-manual-o-electrica-en-vez-de-nafta', 'Cortá el pasto con cortadora eléctrica o manual', {
    dom, e: 'medium', i: 'medium', min: 45, req: ['jardin'], edad: 'a', cool: 168,
    corto: 'Una bordeadora a nafta puede contaminar en una hora tanto como un auto en un viaje largo.',
    desc: 'Los motores chicos de dos tiempos (bordeadoras, sopladoras, cortadoras a nafta) son muy contaminantes y ruidosos. Una eléctrica, una manual o simplemente cortar menos seguido y dejar un sector sin cortar cuidan el aire y el oído de la cuadra.',
    pasos: ['Si tenés que cortar, usá una cortadora eléctrica o manual.', 'Cortá menos seguido y dejá un sector más alto.', 'Si es a nafta, mantenela bien regulada.'],
    ef: { c: 1 }, tags: ['jardin', 'aire', 'ruido'],
  }),
  c('mejora-la-salud-del-suelo-sin-labranza', 'No des vuelta la tierra de la huerta', {
    dom, e: 'easy', i: 'medium', min: 30, req: ['huerta'], edad: 'ta', cool: 2160,
    corto: 'Dar vuelta la tierra rompe la red de hongos y bichitos que la mantiene viva.',
    desc: 'La tierra de una huerta es un ecosistema. En lugar de dar vuelta la tierra con la pala, aflojala con una horquilla sin invertirla y sumá compost y mantillo arriba: las lombrices hacen el resto, y retiene más agua.',
    pasos: ['Aflojá la tierra con una horquilla, sin darla vuelta.', 'Poné compost por encima.', 'Cubrí con mantillo.'],
    ef: nada(), fuente: 'fao-suelos', tags: ['suelo', 'huerta'],
  }),
  c('aire-cubri-la-tierra-desnuda', 'No dejes tierra pelada: cubrila', {
    dom, e: 'easy', i: 'medium', min: 20, req: ['balcon'], edad: 'kta', cool: 2160,
    corto: 'El suelo descubierto se seca, se erosiona y levanta polvo.',
    desc: 'La tierra desnuda pierde humedad y vida. Cubrirla con mantillo, plantas rastreras o un abono verde (como avena o vicia en invierno) la protege del sol, la lluvia fuerte y el viento.',
    pasos: ['Buscá la tierra que quedó pelada en macetas, canteros o el jardín.', 'Cubrila con hojas secas, pasto cortado o plantas rastreras.'],
    ef: nada(), fuente: 'fao-suelos', tags: ['suelo', 'chicos'],
  }),
  c('arma-un-cantero-alimentado-con-compost', 'Armá un cantero con tu compost', {
    dom, e: 'medium', i: 'medium', min: 60, req: ['compost'], edad: 'ta', frec: 'one_time',
    corto: 'Un suelo con compost retiene más agua, más carbono y da más vida.',
    desc: 'El compost que hiciste es el mejor punto de partida para un cantero nuevo: mezclado con la tierra, alimenta plantas y bichos del suelo y guarda humedad. Es cerrar el círculo de tus restos de cocina.',
    pasos: ['Elegí un lugar con sol.', 'Mezclá una parte de compost cada tres de tierra.', 'Plantá y cubrí con mantillo.'],
    ef: organico(3), tags: ['compost', 'suelo'],
  }),
  c('air-vinagre-y-bicarbonato', 'Prepará un limpiador casero con vinagre y bicarbonato', {
    dom, e: 'easy', i: 'low', min: 10, edad: 'ta', cool: 2160, ahorra: true,
    corto: 'Vinagre, bicarbonato y un poco de detergente limpian casi todo.',
    desc: 'Para mesadas, vidrios, sarro y grasa liviana, el vinagre blanco y el bicarbonato funcionan muy bien, cuestan poco y no dejan olores químicos en el aire. Guardalos en un rociador reusado y etiquetado.',
    pasos: ['Mezclá mitad vinagre blanco y mitad agua en un rociador reusado, y etiquetalo.', 'Para el sarro y la grasa, usá bicarbonato con un poco de agua.', 'Nunca mezcles vinagre con lavandina.'],
    ef: nada(), tags: ['limpieza', 'aire'],
  }),
  c('aire-medir-la-calidad-del-aire', 'Consultá la calidad del aire de tu ciudad', {
    dom, e: 'easy', i: 'low', min: 10, formato: 'aprender', edad: 'ta', frec: 'one_time', lugar: 'celular',
    corto: 'Saber cuándo el aire está peor cambia cuándo salís a correr o ventilás.',
    desc: 'Varias ciudades argentinas publican mediciones de calidad del aire, y hay mapas mundiales con estaciones y sensores. Mirarlo te dice qué horas y qué días conviene evitar las avenidas para hacer ejercicio o ventilar.',
    pasos: ['Buscá si tu ciudad publica la calidad del aire.', 'Mirá cómo cambia en el día.', 'Ajustá cuándo ventilás o salís a hacer ejercicio.'],
    ef: nada(), fuente: 'oms-aire-exterior', tags: ['aire'], hereda: ['cie-calidad-aire'],
  }),
  c('aire-analiza-el-suelo-antes-de-plantar', 'Hacé la prueba del frasco para conocer tu suelo', {
    dom, e: 'easy', i: 'medium', min: 20, formato: 'observar', req: ['balcon'], edad: 'kta', adulto: true, cool: 4320,
    corto: 'Un frasco con tierra y agua muestra cuánta arena, limo y arcilla tiene tu suelo.',
    desc: 'Poné tierra en un frasco con agua, agitá y dejalo quieto: en un día las capas se separan (arena abajo, limo en el medio, arcilla arriba). Así sabés si tu tierra drena rápido o retiene agua, y qué le conviene.',
    pasos: ['Llená un tercio de un frasco con tierra y el resto con agua.', 'Agitá fuerte y dejalo quieto un día.', 'Mirá el grosor de cada capa y anotalo.'],
    ef: nada(), fuente: 'fao-suelos', tags: ['suelo', 'experimento', 'chicos'], hereda: ['hace-un-test-de-calidad-de-tu-suelo'],
  }),
];
