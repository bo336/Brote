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

  // ── Catálogo ───────────────────────────────────────────────────────────────
  c('alarga-la-vida-de-tu-celular-un-ano-mas', 'Cuidá tu celular para que dure un año más', {
    dom, e: 'easy', i: 'high', min: 15, edad: 'ta', frec: 'one_time', ahorra: true,
    corto: 'Fabricar un celular emite más que años de usarlo.',
    desc: 'Casi toda la huella de un celular se genera al fabricarlo. Una funda, un vidrio templado, cuidar la batería y liberar espacio pueden estirar su vida un año o más, que es de lo más efectivo que se puede hacer en lo digital.',
    pasos: ['Ponele funda y vidrio templado.', 'Cuidá la batería: evitá el calor y las cargas toda la noche.', 'Si anda lento, liberá espacio antes de pensar en cambiarlo.'],
    ef: { c: 1.2 }, fuente: 'ewaste-monitor', tags: ['celular', 'bateria'], hereda: ['dig-alargar-vida-celular'],
  }),
  c('dig-cambia-bateria', 'Cambiá la batería del celular en vez del celular', {
    dom, e: 'medium', i: 'high', min: 60, formato: 'salida', edad: 'ta', costo: 'bajo', ahorra: true, cool: 8760,
    corto: 'Si lo que falla es la batería, el resto del teléfono tiene años por delante.',
    desc: 'Una batería que no dura el día es la razón más común para cambiar de celular, y casi siempre se puede reemplazar en un service por una fracción del precio de uno nuevo.',
    pasos: ['Revisá la "salud de la batería" en la configuración.', 'Pedí presupuesto en un service de confianza.', 'Si conviene, cambiala y seguí usando tu celular.'],
    ef: { c: 20, r: 0.2 }, tags: ['celular', 'bateria', 'arreglo'],
    mercado: ['reparacion-y-reuso', 'electronica', 'Técnicos que cambian la batería y reparan celulares. Estos negocios están en el programa de Brote.'],
  }),
  c('activa-los-modos-de-ahorro-de-energia', 'Activá el ahorro de energía y el apagado automático', {
    dom, e: 'easy', i: 'low', min: 10, edad: 'kta', frec: 'one_time',
    corto: 'La compu, la tele y la consola pueden apagarse solas cuando nadie las usa.',
    desc: 'La compu, el monitor, la tele y las consolas tienen modos de ahorro y apagado automático que vienen desactivados. Configurarlos una vez ahorra horas de consumo sin que tengas que acordarte.',
    pasos: ['En la compu, configurá que la pantalla se apague a los 5 minutos y que se suspenda a los 15.', 'En la tele y la consola, activá el apagado automático.'],
    ef: elec(1), tags: ['compu', 'tele', 'stand-by'],
  }),
  c('pasate-a-facturacion-digital', 'Pasate a la factura digital', {
    dom, e: 'easy', i: 'low', min: 15, edad: 'a', frec: 'one_time', lugar: 'celular',
    corto: 'La factura en papel viaja hasta tu casa para ir directo a la basura.',
    desc: 'Luz, gas, agua, internet, celular y tarjetas: casi todas ofrecen factura por mail o en la app. Activarla una vez ahorra papel, impresión y reparto todos los meses.',
    pasos: ['Entrá a la web o la app de cada servicio.', 'Buscá "factura digital" o "adherirse a e-factura".', 'Confirmá el mail donde querés recibirla.'],
    ef: { r: 0.02, c: 0.02 }, tags: ['papel', 'factura'],
  }),
  c('dig-dona-compu-vieja', 'Doná una compu o un celular que todavía funciona', {
    dom, e: 'easy', i: 'high', min: 30, formato: 'social', edad: 'ta', cool: 2160,
    corto: 'Lo que para vos quedó viejo, para una escuela o un estudiante puede ser su herramienta.',
    desc: 'Una notebook, una tablet o un celular que ya no usás pero funcionan pueden servirle a una escuela, una biblioteca popular, un centro comunitario o un estudiante. Es un aparato que sigue en uso en vez de juntar polvo.',
    pasos: ['Borrá tus datos y restaurá a fábrica.', 'Buscá una escuela, biblioteca u organización que reciba equipos.', 'Entregalo con su cargador.'],
    ef: { c: 5 }, tags: ['donar', 'compu', 'celular', 'escuela'],
  }),
];
