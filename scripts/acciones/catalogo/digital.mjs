// Digital — pantallas, celular, nube y aparatos que duran.
import { d, c, elec, nada } from '../dsl.mjs';

const dom = 'digital';

export default [
  // ── Del día ────────────────────────────────────────────────────────────────
  d('baja-la-resolucion-del-streaming', 'Mirá series en calidad normal, no en la máxima', {
    dom, e: 'easy', i: 'low', min: 1, lugar: 'celular',
    corto: 'En el celular o en una tele chica, la diferencia no se ve; en los datos y la energía, sí.',
    desc: 'El video es la mayor parte del tráfico de internet. Según la IEA, la huella de una hora de streaming es menor de lo que dicen muchos titulares, pero crece con la resolución y con la red móvil. En el celu, la calidad "estándar" alcanza.',
    pasos: ['En la app de series o videos, buscá "calidad de reproducción".', 'Elegí "automática" o "estándar" en el celular.', 'Dejá la alta para la tele grande, si la usás.'],
    ef: elec(0.03), fuente: 'iea-streaming', tags: ['streaming', 'chicos'],
  }),
  d('dig-audio-en-vez-de-video', 'Escuchá en audio lo que no necesitás ver', {
    dom, e: 'easy', i: 'low', min: 1, lugar: 'celular', rut: true,
    corto: 'Un video de música con la pantalla en el bolsillo transmite imágenes que nadie mira.',
    desc: 'Poner música o un podcast en una app de video manda imagen todo el tiempo. En una app de audio (o descargado), es una fracción de los datos y la batería del celu dura más.',
    pasos: ['Para música o podcasts, usá una app de audio o la opción de sólo audio.', 'Si escuchás siempre lo mismo, descargalo.'],
    ef: elec(0.02), tags: ['streaming', 'musica', 'chicos'],
  }),
  d('dig-usa-wifi-en-vez-de-datos', 'Usá wifi en vez de datos móviles cuando puedas', {
    dom, e: 'easy', i: 'low', min: 1, lugar: 'celular', rut: true,
    corto: 'La red móvil consume más energía por cada dato que el wifi de tu casa.',
    desc: 'Descargar fotos, actualizaciones o videos con datos móviles usa más energía que hacerlo por wifi, y además gasta tu plan. Dejá lo pesado para cuando estés en casa o en la escuela.',
    pasos: ['Configurá las actualizaciones y las copias de fotos "sólo con wifi".', 'Dejá las descargas grandes para cuando tengas wifi.'],
    ef: elec(0.01), tags: ['celular', 'chicos'], hereda: ['dig-wifi-en-vez-de-datos'],
  }),
  d('dig-apaga-la-camara-en-reuniones', 'Apagá la cámara cuando no hace falta', {
    dom, e: 'easy', i: 'low', min: 1, edad: 'ta', lugar: 'celular', rut: true,
    corto: 'En una reunión larga, el video pesa mucho más que el audio.',
    desc: 'En una clase o una reunión virtual donde sólo escuchás, apagar la cámara baja mucho los datos que se transmiten. Prendela cuando hables o cuando importe verse.',
    pasos: ['En las partes donde sólo escuchás, apagá la cámara.', 'Prendela para hablar o presentarte.'],
    ef: elec(0.02), tags: ['trabajo', 'escuela'],
  }),
  d('dig-no-imprimas', 'Resolvelo sin imprimir', {
    dom, e: 'easy', i: 'low', min: 1, edad: 'ta', rut: true,
    corto: 'Casi todo lo que se imprime se lee una vez y se tira.',
    desc: 'Entradas, pasajes, facturas, apuntes: hoy casi todo se puede mostrar en el celu o firmar digitalmente. Si hay que imprimir, a doble faz y en borrador.',
    pasos: ['Antes de imprimir, preguntate si lo podés leer o mostrar en pantalla.', 'Si hace falta, imprimí doble faz y en modo borrador.'],
    ef: { r: 0.02, c: 0.02 }, tags: ['papel', 'trabajo', 'escuela'], hereda: ['res-no-imprimir'],
  }),
  d('energia-pantalla-brillo', 'Bajá el brillo del celu y de la compu', {
    dom, e: 'easy', i: 'low', min: 1, lugar: 'celular',
    corto: 'La pantalla es de lo que más batería gasta.',
    desc: 'El brillo al máximo gasta batería y cansa la vista. Con el brillo automático o en un nivel cómodo, el celular dura más entre cargas, y la batería envejece más lento.',
    pasos: ['Activá el brillo automático.', 'Si no, bajalo a un nivel cómodo para el lugar donde estás.'],
    ef: elec(0.01), tags: ['celular', 'chicos'],
  }),
  d('ene-cargar-celu-de-dia', 'No dejes el celular cargando toda la noche', {
    dom, e: 'easy', i: 'low', min: 1, edad: 'ta', lugar: 'celular', rut: true,
    corto: 'Ocho horas enchufado para dos de carga gasta la batería antes de tiempo.',
    desc: 'Cargar de día y desenchufar cerca del 80-90% cuida la batería, que es lo primero que hace cambiar un celular. Muchos celulares tienen una opción de "carga optimizada" que lo hace solo.',
    pasos: ['Cargá el celu de día, cuando puedas desenchufarlo.', 'Activá la "carga optimizada" o "protección de batería" si tu celular la tiene.'],
    ef: elec(0.01), tags: ['celular', 'bateria'], hereda: ['ene-cargar-al-80'],
  }),
  d('borra-mails-y-archivos-viejos-que-no-usas', 'Borrá fotos repetidas y videos que no vas a volver a ver', {
    dom, e: 'easy', i: 'low', min: 5, lugar: 'celular',
    corto: 'Todo lo guardado ocupa discos encendidos en algún lado.',
    desc: 'Las fotos en ráfaga, los videos de grupos y los archivos duplicados ocupan espacio en tu celu y en la nube. Borrarlos de a poco libera lugar y alarga la vida del teléfono, que se pone lento cuando está lleno.',
    pasos: ['Abrí la galería y borrá 20 fotos repetidas o videos que no vas a mirar.', 'Vaciá la papelera de la galería.'],
    ef: nada(), tags: ['nube', 'celular', 'chicos'],
  }),
  d('dig-buscar-antes-de-preguntar-ia', 'Usá la inteligencia artificial cuando suma, no por costumbre', {
    dom, e: 'easy', i: 'low', min: 1, edad: 'ta', lugar: 'celular',
    corto: 'Cada consulta a un modelo de IA corre en centros de datos que consumen energía real.',
    desc: 'La IEA calcula que el consumo de los centros de datos crece rápido por la inteligencia artificial. Para un dato simple, un buscador o una página oficial alcanzan; dejá la IA para lo que de verdad la necesita.',
    pasos: ['Para un dato simple, buscalo directamente.', 'Usá la IA para tareas que la necesiten de verdad, con una consulta clara.'],
    ef: nada(), fuente: 'iea-energia-ia', tags: ['ia', 'digital'],
  }),

  // ── Catálogo ───────────────────────────────────────────────────────────────
  c('limpia-tu-nube-y-borra-archivos-viejos', 'Limpiá tu nube de duplicados y archivos que no usás', {
    dom, e: 'easy', i: 'low', min: 30, edad: 'ta', lugar: 'celular', cool: 2160,
    corto: 'Las copias duplicadas se acumulan sin que las veas, en servidores que nunca se apagan.',
    desc: 'Las copias automáticas de fotos, los archivos adjuntos y las carpetas viejas ocupan espacio en servidores que funcionan día y noche. Una limpieza cada tanto ordena tu nube y muchas veces te evita pagar más espacio.',
    pasos: ['Entrá a tu nube y ordená por tamaño.', 'Borrá videos y archivos grandes que no necesitás.', 'Buscá y borrá duplicados.'],
    ef: nada(), fuente: 'iea-datacenters', tags: ['nube'], hereda: ['dig-limpiar-nube'],
  }),
  c('desuscribite-de-newsletters-que-no-lees', 'Desuscribite de los mails que no leés', {
    dom, e: 'easy', i: 'low', min: 15, edad: 'ta', lugar: 'celular', cool: 2160,
    corto: 'Cada mail que no abrís igual se envió, se guardó y te robó un segundo.',
    desc: 'Newsletters, avisos y notificaciones que nunca abrís llenan la casilla y los servidores. Darte de baja de los que no lees deja tu mail más ordenado y con menos distracciones.',
    pasos: ['Buscá en tu mail los envíos que nunca abrís.', 'Tocá "desuscribirse" al pie de cada uno.'],
    ef: nada(), tags: ['mail'], hereda: ['dig-desuscribirse'],
  }),
  c('alarga-la-vida-de-tu-celular-un-ano-mas', 'Cuidá tu celular para que dure un año más', {
    dom, e: 'easy', i: 'high', min: 15, edad: 'ta', frec: 'one_time', ahorra: true,
    corto: 'Fabricar un celular emite más que años de usarlo.',
    desc: 'Casi toda la huella de un celular se genera al fabricarlo. Una funda, un vidrio templado, cuidar la batería y liberar espacio pueden estirar su vida un año o más, que es de lo más efectivo que se puede hacer en lo digital.',
    pasos: ['Ponele funda y vidrio templado.', 'Cuidá la batería: evitá el calor y las cargas toda la noche.', 'Si anda lento, liberá espacio antes de pensar en cambiarlo.'],
    ef: { c: 15 }, fuente: 'ewaste-monitor', tags: ['celular', 'bateria'], hereda: ['dig-alargar-vida-celular'],
  }),
  c('dig-cambia-bateria', 'Cambiá la batería del celular en vez del celular', {
    dom, e: 'medium', i: 'high', min: 60, formato: 'salida', edad: 'ta', costo: 'bajo', ahorra: true, cool: 8760,
    corto: 'Si lo que falla es la batería, el resto del teléfono tiene años por delante.',
    desc: 'Una batería que no dura el día es la razón más común para cambiar de celular, y casi siempre se puede reemplazar en un service por una fracción del precio de uno nuevo.',
    pasos: ['Revisá la "salud de la batería" en la configuración.', 'Pedí presupuesto en un service de confianza.', 'Si conviene, cambiala y seguí usando tu celular.'],
    ef: { c: 20, r: 0.2 }, tags: ['celular', 'bateria', 'arreglo'],
  }),
  c('activa-los-modos-de-ahorro-de-energia', 'Activá el ahorro de energía y el apagado automático', {
    dom, e: 'easy', i: 'low', min: 10, edad: 'kta', frec: 'one_time',
    corto: 'La compu, la tele y la consola pueden apagarse solas cuando nadie las usa.',
    desc: 'La compu, el monitor, la tele y las consolas tienen modos de ahorro y apagado automático que vienen desactivados. Configurarlos una vez ahorra horas de consumo sin que tengas que acordarte.',
    pasos: ['En la compu, configurá que la pantalla se apague a los 5 minutos y que se suspenda a los 15.', 'En la tele y la consola, activá el apagado automático.'],
    ef: elec(1), tags: ['compu', 'tele', 'stand-by'],
  }),
  c('dig-descarga-en-vez-de-repetir', 'Descargá la música que escuchás todos los días', {
    dom, e: 'easy', i: 'low', min: 10, edad: 'kta', lugar: 'celular', cool: 2160,
    corto: 'Escuchar lo mismo por streaming lo transmite entero cada vez.',
    desc: 'Tus playlists de siempre, descargadas, se escuchan sin datos y sin volver a transmitirse cada vez. Funciona también para los podcasts y las series que mirás más de una vez.',
    pasos: ['Descargá tus listas favoritas con wifi.', 'Activá el modo sin conexión cuando salgas.'],
    ef: elec(0.5), tags: ['streaming', 'musica'], hereda: ['dig-descargar-en-vez-de-stream'],
  }),
  c('pasate-a-facturacion-digital', 'Pasate a la factura digital', {
    dom, e: 'easy', i: 'low', min: 15, edad: 'a', frec: 'one_time', lugar: 'celular',
    corto: 'La factura en papel viaja hasta tu casa para ir directo a la basura.',
    desc: 'Luz, gas, agua, internet, celular y tarjetas: casi todas ofrecen factura por mail o en la app. Activarla una vez ahorra papel, impresión y reparto todos los meses.',
    pasos: ['Entrá a la web o la app de cada servicio.', 'Buscá "factura digital" o "adherirse a e-factura".', 'Confirmá el mail donde querés recibirla.'],
    ef: { r: 0.1, c: 0.1 }, tags: ['papel', 'factura'],
  }),
  c('dig-reproduccion-automatica', 'Desactivá la reproducción automática de videos', {
    dom, e: 'easy', i: 'low', min: 5, edad: 'kta', frec: 'one_time', lugar: 'celular',
    corto: 'Los videos que arrancan solos en redes y apps transmiten aunque no los mires.',
    desc: 'En redes sociales y apps de video, la reproducción automática descarga videos que pasás de largo. Desactivarla (o dejarla sólo con wifi) ahorra datos, batería y tiempo.',
    pasos: ['En cada red social, buscá "reproducción automática" en la configuración.', 'Elegí "nunca" o "sólo con wifi".'],
    ef: elec(0.5), tags: ['redes', 'streaming'],
  }),
  c('dig-modo-oscuro', 'Usá el modo oscuro si tu pantalla es OLED', {
    dom, e: 'easy', i: 'low', min: 5, edad: 'kta', frec: 'one_time', lugar: 'celular',
    corto: 'En las pantallas OLED, el negro es un píxel apagado.',
    desc: 'Muchos celulares de gama media y alta tienen pantalla OLED, donde el negro no consume. El modo oscuro ahí estira la batería, y de noche cansa menos la vista.',
    pasos: ['Fijate si tu celular tiene pantalla OLED o AMOLED.', 'Activá el modo oscuro en la configuración y en tus apps.'],
    ef: elec(0.2), tags: ['celular', 'bateria'],
  }),
  c('dig-dona-compu-vieja', 'Doná una compu o un celular que todavía funciona', {
    dom, e: 'easy', i: 'high', min: 30, formato: 'social', edad: 'ta', cool: 2160,
    corto: 'Lo que para vos quedó viejo, para una escuela o un estudiante puede ser su herramienta.',
    desc: 'Una notebook, una tablet o un celular que ya no usás pero funcionan pueden servirle a una escuela, una biblioteca popular, un centro comunitario o un estudiante. Es un aparato que sigue en uso en vez de juntar polvo.',
    pasos: ['Borrá tus datos y restaurá a fábrica.', 'Buscá una escuela, biblioteca u organización que reciba equipos.', 'Entregalo con su cargador.'],
    ef: { c: 5 }, tags: ['donar', 'compu', 'celular', 'escuela'],
  }),
  c('dig-apps-que-no-usas', 'Borrá las apps que no usás', {
    dom, e: 'easy', i: 'low', min: 10, edad: 'kta', lugar: 'celular', cool: 2160,
    corto: 'Muchas apps se actualizan y trabajan en segundo plano aunque no las abras.',
    desc: 'Las apps que no abrís hace meses igual se actualizan, mandan notificaciones y consumen batería. Borrarlas libera espacio y hace que el celu ande mejor por más tiempo.',
    pasos: ['Revisá la lista de apps instaladas.', 'Borrá las que no abriste en los últimos tres meses.'],
    ef: nada(), tags: ['celular'],
  }),
  c('dig-tarde-sin-pantallas', 'Hacé una tarde sin pantallas', {
    dom, e: 'medium', i: 'low', min: 180, formato: 'reto', edad: 'kta', cool: 168,
    corto: 'Una tarde afuera, con un libro o con amigos: el mejor modo ahorro.',
    desc: 'Una tarde sin celular, tele ni consola es energía que no se gasta y tiempo para otra cosa: salir a la plaza, jugar, cocinar, leer, mirar el cielo. Hacela en familia o con amigos, es más fácil.',
    pasos: ['Elegí una tarde y avisale a tu familia o amigos.', 'Apagá o guardá las pantallas.', 'Hacé algo afuera o con las manos.'],
    ef: elec(0.3), tags: ['reto', 'familia', 'chicos'],
  }),
];
