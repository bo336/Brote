// Océanos y ríos — lo que va por la alcantarilla llega al arroyo, al río y al mar.
import { d, c, plastico, nada, medida } from '../dsl.mjs';

const dom = 'agua_azul';

export default [
  // ── Del día ────────────────────────────────────────────────────────────────
  d('agua-azul-no-tirar-toallitas', 'No tires toallitas, hisopos ni pelos al inodoro', {
    dom, e: 'easy', i: 'medium', min: 1, rut: true,
    corto: 'Las toallitas no se deshacen: tapan cloacas y llegan a los ríos.',
    desc: 'Toallitas húmedas (aunque digan "biodegradables"), hisopos, hilo dental, pelos y algodones no se desintegran en el agua. Tapan las cloacas del barrio y, cuando desbordan, terminan en arroyos y ríos. Van al tacho del baño.',
    pasos: ['Dejá un tacho con tapa en el baño.', 'Tirá ahí toallitas, hisopos, algodones y pelos.'],
    ef: { r: 0.01 }, tags: ['baño', 'cloacas', 'chicos'],
  }),
  d('azul-no-tirar-colillas', 'No tires colillas al piso ni a la alcantarilla', {
    dom, e: 'easy', i: 'medium', min: 1, edad: 'ta', lugar: 'calle', rut: true,
    corto: 'Una colilla tiene un filtro de plástico y tóxicos que se lavan con la lluvia.',
    desc: 'Las colillas son de los residuos que más se encuentran en playas y costas: el filtro es de acetato (un plástico) y está cargado de químicos que se van al agua. Si fumás, apagala y guardala hasta un cesto, o usá un cenicero de bolsillo.',
    pasos: ['Llevá un cenicero de bolsillo o una latita con tapa.', 'Apagá la colilla ahí y tirala en un cesto.'],
    ef: { r: 0.001 }, tags: ['colillas', 'calle'],
  }),
  d('azul-alcantarilla-limpia', 'Que nada de tu vereda vaya a la alcantarilla', {
    dom, e: 'easy', i: 'medium', min: 3, lugar: 'calle', adulto: true,
    corto: 'Lo que cae en la boca de tormenta no se trata: va directo al arroyo.',
    desc: 'Las bocas de tormenta llevan el agua de lluvia, sin tratar, a arroyos y ríos. Hojas, bolsas, colillas o el agua con detergente de lavar la vereda viajan con ella. Juntá lo que haya en tu cordón antes de que llegue ahí.',
    pasos: ['Barré tu cordón y juntá lo que haya.', 'No barras basura ni hojas hacia la boca de tormenta.', 'No tires agua con detergente o aceite a la calle.'],
    ef: { r: 0.05 }, tags: ['alcantarilla', 'barrio', 'chicos'],
  }),
  d('disfruta-afuera-sin-generar-residuos', 'En la playa, el río o la plaza, volvé con tu basura', {
    dom, e: 'easy', i: 'medium', min: 2, lugar: 'naturaleza',
    corto: 'Lo que entra a un espacio natural tiene que volver a salir con vos.',
    desc: 'En la costa, el río, el camping o la plaza, los cestos se desbordan y el viento se lleva todo al agua. Llevá una bolsa y volvé con tu basura, aunque haya cestos. Si podés, sumá algo que no era tuyo.',
    pasos: ['Llevá una bolsa para tu basura.', 'Antes de irte, revisá que no quede nada.', 'Si ves basura cerca, juntala también.'],
    ef: { r: 0.05 }, tags: ['playa', 'rio', 'naturaleza', 'chicos'],
  }),
  d('azul-detergente-justo', 'Usá la cantidad justa de detergente y jabón', {
    dom, e: 'easy', i: 'low', min: 1, rut: true, ahorra: true,
    corto: 'Más espuma no lava más: lo que sobra se va al río.',
    desc: 'La mayoría usamos bastante más detergente y jabón de lo necesario. Todo lo que sobra se va por la cloaca, y en muchas ciudades llega a ríos sin tratar del todo. Medir la dosis ahorra plata y química en el agua.',
    pasos: ['En el lavarropas, usá la medida que dice el envase para tu carga (no más).', 'Para los platos, unas gotas en la esponja o en un bowl con agua alcanzan.'],
    ef: { r: 0.005 }, tags: ['detergente', 'cocina'],
  }),

  // ── Catálogo ───────────────────────────────────────────────────────────────
  c('participa-de-una-limpieza-de-costa-o-rio', 'Sumate a una limpieza de costa, río o arroyo', {
    dom, e: 'medium', i: 'high', min: 120, formato: 'social', edad: 'kta', adulto: true, lugar: 'naturaleza', cool: 720,
    corto: 'Lo que se junta en la orilla es lo que no llega al mar.',
    desc: 'Organizaciones, clubes de remo, escuelas y municipios hacen limpiezas en costas, ríos y arroyos de todo el país. Además de sacar plástico, muchas registran qué se encontró: esos datos sirven para exigir cambios.',
    pasos: ['Buscá una limpieza en tu zona o armala con amigos.', 'Llevá guantes, bolsas y agua.', 'Separá lo reciclable y anotá qué encontraron más.'],
    medida: medida('¿Cuántas bolsas juntaste?', 'bolsa', 'bolsas', { min: 1, max: 6, def: 1, por: { waste_kg: 2 } }),
    fuente: 'unep-plasticos', tags: ['playa', 'rio', 'basura', 'grupo'], hereda: ['azul-limpiar-una-orilla', 'sumate-a-un-dia-de-limpieza-submarina-o-costera'],
  }),
  c('adopta-una-boca-de-tormenta-y-mantenela-despejad', 'Adoptá la boca de tormenta de tu esquina', {
    dom, e: 'easy', i: 'high', min: 20, edad: 'kta', adulto: true, lugar: 'calle', cool: 336,
    corto: 'Una boca tapada convierte una lluvia normal en una cuadra inundada.',
    desc: 'Antes de cada tormenta, sacar hojas, bolsas y botellas de la reja de la boca de tormenta de tu esquina ayuda a que el agua corra y evita que la basura llegue al arroyo. Si está tapada por dentro, reportala al municipio.',
    pasos: ['Con guantes, sacá hojas y basura de la reja.', 'Tiralo al cesto (no a la calle).', 'Si está tapada por dentro, reportala al municipio.'],
    ef: { r: 0.3 }, tags: ['alcantarilla', 'inundacion', 'barrio'],
  }),
  c('usa-una-bolsa-para-microfibras-al-lavar', 'Lavá la ropa sintética en una bolsa filtrante', {
    dom, e: 'easy', i: 'medium', min: 5, edad: 'ta', costo: 'bajo', frec: 'one_time',
    corto: 'Cada lavado de ropa sintética suelta miles de microfibras de plástico.',
    desc: 'Polar, poliéster y ropa deportiva largan microfibras en cada lavado que las plantas de tratamiento no filtran. Lavarlas dentro de una bolsa especial (o una funda de almohada cerrada), en frío y con carga completa, retiene buena parte.',
    pasos: ['Juntá la ropa sintética (polar, deportiva, poliéster).', 'Lavala dentro de una bolsa filtrante o una funda cerrada, en frío.', 'Sacá las fibras que queden en la bolsa y tiralas a la basura, no a la pileta.'],
    ef: { r: 0.01 }, fuente: 'unep-plasticos', tags: ['microplasticos', 'ropa', 'lavarropas'], hereda: ['azul-bolsa-de-lavado'],
  }),
  c('azul-cosmeticos-sin-microplastico', 'Revisá si tus cosméticos tienen microplásticos', {
    dom, e: 'easy', i: 'medium', min: 10, formato: 'aprender', edad: 'ta', frec: 'one_time',
    corto: 'Algunas cremas y exfoliantes llevan plástico en polvo que va directo al agua.',
    desc: 'En la lista de ingredientes, "polyethylene", "polypropylene" o "nylon" indican microplásticos. Esos productos se enjuagan y terminan en ríos y mares. La próxima vez, elegí alternativas sin ellos.',
    pasos: ['Leé los ingredientes de exfoliantes, pastas dentales y cremas.', 'Buscá "polyethylene", "polypropylene" o "nylon".', 'Cuando se terminen, reemplazalos por opciones sin microplásticos.'],
    ef: nada(), tags: ['microplasticos', 'baño'],
  }),
  c('agua-azul-detergente-biodegradable', 'Pasate a un detergente biodegradable', {
    dom, e: 'easy', i: 'medium', min: 10, formato: 'salida', edad: 'ta', lugar: 'compras', cool: 2160,
    corto: 'Los fosfatos de algunos detergentes alimentan algas que ahogan arroyos y lagunas.',
    desc: 'Lo que baja por la pileta y el lavarropas llega, tarde o temprano, a un río. Los detergentes biodegradables y sin fosfatos se degradan más rápido y no disparan las algas verdes que dejan sin oxígeno al agua.',
    pasos: ['Cuando se te termine el detergente, buscá uno biodegradable y sin fosfatos.', 'Si podés, comprálo en recarga.'],
    ef: nada(), tags: ['detergente', 'rios', 'compras'], hereda: ['azul-detergente-biodegradable'],
  }),
  c('desecha-medicamentos-correctamente', 'Llevá los remedios vencidos a la farmacia', {
    dom, e: 'easy', i: 'medium', min: 15, formato: 'salida', edad: 'ta', cool: 2160,
    corto: 'Tirados al inodoro, los remedios llegan al agua: las plantas de tratamiento no los filtran.',
    desc: 'Antibióticos, hormonas o analgésicos vencidos no van a la basura común ni al inodoro. Muchas farmacias y municipios tienen contenedores para recibirlos y tratarlos como residuo especial.',
    pasos: ['Revisá el botiquín y separá lo vencido.', 'Preguntá en tu farmacia o en el municipio si los reciben.', 'Llevalos en una bolsa cerrada.'],
    ef: { r: 0.1 }, tags: ['remedios', 'especiales'], hereda: ['azul-no-tirar-medicamentos'],
  }),
  c('agua-azul-juntar-tanza-y-anzuelos', 'Juntá tanza y anzuelos de la orilla', {
    dom, e: 'easy', i: 'high', min: 20, req: ['costa'], edad: 'ta', lugar: 'naturaleza', cool: 336,
    corto: 'La tanza abandonada enreda aves, tortugas y peces durante años.',
    desc: 'En muelles, escolleras y orillas de ríos y lagunas quedan tanzas, anzuelos y plomadas. Son trampas para aves y tortugas. Juntarlos con cuidado (con guantes) y tirarlos cortados en un cesto salva animales.',
    pasos: ['Con guantes, juntá tanza, anzuelos y plomadas de la orilla.', 'Cortá la tanza en pedazos chicos antes de tirarla.', 'Si pescás, llevate siempre lo tuyo.'],
    ef: { r: 0.05 }, tags: ['pesca', 'rio', 'aves'],
  }),
  c('azul-pesca-responsable', 'Si pescás, devolvé los chicos y respetá la veda', {
    dom, e: 'easy', i: 'high', min: 10, formato: 'aprender', req: ['costa'], edad: 'ta', frec: 'one_time',
    corto: 'Un pez chico devuelto hoy es el que se reproduce mañana.',
    desc: 'Cada provincia tiene tallas mínimas, cupos y temporadas de veda para proteger la reproducción de especies como el dorado, el surubí o el pejerrey. Conocerlas y respetarlas, y devolver con cuidado lo que no se va a comer, mantiene la pesca para todos.',
    pasos: ['Averiguá las tallas mínimas y la veda de tu provincia.', 'Usá anzuelos sin rebaba para devolver mejor.', 'Devolvé al agua los peces chicos, mojándote las manos antes de tocarlos.'],
    ef: nada(), fuente: 'fao-pesca-sofia', tags: ['pesca', 'rio'],
  }),
  c('elegi-pescado-de-origen-sustentable', 'Elegí pescado de mar argentino y de temporada', {
    dom, e: 'easy', i: 'medium', min: 10, formato: 'salida', edad: 'ta', lugar: 'compras', cool: 720,
    corto: 'El Mar Argentino tiene especies abundantes que casi no se comen acá.',
    desc: 'La merluza, la caballa, la anchoíta o el abadejo son del Mar Argentino y muchas veces más baratas que lo importado. Preguntá en la pescadería qué entró fresco y de dónde viene.',
    pasos: ['En la pescadería, preguntá qué hay fresco y de dónde viene.', 'Probá especies del Mar Argentino, como la anchoíta o la caballa.'],
    ef: nada(), fuente: 'inidep', tags: ['pescado', 'compras', 'mar'], hereda: ['azul-pescado-responsable'],
  }),
  c('agua-azul-visita-un-humedal', 'Conocé un humedal de tu zona', {
    dom, e: 'easy', i: 'medium', min: 120, formato: 'salida', edad: 'kta', lugar: 'naturaleza', cool: 720,
    corto: 'Los humedales filtran agua, frenan inundaciones y son de lo primero que se rellena.',
    desc: 'Lagunas, bañados, esteros, el Delta, la costa del río: los humedales son reservas de agua, refugio de aves y protección contra las inundaciones. Visitar uno (muchas reservas urbanas lo son) es la mejor forma de entender por qué hay que cuidarlos.',
    pasos: ['Buscá una reserva, laguna o bañado cerca (muchas tienen senderos y son gratuitas).', 'Andá con binoculares o el celular para fotos.', 'Volvé con tu basura.'],
    ef: nada(), fuente: 'ramsar', tags: ['humedal', 'reserva', 'familia'],
  }),
  c('azul-aprender-cuenca', 'Averiguá a qué río va el agua de tu casa', {
    dom, e: 'easy', i: 'medium', min: 15, formato: 'aprender', edad: 'kta', frec: 'one_time',
    corto: 'Saber a dónde va tu agua cambia cómo la cuidás.',
    desc: 'El agua que usás viene de algún río o acuífero, y la que tirás vuelve a uno. ¿Es el Paraná, el Río de la Plata, el Matanza-Riachuelo, el Salí-Dulce, el Mendoza, un acuífero? Averiguarlo es entender que lo de tu casa y lo del río son lo mismo.',
    pasos: ['Buscá de dónde toma el agua tu ciudad (la empresa de agua lo informa).', 'Averiguá a dónde van las cloacas y las lluvias.', 'Contáselo a tu familia.'],
    ef: nada(), fuente: 'acumar', tags: ['cuenca', 'rio', 'chicos'],
  }),
  c('agua-azul-nunca-soltar-globos', 'Festejá sin soltar globos', {
    dom, e: 'easy', i: 'medium', min: 5, edad: 'kta', cool: 720,
    corto: 'Cada globo suelto termina en el agua o en el estómago de un animal.',
    desc: 'Los globos que se sueltan "al cielo" bajan en algún lado: muchas veces en ríos, costas y el mar, donde tortugas y aves los confunden con comida. Para un festejo, hay mil formas de decorar sin soltar nada.',
    pasos: ['En los cumpleaños o festejos, no sueltes globos.', 'Si usás globos de decoración, al final pinchalos y tiralos a la basura.'],
    ef: plastico(0.01), tags: ['globos', 'fiestas', 'chicos'], hereda: ['azul-globos-no', 'ani-no-soltar-globos'],
  }),
  c('azul-humedales-sin-fuego', 'Denunciá quemas en islas, pastizales o humedales', {
    dom, e: 'easy', i: 'high', min: 10, formato: 'social', reg: ['centro'], edad: 'ta', cool: 720,
    corto: 'Las quemas en el Delta del Paraná pueden arrasar miles de hectáreas de humedal.',
    desc: 'En 2020 los incendios en el Delta del Paraná quemaron cientos de miles de hectáreas. La Ley de Manejo del Fuego prohíbe las quemas sin autorización. Si ves humo o fuego en islas, bañados o pastizales, avisar rápido a la brigada o al 911 hace la diferencia.',
    pasos: ['Si ves humo o fuego en un humedal o pastizal, anotá la ubicación.', 'Llamá al 911 o a la brigada de incendios de tu provincia.', 'No te acerques al fuego.'],
    ef: nada(), fuente: 'ley-27604-fuego', tags: ['humedal', 'fuego', 'participacion'],
  }),
  c('azul-playa-sin-huella', 'En la playa, no dejes nada y no pises los médanos', {
    dom, e: 'easy', i: 'medium', min: 5, est: ['verano'], edad: 'kta', lugar: 'naturaleza', cool: 72,
    corto: 'Los médanos protegen la costa; las colillas y tapitas en la arena terminan en el mar.',
    desc: 'En las vacaciones en la costa: los médanos con vegetación frenan la erosión y no se pisan ni se cruzan con vehículos; la basura (sobre todo colillas, tapitas y sorbetes) vuelve con vos; y la fauna, como lobos marinos o aves, se mira de lejos.',
    pasos: ['Bajá a la playa por los accesos marcados, no por el médano.', 'Llevá bolsa para tu basura y volvé con ella.', 'Mirá a la fauna de lejos, sin alimentarla.'],
    ef: { r: 0.05 }, tags: ['playa', 'vacaciones', 'mar'],
  }),
];
