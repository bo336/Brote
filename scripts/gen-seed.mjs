// ─────────────────────────────────────────────────────────────────────────────
// Brote seed generator (BUILD_SPEC §14).
// Encodes the canonical data + authors warm Spanish (voseo) copy via templates,
// and emits supabase/seed.sql. Re-run with: `node scripts/gen-seed.mjs`.
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '..', 'supabase', 'seed.sql');

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);

// ── Domains (§3.4) ───────────────────────────────────────────────────────────
const DOMAINS = [
  ['residuos', 'Residuos y Reciclaje', 'Waste & Recycling', '#C2703D', 'Menos basura, más vueltas: reducí, reusá y reciclá.'],
  ['agua', 'Agua', 'Water', '#2DB4D4', 'Cada gota cuenta. Cuidá el agua en casa.'],
  ['energia', 'Energía y CO₂', 'Home Energy & CO₂', '#F4A62A', 'Gastá menos energía y bajá tus emisiones.'],
  ['movilidad', 'Movilidad', 'Transport', '#5B6CF0', 'Moverte limpio: a pie, en bici o en transporte.'],
  ['plantas', 'Plantas y Verde Urbano', 'Plants & Greening', '#3CB371', 'Sembrá vida y llená de verde tu entorno.'],
  ['animales', 'Animales y Vida Silvestre', 'Animals & Wildlife', '#E8638C', 'Dales una mano a los bichos y la fauna.'],
  ['alimentacion', 'Alimentación', 'Food & Diet', '#9CC93B', 'Comé rico cuidando el planeta.'],
  ['consumo', 'Consumo Responsable', 'Consumption', '#B07CD6', 'Comprá mejor, comprá menos, durá más.'],
  ['digital', 'Digital y Tecnología', 'Tech & Digital', '#3DC1C1', 'Tu huella digital también pesa: livianala.'],
  ['comunidad', 'Comunidad', 'Community', '#FF8A3D', 'Juntos podemos más. Sumate al barrio.'],
  ['agua_azul', 'Océanos y Ríos', 'Oceans & Rivers', '#1E88A8', 'Protegé el agua azul: ríos, costas y mares.'],
  ['aire_suelo', 'Aire y Suelo', 'Air & Soil', '#A38B6D', 'Aire más limpio y suelo más sano.'],
  ['ciencia', 'Ciencia Ciudadana', 'Citizen Science', '#6FBF73', 'Observá, registrá y ayudá a la ciencia.'],
];

// ── Ranks (§5.1) ─────────────────────────────────────────────────────────────
const RANKS = [
  ['semilla', 'Semilla', 'Seed', 1, 0, '#A38B6D', 'Tu mundo arranca: tierra desnuda y Pip.'],
  ['brote', 'Brote', 'Sprout', 2, 1000, '#9CC93B', 'Aparece el primer pasto y un brote. Primer título.'],
  ['plantula', 'Plántula', 'Seedling', 3, 3000, '#6FBF73', 'Aparecen flores. Podés crear proyectos.'],
  ['retono', 'Retoño', 'Shoot', 4, 7000, '#3CB371', 'Tu primer arbolito. Funciones de amigos.'],
  ['arbusto', 'Arbusto', 'Shrub', 5, 15000, '#1FB57A', 'Arbustos y la primera ave visita tu mundo.'],
  ['arbol', 'Árbol', 'Tree', 6, 30000, '#0E7A52', 'Un árbol completo. Desafíos exclusivos.'],
  ['bosque', 'Bosque', 'Grove', 7, 60000, '#2DB4D4', 'Un bosque, un estanque y más fauna.'],
  ['guardian', 'Guardián', 'Guardian', 8, 120000, '#1E88A8', 'Aura de Guardián para Pip. Proyectos exclusivos.'],
  ['ecosistema', 'Ecosistema', 'Ecosystem', 9, 250000, '#5B6CF0', 'Un bioma rico: animales, agua y estructuras.'],
  ['planeta', 'Planeta', 'Planet', 10, 500000, '#B07CD6', 'Tu mundo se vuelve un planeta vivo.'],
  ['gaia', 'Gaia', 'Gaia', 11, 1000000, '#FFB23E', 'Estatus legendario y un mundo dorado.'],
];

// ── Activities. Tuple: [domain, title, effort, impact, verif, points, freq] ──
const DAILY = [
  ['agua', 'Ducha corta (≤5 min)', 'easy', 'low', 'honor', 50],
  ['agua', 'Reutilizá el agua para regar las plantas', 'easy', 'medium', 'honor', 100],
  ['agua', 'Cerrá la canilla mientras te cepillás o enjabonás', 'easy', 'low', 'honor', 50],
  ['agua', 'Lavá los platos con la canilla cerrada', 'easy', 'low', 'honor', 50],
  ['agua', 'Poné el lavarropas solo cuando esté lleno', 'easy', 'low', 'honor', 50],
  ['movilidad', 'Caminá un trayecto en vez de ir en auto', 'medium', 'high', 'honor', 150],
  ['movilidad', 'Andá en bici a algún lado hoy', 'medium', 'high', 'honor', 150],
  ['movilidad', 'Usá transporte público hoy', 'easy', 'high', 'honor', 100],
  ['movilidad', 'Subí por la escalera en vez del ascensor', 'easy', 'low', 'honor', 50],
  ['energia', 'Colgá la ropa al aire en vez de usar secadora', 'easy', 'medium', 'honor', 100],
  ['energia', 'Desenchufá los aparatos que no estás usando', 'easy', 'low', 'honor', 50],
  ['energia', 'Lavá la ropa con agua fría', 'easy', 'medium', 'honor', 100],
  ['energia', 'Apagá las luces de los ambientes vacíos', 'easy', 'low', 'honor', 50],
  ['energia', 'Bajá un poco la calefacción o el aire', 'easy', 'medium', 'honor', 100],
  ['energia', 'Cociná con tapa y aprovechá el calor', 'easy', 'low', 'honor', 50],
  ['alimentacion', 'Comé una comida sin carne hoy', 'easy', 'high', 'honor', 150],
  ['alimentacion', 'Aprovechá las sobras (día sin desperdicio)', 'easy', 'medium', 'honor', 100],
  ['alimentacion', 'Tomá agua de la canilla en vez de embotellada', 'easy', 'low', 'honor', 50],
  ['alimentacion', 'Reducí los lácteos hoy', 'medium', 'medium', 'honor', 100],
  ['residuos', 'Separá bien tus residuos hoy', 'easy', 'low', 'honor', 50],
  ['residuos', 'Llevá tu botella reutilizable', 'easy', 'low', 'honor', 50],
  ['residuos', 'Llevá tus bolsas reutilizables a comprar', 'easy', 'low', 'honor', 50],
  ['residuos', 'Evitá un plástico de un solo uso hoy', 'easy', 'low', 'honor', 50],
  ['residuos', 'Compostá tus restos de comida', 'medium', 'medium', 'honor', 100],
  ['residuos', 'Usá tu vaso o termo reutilizable', 'easy', 'low', 'honor', 50],
  ['residuos', 'Reutilizá un frasco o envase', 'easy', 'low', 'honor', 50],
  ['plantas', 'Regá tus plantas al amanecer o atardecer', 'easy', 'low', 'honor', 50],
  ['animales', 'Dejá agua para las aves o animales hoy', 'easy', 'low', 'honor', 50],
  ['comunidad', 'Recogé un poco de basura que viste en la calle', 'easy', 'low', 'honor', 50],
  ['digital', 'Borrá mails y archivos viejos que no usás', 'easy', 'low', 'honor', 50],
  ['digital', 'Bajá la resolución del streaming', 'easy', 'low', 'honor', 50],
  ['comunidad', 'Disfrutá afuera sin generar residuos', 'easy', 'low', 'honor', 50],
];

const CATALOG = [
  // A — residuos
  ['residuos', 'Armá una estación de separación de residuos en casa', 'easy', 'low', 'honor', 300, 'one_time'],
  ['residuos', 'Empezá a compostar en casa', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['residuos', 'Armá una compostera con lombrices (vermicompost)', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['residuos', 'Pasá una semana de residuo cero', 'hard', 'medium', 'honor', 1500, 'weekly'],
  ['residuos', 'Hacé una auditoría de tu basura', 'medium', 'low', 'honor', 500, 'one_time'],
  ['residuos', 'Llevá tus residuos electrónicos a un punto certificado', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['residuos', 'Llevá pilas y baterías a un punto de recolección', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['residuos', 'Cambiá a jabón o champú en barra', 'easy', 'low', 'honor', 300, 'one_time'],
  ['residuos', 'Pasate a facturación digital', 'easy', 'low', 'honor', 300, 'one_time'],
  ['residuos', 'Repará algo en vez de tirarlo', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['residuos', 'Organizá o participá de un intercambio de ropa', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['residuos', 'Doná cosas que ya no usás en vez de tirarlas', 'easy', 'low', 'honor', 300, 'recurring'],
  ['residuos', 'Comprá a granel o en estaciones de recarga', 'medium', 'medium', 'honor', 500, 'weekly'],
  ['residuos', 'Reciclá correctamente el aceite de cocina usado', 'medium', 'medium', 'honor', 500, 'recurring'],
  ['residuos', 'Comprá productos con contenido reciclado', 'easy', 'low', 'honor', 300, 'recurring'],
  ['residuos', 'Evitá la moda rápida toda una temporada', 'hard', 'medium', 'honor', 1500, 'recurring'],
  // B — agua
  ['agua', 'Instalá un cabezal de ducha de bajo caudal', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['agua', 'Arreglá una canilla o inodoro que pierde', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['agua', 'Instalá un sistema de recolección de agua de lluvia', 'medium', 'medium', 'photo_ai', 1000, 'one_time'],
  ['agua', 'Reutilizá aguas grises para el jardín', 'medium', 'medium', 'honor', 750, 'recurring'],
  ['agua', 'Instalá un inodoro de doble descarga', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['agua', 'Elegí plantas nativas resistentes a la sequía', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['agua', 'Reportá una pérdida de agua en la vía pública', 'easy', 'medium', 'honor', 500, 'one_time'],
  // C — energia
  ['energia', 'Cambiate a una tarifa de energía renovable', 'easy', 'high', 'photo_ai', 1000, 'one_time'],
  ['energia', 'Cambiá todas las lámparas a LED', 'easy', 'medium', 'photo_ai', 500, 'one_time'],
  ['energia', 'Mejorá la aislación y burletes de tu casa', 'hard', 'high', 'photo_ai', 2000, 'one_time'],
  ['energia', 'Instalá un termostato inteligente', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['energia', 'Instalá paneles solares en el techo', 'hard', 'high', 'photo_ai', 3000, 'one_time'],
  ['energia', 'Reemplazá un electrodoméstico por uno eficiente', 'hard', 'medium', 'photo_ai', 1500, 'one_time'],
  ['energia', 'Hacé una auditoría energética de tu casa', 'medium', 'medium', 'honor', 750, 'one_time'],
  ['energia', 'Cambiá a una bomba de calor', 'hard', 'high', 'photo_ai', 3000, 'one_time'],
  ['energia', 'Usá regletas inteligentes contra el consumo fantasma', 'easy', 'low', 'photo_ai', 500, 'one_time'],
  ['energia', 'Ajustá el termotanque a una temperatura eficiente', 'easy', 'low', 'honor', 300, 'one_time'],
  // D — movilidad
  ['movilidad', 'Pasá una semana sin auto', 'hard', 'high', 'honor', 2000, 'weekly'],
  ['movilidad', 'Evitá un vuelo de corta distancia', 'hard', 'high', 'honor', 2000, 'one_time'],
  ['movilidad', 'Cambiate a un auto eléctrico o e-bike', 'hard', 'high', 'photo_ai', 3000, 'one_time'],
  ['movilidad', 'Mantené la presión de los neumáticos', 'easy', 'low', 'honor', 300, 'recurring'],
  ['movilidad', 'Trabajá desde casa y reducí días de viaje', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['movilidad', 'Sumate a un esquema de bicis compartidas', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['movilidad', 'Organizá un grupo de auto compartido', 'medium', 'medium', 'honor', 750, 'recurring'],
  ['movilidad', 'Hacé el compromiso de un año sin volar', 'hard', 'high', 'honor', 2000, 'recurring'],
  // E — plantas
  ['plantas', 'Plantá un árbol nativo', 'medium', 'medium', 'photo_ai', 1000, 'one_time'],
  ['plantas', 'Empezá una huerta en el balcón o ventana', 'easy', 'low', 'photo_ai', 500, 'one_time'],
  ['plantas', 'Cultivá tus propias verduras o hierbas', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['plantas', 'Plantá flores nativas para polinizadores', 'easy', 'medium', 'photo_ai', 500, 'one_time'],
  ['plantas', 'Sumate a una huerta comunitaria', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['plantas', 'Convertí parte del césped en plantas nativas', 'hard', 'medium', 'photo_ai', 1500, 'one_time'],
  ['plantas', 'Dejá un sector sin cortar para la biodiversidad', 'easy', 'low', 'honor', 300, 'recurring'],
  ['plantas', 'Hacé bombas de semillas para espacios descuidados', 'medium', 'low', 'honor', 500, 'recurring'],
  ['plantas', 'Cubrí los canteros con mantillo', 'easy', 'low', 'honor', 300, 'recurring'],
  ['plantas', 'Sumate a una jornada de plantación de árboles', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  // F — animales
  ['animales', 'Construí un hotel de insectos o casa para abejas', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['animales', 'Poné un comedero o bebedero para aves', 'easy', 'low', 'photo_ai', 500, 'recurring'],
  ['animales', 'Dejá un corredor para fauna en tu jardín', 'medium', 'medium', 'honor', 750, 'one_time'],
  ['animales', 'Evitá pesticidas y herbicidas en tu jardín', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['animales', 'Creá un pequeño estanque para anfibios', 'hard', 'medium', 'photo_ai', 1500, 'one_time'],
  ['animales', 'Adoptá una mascota de un refugio', 'medium', 'medium', 'photo_ai', 1000, 'one_time'],
  ['animales', 'Hacé de hogar de tránsito para animales', 'hard', 'medium', 'photo_ai', 1500, 'recurring'],
  ['animales', 'Hacé voluntariado en un refugio o santuario', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['animales', 'Mantené a los gatos adentro para proteger aves', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['animales', 'Poné calcomanías anti-choque en las ventanas', 'easy', 'low', 'photo_ai', 300, 'one_time'],
  ['animales', 'Elegí pescado de origen sustentable', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['animales', 'Sacá especies invasoras de tu zona', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['animales', 'Reportá fauna herida a un centro de rescate', 'easy', 'medium', 'honor', 500, 'one_time'],
  ['animales', 'Evitá productos con aceite de palma no sustentable', 'medium', 'medium', 'honor', 750, 'recurring'],
  ['animales', 'Plantá especies hospederas para mariposas', 'easy', 'medium', 'photo_ai', 500, 'one_time'],
  // G — alimentacion
  ['alimentacion', 'Hacé un Lunes sin carne cada semana', 'easy', 'high', 'honor', 500, 'weekly'],
  ['alimentacion', 'Pasá una semana 100% a base de plantas', 'hard', 'high', 'honor', 1500, 'weekly'],
  ['alimentacion', 'Comprá productos locales y de estación', 'easy', 'medium', 'honor', 500, 'weekly'],
  ['alimentacion', 'Comprá en una feria de productores', 'easy', 'low', 'honor', 300, 'weekly'],
  ['alimentacion', 'Planificá tus comidas para no comprar de más', 'medium', 'medium', 'honor', 750, 'weekly'],
  ['alimentacion', 'Rescatá comida excedente con apps', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['alimentacion', 'Cultivá hierbas para reemplazar las envasadas', 'easy', 'low', 'photo_ai', 300, 'one_time'],
  ['alimentacion', 'Llevá un diario de desperdicio de comida', 'medium', 'medium', 'honor', 750, 'weekly'],
  // H — consumo
  ['consumo', 'Comprá ropa de segunda mano o vintage', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['consumo', 'Repará tu ropa con zurcido visible', 'medium', 'low', 'photo_ai', 500, 'recurring'],
  ['consumo', 'Hacé un mes sin compras innecesarias', 'hard', 'medium', 'honor', 1500, 'recurring'],
  ['consumo', 'Pedí prestado o alquilá en vez de comprar', 'medium', 'low', 'honor', 500, 'recurring'],
  ['consumo', 'Comprá a marcas certificadas sustentables', 'easy', 'low', 'honor', 300, 'recurring'],
  ['consumo', 'Elegí productos con mínimo packaging', 'easy', 'low', 'honor', 300, 'recurring'],
  ['consumo', 'Revendé o doná lo que no usás', 'medium', 'low', 'honor', 500, 'recurring'],
  ['consumo', 'Usá una biblioteca de libros o de cosas', 'easy', 'low', 'honor', 300, 'recurring'],
  ['consumo', 'Comprá electrónica reacondicionada', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['consumo', 'Cambiá a productos recargables del hogar', 'easy', 'low', 'honor', 300, 'recurring'],
  // I — digital
  ['digital', 'Limpiá tu nube y borrá archivos viejos', 'easy', 'low', 'honor', 300, 'recurring'],
  ['digital', 'Alargá la vida de tu celular un año más', 'easy', 'medium', 'honor', 500, 'one_time'],
  ['digital', 'Activá los modos de ahorro de energía', 'easy', 'low', 'photo_ai', 300, 'one_time'],
  ['digital', 'Desuscribite de newsletters que no leés', 'easy', 'low', 'honor', 300, 'one_time'],
  ['digital', 'Reciclá tus dispositivos viejos responsablemente', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  // J — comunidad
  ['comunidad', 'Organizá o sumate a una limpieza del barrio', 'medium', 'medium', 'photo_ai', 1000, 'recurring'],
  ['comunidad', 'Creá o sumate a un grupo ambiental local', 'hard', 'high', 'honor', 2000, 'recurring'],
  ['comunidad', 'Escribí a un representante por un tema ambiental', 'medium', 'medium', 'honor', 750, 'one_time'],
  ['comunidad', 'Dictá un taller o charla ambiental', 'hard', 'medium', 'photo_ai', 1500, 'recurring'],
  ['comunidad', 'Organizá un café de reparación comunitario', 'hard', 'medium', 'photo_ai', 1500, 'recurring'],
  ['comunidad', 'Armá una biblioteca de herramientas o de semillas', 'hard', 'medium', 'photo_ai', 1500, 'one_time'],
  ['comunidad', 'Lanzá un reto de barrio contra barrio', 'medium', 'high', 'honor', 1000, 'recurring'],
  ['comunidad', 'Hacé voluntariado en restauración de hábitats', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['comunidad', 'Juntá firmas por ciclovías o espacios verdes', 'medium', 'medium', 'honor', 750, 'one_time'],
  ['comunidad', 'Sé mentor de alguien nuevo en la plataforma', 'easy', 'low', 'honor', 300, 'recurring'],
  ['comunidad', 'Coordiná auto compartido en el trabajo o escuela', 'medium', 'medium', 'honor', 750, 'recurring'],
  // K — agua_azul
  ['agua_azul', 'Participá de una limpieza de costa o río', 'medium', 'medium', 'photo_ai', 1000, 'recurring'],
  ['agua_azul', 'Adoptá una boca de tormenta y mantenela despejada', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['agua_azul', 'Usá una bolsa para microfibras al lavar', 'easy', 'medium', 'photo_ai', 500, 'one_time'],
  ['agua_azul', 'Usá protector solar amigable con los arrecifes', 'easy', 'low', 'honor', 300, 'recurring'],
  ['agua_azul', 'Sumate a un programa de monitoreo de cuencas', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['agua_azul', 'Desechá medicamentos correctamente', 'easy', 'medium', 'honor', 500, 'recurring'],
  // L — aire_suelo
  ['aire_suelo', 'Evitá quemar residuos al aire libre', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['aire_suelo', 'Usá cortadora manual o eléctrica en vez de nafta', 'medium', 'low', 'photo_ai', 500, 'recurring'],
  ['aire_suelo', 'Mejorá la salud del suelo sin labranza', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['aire_suelo', 'Evitá compost a base de turba', 'easy', 'medium', 'honor', 500, 'one_time'],
  ['aire_suelo', 'Plantá para dar sombra y enfriar la ciudad', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['aire_suelo', 'Reducí el uso de leña o usá cocinas más limpias', 'medium', 'medium', 'honor', 750, 'recurring'],
  ['aire_suelo', 'Armá un cantero alimentado con compost', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  // M — ciencia
  ['ciencia', 'Registrá una observación de biodiversidad', 'easy', 'medium', 'photo_ai', 500, 'recurring'],
  ['ciencia', 'Hacé un conteo de aves', 'easy', 'medium', 'photo_ai', 500, 'recurring'],
  ['ciencia', 'Reportá mediciones de calidad de aire', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['ciencia', 'Subí un geo-tag de basura encontrada', 'easy', 'low', 'photo_ai', 300, 'recurring'],
  ['ciencia', 'Participá de un bioblitz urbano', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['ciencia', 'Monitoreá una población local de polinizadores', 'medium', 'medium', 'photo_ai', 750, 'recurring'],
  ['ciencia', 'Fotografiá fenología (floración, migración)', 'easy', 'medium', 'photo_ai', 500, 'recurring'],
  ['ciencia', 'Reportá avistajes de especies invasoras', 'easy', 'medium', 'photo_ai', 500, 'recurring'],
];

// Reserved pool released 1-2/week (active=false). [domain,title,effort,impact,verif,points,freq]
const RESERVED = [
  ['residuos', 'Armá un kit reutilizable para llevar siempre', 'easy', 'low', 'honor', 300, 'one_time'],
  ['agua', 'Medí tu consumo de agua una semana', 'easy', 'low', 'honor', 300, 'weekly'],
  ['energia', 'Sellá ventanas para el invierno', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['movilidad', 'Probá una semana de teletrabajo total', 'medium', 'medium', 'honor', 750, 'weekly'],
  ['plantas', 'Armá un compost de hojas (mantillo)', 'easy', 'low', 'honor', 300, 'one_time'],
  ['animales', 'Construí una caja nido para aves', 'medium', 'medium', 'photo_ai', 750, 'one_time'],
  ['alimentacion', 'Probá una receta de aprovechamiento total', 'easy', 'medium', 'honor', 500, 'recurring'],
  ['consumo', 'Armá un fondo para reparar en vez de reemplazar', 'easy', 'low', 'honor', 300, 'one_time'],
  ['digital', 'Configurá backups eficientes y borrá duplicados', 'easy', 'low', 'honor', 300, 'one_time'],
  ['comunidad', 'Proponé una huerta en tu edificio', 'medium', 'medium', 'honor', 750, 'one_time'],
  ['agua_azul', 'Sumate a un día de limpieza submarina o costera', 'medium', 'medium', 'photo_ai', 1000, 'recurring'],
  ['aire_suelo', 'Hacé un test de calidad de tu suelo', 'medium', 'low', 'photo_ai', 500, 'one_time'],
  ['ciencia', 'Sumate a un proyecto de fenología estacional', 'easy', 'medium', 'photo_ai', 500, 'recurring'],
  ['plantas', 'Creá un rincón de plantas nativas en macetas', 'easy', 'low', 'photo_ai', 500, 'one_time'],
  ['energia', 'Hacé un mapa de consumo de tus electrodomésticos', 'medium', 'low', 'honor', 500, 'one_time'],
];

// ── Copy templates (Spanish, voseo) ──────────────────────────────────────────
const SHORT = {
  residuos: 'Menos basura, más vueltas.',
  agua: 'Cada gota suma.',
  energia: 'Menos consumo, menos CO₂.',
  movilidad: 'Moverte limpio.',
  plantas: 'Sembrá vida.',
  animales: 'Una mano a la fauna.',
  alimentacion: 'Comé cuidando el planeta.',
  consumo: 'Comprá mejor.',
  digital: 'Aligerá tu huella digital.',
  comunidad: 'Hacelo con otros.',
  agua_azul: 'Cuidá el agua azul.',
  aire_suelo: 'Aire y suelo más sanos.',
  ciencia: 'Ayudá a la ciencia.',
};
const IMPACT_SENT = {
  high: 'Es una de las acciones de mayor impacto real.',
  medium: 'Suma un impacto concreto y sostenido.',
  low: 'Un gesto chico que, repetido, hace una gran diferencia.',
};
const EQUIV = {
  agua: { low: 'Ahorrás ~20 L de agua', medium: 'Ahorrás ~50 L de agua', high: 'Ahorrás cientos de litros' },
  energia: { low: 'Bajás un poco tu consumo', medium: 'Evitás varios kg de CO₂', high: 'Evitás cientos de kg de CO₂ al año' },
  movilidad: { low: 'Ahorrás un poco de combustible', medium: 'Evitás varios kg de CO₂', high: 'Evitás muchos kg de CO₂' },
  alimentacion: { low: 'Reducís tu huella de comida', medium: 'Ahorrás agua y emisiones', high: 'Evitás una buena dosis de CO₂ y agua' },
  residuos: { low: 'Desviás residuos del relleno', medium: 'Desviás varios kg de residuos', high: 'Desviás mucha basura del relleno' },
  plantas: { low: 'Sumás verde a tu entorno', medium: 'Ayudás a polinizadores y al aire', high: 'Capturás carbono y das hábitat' },
  animales: { low: 'Ayudás a la fauna local', medium: 'Das refugio y alimento a la fauna', high: 'Protegés especies de verdad' },
  consumo: { low: 'Alargás la vida de las cosas', medium: 'Evitás producción y residuos', high: 'Reducís mucho tu huella de consumo' },
  digital: { low: 'Aligerás tu huella digital', medium: 'Reducís energía y e-waste', high: 'Bajás bastante tu huella digital' },
  comunidad: { low: 'Sumás al barrio', medium: 'Multiplicás el impacto con otros', high: 'Generás cambio colectivo real' },
  agua_azul: { low: 'Cuidás ríos y costas', medium: 'Evitás contaminación del agua', high: 'Protegés ecosistemas acuáticos' },
  aire_suelo: { low: 'Cuidás el aire y el suelo', medium: 'Mejorás aire y suelo locales', high: 'Mejorás mucho aire y suelo' },
  ciencia: { low: 'Aportás un dato a la ciencia', medium: 'Tus datos ayudan a investigar', high: 'Contribuís a estudios reales' },
};

function descFor(title, domain, impact) {
  return `${title}. ${IMPACT_SENT[impact]}`;
}
function instrFor(title, verif) {
  return verif === 'photo_ai'
    ? 'Hacé la acción, sacá una foto clara y subila para verificar (sumás un bonus).'
    : 'Hacé la acción y marcala para sumar tus puntos al instante.';
}
function equivFor(domain, impact) {
  return (EQUIV[domain] && EQUIV[domain][impact]) || 'Tu impacto positivo crece';
}

// ── Titles (§7.1) ────────────────────────────────────────────────────────────
const MASTERY = {
  agua: ['Cuidador del Agua', 'Guardián del Agua', 'Maestro del Agua'],
  residuos: ['Reciclador', 'Héroe Cero Residuos', 'Campeón Circular'],
  animales: ['Amigo de los Animales', 'Protector de la Fauna', 'Guardián Silvestre'],
  plantas: ['Jardinero', 'Sembrador', 'Maestro Verde'],
  movilidad: ['Pedaleador', 'Viajero Limpio', 'Maestro de la Movilidad'],
  energia: ['Ahorrador', 'Eficiente', 'Maestro de la Energía'],
  alimentacion: ['Cocina Consciente', 'Plant-Forward', 'Maestro de la Alimentación'],
  consumo: ['Comprador Consciente', 'Minimalista', 'Maestro del Consumo'],
  digital: ['Higiene Digital', 'Eco-Digital', 'Maestro Digital'],
  comunidad: ['Vecino Activo', 'Organizador', 'Líder Comunitario'],
  agua_azul: ['Amigo del Mar', 'Guardián Costero', 'Maestro del Océano'],
  aire_suelo: ['Cuida-Suelos', 'Aire Limpio', 'Maestro de la Tierra'],
  ciencia: ['Observador', 'Naturalista', 'Maestro Ciudadano'],
};
const MASTERY_THRESHOLDS = [2000, 10000, 30000];
const MASTERY_RARITY = ['common', 'rare', 'epic'];

const titles = [];
for (const [dom, names] of Object.entries(MASTERY)) {
  names.forEach((name, i) => {
    titles.push({
      slug: slugify(`${dom}-${i + 1}`),
      name_es: name,
      domain_slug: dom,
      requirement_type: 'domain_points',
      requirement_value: MASTERY_THRESHOLDS[i],
      requirement_domain: dom,
      rarity: MASTERY_RARITY[i],
      desc: `Sumá ${MASTERY_THRESHOLDS[i].toLocaleString('es-AR')} puntos en ${dom}.`,
    });
  });
}
const RANK_TITLES = [
  ['recien-brotado', 'Recién Brotado', 'rank', 2, 'rare', 'Llegaste al rango Brote.'],
  ['raices-firmes', 'Raíces Firmes', 'rank', 6, 'epic', 'Llegaste al rango Árbol.'],
  ['guardian-del-planeta', 'Guardián del Planeta', 'rank', 10, 'epic', 'Llegaste al rango Planeta.'],
  ['leyenda-viva', 'Leyenda Viva', 'rank', 11, 'legendary', 'Alcanzaste Gaia. Sos leyenda.'],
];
for (const [slug, name, rt, rv, rar, d] of RANK_TITLES)
  titles.push({ slug, name_es: name, domain_slug: null, requirement_type: rt, requirement_value: rv, requirement_domain: null, rarity: rar, desc: d });
const BEHAVIOR_TITLES = [
  ['imparable', 'Imparable', 'streak', 30, 'epic', 'Mantené una racha de 30 días.'],
  ['centenario', 'Centenario', 'streak', 100, 'legendary', 'Mantené una racha de 100 días.'],
  ['verificado', 'Verificado', 'verified', 10, 'rare', 'Verificá 10 acciones con foto.'],
  ['madrugador', 'Madrugador', 'special', 0, 'rare', 'Hacé 10 acciones diarias temprano.'],
  ['constructor-comunidad', 'Constructor de Comunidad', 'special', 0, 'epic', 'Creá un proyecto con 10 participantes.'],
];
for (const [slug, name, rt, rv, rar, d] of BEHAVIOR_TITLES)
  titles.push({ slug, name_es: name, domain_slug: null, requirement_type: rt, requirement_value: rv, requirement_domain: null, rarity: rar, desc: d });

// ── Badges (§7.2) ────────────────────────────────────────────────────────────
const badges = [
  ['primera-accion', 'Primera Acción', 'Tu primera acción completada.', 'activity_count', 1, null, 'common'],
  ['diez-acciones', 'Diez Acciones', 'Completaste 10 acciones.', 'activity_count', 10, null, 'common'],
  ['cincuenta-acciones', 'Cincuenta Acciones', 'Completaste 50 acciones.', 'activity_count', 50, null, 'rare'],
  ['centurion', '100 Acciones', 'Completaste 100 acciones.', 'activity_count', 100, null, 'epic'],
  ['primera-semana', 'Primera Semana', 'Racha de 7 días.', 'streak', 7, null, 'common'],
  ['racha-de-fuego', 'Racha de Fuego', 'Racha de 14 días.', 'streak', 14, null, 'rare'],
  ['mes-verde', 'Mes Verde', 'Racha de 30 días.', 'streak', 30, null, 'rare'],
  ['imparable-badge', 'Imparable', 'Racha de 100 días.', 'streak', 100, null, 'legendary'],
  ['verificado-x10', 'Verificado x10', '10 acciones verificadas.', 'verified', 10, null, 'rare'],
  ['explorador-agua', 'Explorador del Agua', '2.000 puntos en Agua.', 'domain_points', 2000, 'agua', 'rare'],
  ['manos-tierra', 'Manos a la Tierra', '2.000 puntos en Plantas.', 'domain_points', 2000, 'plantas', 'rare'],
  ['cero-residuos', 'Cero Residuos', '2.000 puntos en Residuos.', 'domain_points', 2000, 'residuos', 'rare'],
  ['sobre-ruedas', 'Sobre Ruedas', '2.000 puntos en Movilidad.', 'domain_points', 2000, 'movilidad', 'rare'],
  ['ahorrador-badge', 'Ahorrador', '2.000 puntos en Energía.', 'domain_points', 2000, 'energia', 'rare'],
  ['plato-verde', 'Plato Verde', '2.000 puntos en Alimentación.', 'domain_points', 2000, 'alimentacion', 'rare'],
  ['amigo-animal', 'Amigo Animal', '2.000 puntos en Animales.', 'domain_points', 2000, 'animales', 'rare'],
  ['cientifico-ciudadano', 'Científico Ciudadano', '2.000 puntos en Ciencia.', 'domain_points', 2000, 'ciencia', 'rare'],
  ['maestria-agua', 'Maestría del Agua', '10.000 puntos en Agua.', 'domain_points', 10000, 'agua', 'epic'],
  ['leyenda-verde', 'Leyenda Verde', 'Alcanzaste el rango Gaia.', 'rank', 11, null, 'legendary'],
  ['primer-arbol', 'Primer Árbol', 'Plantaste tu primer árbol.', 'special', 0, null, 'rare'],
  ['primer-proyecto', 'Primer Proyecto', 'Creaste tu primer proyecto.', 'special', 0, null, 'rare'],
  ['polinizador', 'Polinizador', 'Ayudaste a los polinizadores.', 'special', 0, null, 'rare'],
  ['limpieza-costera', 'Limpieza Costera', 'Sumaste a una limpieza costera.', 'special', 0, null, 'epic'],
  ['todo-en-un-dia', 'Todo en un Día', 'Completaste el set diario.', 'special', 0, null, 'common'],
  ['madrugador-badge', 'Madrugador', 'Acciones a primera hora.', 'special', 0, null, 'rare'],
];

// ── Challenges (§14.6) ───────────────────────────────────────────────────────
const dailyChallenges = [
  ['Sumá 2 acciones de Agua hoy', 'agua', 'domain_completions', 2, 300],
  ['Hacé 1 acción de Movilidad', 'movilidad', 'domain_completions', 1, 200],
  ['Completá 3 acciones diarias', null, 'daily_actions', 3, 300],
  ['Sumá 1 acción de Alimentación', 'alimentacion', 'domain_completions', 1, 200],
  ['Reciclá: 2 acciones de Residuos', 'residuos', 'domain_completions', 2, 300],
  ['Día verde: 4 acciones diarias', null, 'daily_actions', 4, 400],
  ['Sumá 1 acción de Energía', 'energia', 'domain_completions', 1, 200],
  ['Cuidá la fauna: 1 acción de Animales', 'animales', 'domain_completions', 1, 200],
  ['Sumá 1 acción de Plantas', 'plantas', 'domain_completions', 1, 200],
  ['Mantené tu racha hoy', null, 'daily_actions', 1, 150],
];
const weeklyChallenges = [
  ['Semana del Agua', 'agua', 'domain_completions', 5, 1000, 'semilla'],
  ['Movilidad limpia', 'movilidad', 'domain_completions', 4, 1000, 'semilla'],
  ['Plato a base de plantas', 'alimentacion', 'domain_completions', 5, 1000, 'semilla'],
  ['Reto Cero Residuos', 'residuos', 'domain_completions', 6, 1200, 'semilla'],
  ['Reto comunitario', 'comunidad', 'domain_completions', 2, 1200, 'arbol'],
  ['Maratón verde', null, 'completions', 12, 1500, 'semilla'],
];
const seasonalChallenges = [
  ['Semana del Agua', 'agua', 'domain_completions', 10, 2500, 'semilla'],
  ['Bioblitz de Primavera', 'ciencia', 'domain_completions', 8, 2500, 'arbol'],
];

// ── Example projects (§14.6) ────────────────────────────────────────────────
const projects = [
  ['Limpieza en el Parque Tres de Febrero', 'Sumate a una jornada de limpieza en los bosques de Palermo. Llevamos guantes y bolsas.', 'limpieza', 'comunidad', 'Palermo', -34.5712, -58.4160, 100, 'semilla'],
  ['Plantación de nativas en Caballito', 'Plantamos especies nativas en una plaza del barrio. Cupos limitados.', 'plantacion', 'plantas', 'Caballito', -34.6190, -58.4400, 40, 'plantula'],
  ['Campaña de reciclaje en el edificio', 'Armamos puntos de separación y educamos a los vecinos.', 'reciclaje', 'residuos', 'Villa Crespo', -34.5990, -58.4380, null, 'semilla'],
  ['Limpieza costera en la Costanera Sur', 'Jornada de limpieza junto a la Reserva Ecológica. Registramos lo recolectado.', 'limpieza', 'agua_azul', 'Puerto Madero', -34.6110, -58.3530, 80, 'semilla'],
];

// ── News feeds + Pip copy + impact (app_state) ───────────────────────────────
const newsFeeds = [
  { name: 'Mongabay Latam', url: 'https://es.mongabay.com/feed/' },
  { name: 'Grist', url: 'https://grist.org/feed/' },
  { name: 'Yale e360', url: 'https://e360.yale.edu/feed.xml' },
  { name: 'The Guardian Environment', url: 'https://www.theguardian.com/environment/rss' },
  { name: 'UN Environment', url: 'https://www.unep.org/rss.xml' },
  { name: 'Mongabay', url: 'https://news.mongabay.com/feed/' },
];
const pipLines = [
  '¿Qué vas a hacer crecer hoy?',
  'Cada acción cuenta. En serio.',
  'Dale, una más y la rompés.',
  'Tu mundo te lo agradece.',
  '¡Buenísimo! Seguí así.',
  'Pequeños pasos, mundo enorme.',
];

// ── Emit SQL ─────────────────────────────────────────────────────────────────
let sql = `-- Brote seed data (BUILD_SPEC §14). GENERATED by scripts/gen-seed.mjs — do not edit by hand.\n-- Idempotent (on conflict do nothing + targeted deletes). Safe to re-run.\n\n`;

sql += `-- domains\n`;
for (const [slug, es, en, color, desc] of DOMAINS) {
  sql += `insert into domains (slug,name_es,name_en,color,icon,description_es,sort_order) values (${q(slug)},${q(es)},${q(en)},${q(color)},${q(slug)},${q(desc)},${DOMAINS.indexOf(DOMAINS.find((d) => d[0] === slug)) + 1}) on conflict (slug) do update set name_es=excluded.name_es,color=excluded.color,description_es=excluded.description_es;\n`;
}

sql += `\n-- ranks\n`;
for (const [slug, es, en, tier, xp, color, unlock] of RANKS) {
  sql += `insert into ranks (slug,name_es,name_en,tier,xp_threshold,divisions,color,icon,unlock_description_es) values (${q(slug)},${q(es)},${q(en)},${tier},${xp},5,${q(color)},${q(slug)},${q(unlock)}) on conflict (slug) do update set xp_threshold=excluded.xp_threshold,name_es=excluded.name_es,color=excluded.color,unlock_description_es=excluded.unlock_description_es;\n`;
}

// description_es + instructions_es are rendered client-side from lib/activity-copy.ts
// (mirrors descFor/instrFor) so the seed stays lean. short_es + impact_equivalency_es
// are stored because they vary and are shown on cards.
function activityTuple(domain, title, effort, impact, verif, points, freq, type, active, sort) {
  const slug = slugify(title);
  return `(${q(slug)},${q(type)},${q(domain)},${q(title)},${q(SHORT[domain])},${q(effort)},${q(impact)},${q(verif)},${points},${q(freq)},${q(domain)},${q(equivFor(domain, impact))},${active},${sort})`;
}
const actTuples = [];
DAILY.forEach((a, i) => actTuples.push(activityTuple(a[0], a[1], a[2], a[3], a[4], a[5], 'daily', 'daily', true, i + 1)));
CATALOG.forEach((a, i) => actTuples.push(activityTuple(a[0], a[1], a[2], a[3], a[4], a[5], a[6], 'catalog', true, i + 1)));
RESERVED.forEach((a, i) => actTuples.push(activityTuple(a[0], a[1], a[2], a[3], a[4], a[5], a[6], 'catalog', false, 900 + i)));
sql += `\n-- activities (${actTuples.length}: daily + catalog + reserved)\n`;
sql += `insert into activities (slug,type,domain_slug,title_es,short_es,effort,impact,verification,base_points,frequency,icon,impact_equivalency_es,active,sort_order) values\n${actTuples.join(',\n')}\non conflict (slug) do nothing;\n`;

sql += `\n-- titles (${titles.length})\n`;
const titleTuples = titles.map(
  (t) => `(${q(t.slug)},${q(t.name_es)},${q(t.domain_slug)},${q(t.requirement_type)},${t.requirement_value},${q(t.requirement_domain)},${q(t.rarity)},${q(t.domain_slug || 'special')},${q(t.desc)})`,
);
sql += `insert into titles (slug,name_es,domain_slug,requirement_type,requirement_value,requirement_domain,rarity,icon,description_es) values\n${titleTuples.join(',\n')}\non conflict (slug) do nothing;\n`;

sql += `\n-- badges (${badges.length})\n`;
const badgeTuples = badges.map(
  ([slug, name, desc, rt, rv, rd, rar]) => `(${q(slug)},${q(name)},${q(desc)},${q(rt)},${rv},${q(rd)},${q(rar)},${q(rd || 'special')})`,
);
sql += `insert into badges (slug,name_es,description_es,requirement_type,requirement_value,requirement_domain,rarity,icon) values\n${badgeTuples.join(',\n')}\non conflict (slug) do nothing;\n`;

sql += `\n-- challenges (re-seedable: clear prior seeds first)\n`;
sql += `delete from challenges;\n`;
const chalTuples = [];
const chalRow = (type, title, domain, metric, target, reward, minRank, days) =>
  `(${q(type)},${q(title)},${q(domain)},${q(metric)},${target},${reward},${q(minRank)},now(),${days ? `now() + interval '${days} days'` : 'null'},true)`;
for (const [title, domain, metric, target, reward] of dailyChallenges)
  chalTuples.push(chalRow('daily', title, domain, metric, target, reward, 'semilla', 1));
for (const [title, domain, metric, target, reward, minRank] of weeklyChallenges)
  chalTuples.push(chalRow('weekly', title, domain, metric, target, reward, minRank, 7));
for (const [title, domain, metric, target, reward, minRank] of seasonalChallenges)
  chalTuples.push(chalRow('seasonal', title, domain, metric, target, reward, minRank, 21));
sql += `insert into challenges (type,title_es,domain_slug,target_metric,target_value,reward_points,min_rank_slug,starts_at,ends_at,active) values\n${chalTuples.join(',\n')};\n`;

sql += `\n-- example projects (re-seedable: clear official seeds first)\n`;
sql += `delete from projects where creator_id is null;\n`;
const projTuples = projects.map(
  ([title, desc, type, domain, hood, lat, lng, max, minRank]) =>
    `(null,${q(title)},${q(desc)},${q(type)},${q(domain)},${q(hood)},${lat},${lng},${q(hood + ', CABA')},now() + interval '10 days','active',${q(minRank)},${max == null ? 'null' : max},500)`,
);
sql += `insert into projects (creator_id,title,description,type,domain_slug,neighborhood,lat,lng,location_text,event_date,status,min_rank_slug,max_participants,reward_points) values\n${projTuples.join(',\n')};\n`;

sql += `\n-- app_state config\n`;
sql += `insert into app_state (key,value,is_public) values ('news_feeds',${q(JSON.stringify(newsFeeds))}::jsonb,false) on conflict (key) do update set value=excluded.value;\n`;
sql += `insert into app_state (key,value,is_public) values ('pip_lines',${q(JSON.stringify(pipLines))}::jsonb,true) on conflict (key) do update set value=excluded.value;\n`;
sql += `insert into app_state (key,value,is_public) values ('featured_rotation',${q(JSON.stringify({ pointer: 0 }))}::jsonb,false) on conflict (key) do nothing;\n`;
sql += `insert into app_state (key,value,is_public) values ('gemini_usage',${q(JSON.stringify({ day: '', verify: 0, recommend: 0, news: 0 }))}::jsonb,false) on conflict (key) do nothing;\n`;

// Feature 1-2 catalog activities as "new this week".
sql += `\nupdate activities set is_featured = true, featured_week = (now() at time zone 'America/Argentina/Buenos_Aires')::date\n  where id in (select id from activities where type='catalog' and active order by created_at limit 2);\n`;

// Set an initial daily challenge pointer.
sql += `insert into app_state (key,value,is_public) values ('current_daily_challenge', (select jsonb_build_object('id', id) from challenges where type='daily' and active order by random() limit 1), true) on conflict (key) do update set value=excluded.value;\n`;

writeFileSync(out, sql);
const count = DAILY.length + CATALOG.length + RESERVED.length;
console.log(`Wrote ${out}`);
console.log(`Activities: ${DAILY.length} daily + ${CATALOG.length} catalog + ${RESERVED.length} reserved = ${count}`);
console.log(`Titles: ${titles.length} · Badges: ${badges.length} · Challenges: ${dailyChallenges.length + weeklyChallenges.length + seasonalChallenges.length} · Projects: ${projects.length}`);
