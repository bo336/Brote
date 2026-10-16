# Brote — Publicidad (guía del dueño)

> Reemplaza a `PUBLICIDAD.html` (agosto). Código: `lib/ads/`, `components/ads/`,
> migraciones `0134_publicidad.sql` y `0135_guia_publica.sql`, pantalla `/panel/publicidad`.
> Revisado contra la ayuda de AdSense el 2026-10-16. Las cifras de Google cambian: ante la duda, manda lo
> que diga tu cuenta de AdSense en **Pagos**.

## 0. En treinta segundos

- La publicidad **nace apagada**. Se prende y se apaga en `/panel/publicidad`, sin deploy, y el cambio llega
  a todos en menos de diez minutos.
- Hay dos fuentes: **Google AdSense** (la red de Google) y **anuncios directos** (sponsors que vendés vos y
  cargás en el panel). Cada lugar elige quién lo llena; por defecto, «directo si hay, si no AdSense».
- Pocos anuncios, siempre al pie del contenido o entre publicaciones, nunca encima de nada. Nunca a chicos,
  nunca a Brote+, nunca en los primeros días de una cuenta.
- Para cobrar AdSense: dominio propio (recomendado), cuenta de AdSense (mayor de 18), tres variables en
  Vercel, revisión de Google, PIN por correo a los US$ 10, y cobro mensual cuando el saldo pasa los US$ 100.

## 1. Cómo funciona

### 1.1 Dónde puede haber un anuncio (y en ningún otro lado)

| Lugar | Dónde exactamente | Por defecto |
|---|---|---|
| Plaza (`news-feed`) | Entre publicaciones: el primero después de la 5.ª, después uno cada 8, máximo 3 | Directo si hay, si no AdSense |
| Noticia (`news-article`) | Debajo del texto de una noticia, separado por una línea | Ídem |
| Ranking (`ranking-footer`) | Al pie de la tabla | Ídem |
| Acciones (`catalog-footer`) | Al pie del catálogo | Ídem |
| Guía pública (`guia`) | Debajo de cada acción de `/guia`, después del contenido. **También sin cuenta** | Ídem |
| Momento (`moment`) | Una tarjeta abajo al cerrar algo: tras 3 cierres, con 30 min entre una y otra, desde la 3.ª sesión | **Sólo directos** |

El momento nunca lleva AdSense: Google no permite sus anuncios en ventanas que la persona no abrió. Lo
frenan la app y la base.

### 1.2 Quién nunca ve un anuncio

- Cuentas de chicos (menores de 13), en ningún lugar.
- Brote+. Además, a quien tiene Brote+ ni siquiera se le descarga el script.
- Cuentas nuevas durante los **días de gracia** (3 por defecto). Los primeros días deciden si alguien se
  queda, y un anuncio ahí vale centavos.
- Quien no terminó el onboarding.
- Estas pantallas, para todos: Inicio, Tu mundo, perfil y ajustes, una acción en curso, la Academia en
  sesión, el Mercado, el panel, Brote+, negocios, notificaciones, crear proyecto, certificados, legales,
  login y onboarding.
- Visitantes sin cuenta: sólo en `/guia`.

Las cuentas de 13 a 17 años ven anuncios siempre **no personalizados**. Los directos los ven sólo si el
anuncio está marcado «Adultos y 13 a 17». Los adultos eligen en Ajustes → Publicidad (o en el aviso que
aparece una vez), y por defecto son no personalizados.

### 1.3 Cuántos

- Hasta **12 por persona y día** y **5 por sesión**, todos los lugares juntos. Al llegar al tope, los espacios
  no se dibujan.
- Un espacio que Google no llena **se pliega**: no queda un hueco.
- El script de AdSense recién se descarga cuando un espacio está por entrar en pantalla. Quien sólo usa
  Inicio y Tu mundo no lo baja nunca.

Todo esto se cambia en `/panel/publicidad` → Reglas. La base valida los rangos.

### 1.4 Qué se mide

`publicidad_metricas` lleva, por día, lugar y fuente, cuántos espacios se pidieron, cuántos se llenaron y
cuántos quedaron vacíos. `anuncios_metricas` lleva vistas (la mitad del anuncio en pantalla durante un
segundo) y clics de cada anuncio directo. Nada de eso dice quién: son contadores. Lo que **se cobra** en
AdSense lo dice AdSense, en Informes.

## 2. Encenderla, paso a paso

### 2.1 Antes de todo

1. Aplicar las migraciones del lanzamiento, entre ellas **0134** y **0135** (§8 de `docs/LANZAMIENTO.md`),
   y mergear la rama para que se despliegue.
2. Entrar a `/guia` y comprobar que lista las acciones. Es el contenido público que Google revisa: casi todo
   Brote está detrás del login, y sin `/guia` el revisor vería un sitio vacío.

### 2.2 Dominio propio (recomendado)

Se puede pedir AdSense con `brote-ft7m.vercel.app` (vercel.app está en la Public Suffix List, así que
`/ads.txt` en ese nombre vale). Pero el sitio queda dado de alta en AdSense **con ese nombre**: mudarse
después es pedir la revisión de nuevo. Si vas a tener dominio, compralo antes (`.com.ar` en NIC Argentina,
o un `.com`).

1. Vercel → proyecto → Settings → **Domains** → agregarlo y seguir las instrucciones de DNS.
2. Vercel → Settings → Environment Variables → `NEXT_PUBLIC_APP_URL = https://tudominio` (Production).
3. Supabase → Authentication → URL Configuration: **Site URL** con el dominio nuevo y el dominio en
   **Redirect URLs** (`https://tudominio/**`). Sin esto, el login con enlace y el de Google vuelven al dominio
   viejo.
4. Google Cloud → Credenciales → el cliente OAuth de Brote → agregar el dominio en orígenes autorizados.
5. Volver a desplegar.

### 2.3 Crear la cuenta de AdSense

Requisitos de Google:

- **Tener 18 años o más.** Si no, la cuenta la abre una madre, un padre o un tutor con **su** cuenta de Google,
  y los pagos van a esa persona.
- Una sola cuenta de AdSense por persona. El nombre del beneficiario tiene que coincidir con el titular de la
  cuenta bancaria donde vas a cobrar.
- Un sitio con contenido propio, útil y que se pueda leer.

Pasos: [adsense.google.com](https://adsense.google.com) → Comenzar → URL del sitio (el dominio) → país
**Argentina** → aceptar. AdSense te muestra tu **id de editor**: `ca-pub-` seguido de 16 dígitos.

### 2.4 Conectar Brote

1. Vercel → Environment Variables → `NEXT_PUBLIC_ADSENSE_CLIENT = ca-pub-XXXXXXXXXXXXXXXX` (Production y
   Preview) → **Redeploy**. Es una variable `NEXT_PUBLIC_`: sin un deploy nuevo no entra.
2. Con eso Brote ya:
   - pone la metaetiqueta `google-adsense-account` en todas las páginas;
   - sirve `/ads.txt` y `/app-ads.txt` con tu línea (`google.com, pub-…, DIRECT, f08c47fec0942fa0`).
3. En AdSense → **Sitios** → tu sitio → verificar con **Metaetiqueta** (o ads.txt). No uses «Fragmento de
   código AdSense»: Brote carga el script sólo donde hay un espacio, así que Google no lo encuentra en la
   portada.
4. **Solicitar revisión.** Tarda de unos días a unas semanas. Mientras tanto la publicidad queda apagada en el
   panel, y no hace falta nada más.

Si la rechazan por «contenido de poco valor»: revisá que `/guia` cargue sin cuenta, esperá unos días y volvé
a pedirla. El mensaje de rechazo dice qué ven.

### 2.5 Ya aprobada: los bloques

1. **Apagá los anuncios automáticos.** AdSense → Anuncios → Por sitio → editar → *Anuncios automáticos*:
   **desactivado**. Si quedan prendidos, Google pone anuncios donde quiere, incluso en pantallas de chicos, y
   se saltea todas las reglas de arriba. Es lo más importante de esta guía.
2. AdSense → Anuncios → **Por bloque de anuncios** → crear:

   | Bloque | Tipo | Variable de Vercel |
   |---|---|---|
   | Brote · Noticia | Display, adaptable | `NEXT_PUBLIC_ADSLOT_NEWS_ARTICLE` |
   | Brote · Ranking | Display, adaptable | `NEXT_PUBLIC_ADSLOT_RANKING` |
   | Brote · Acciones | Display, adaptable | `NEXT_PUBLIC_ADSLOT_CATALOG` |
   | Brote · Guía | Display, adaptable | `NEXT_PUBLIC_ADSLOT_GUIA` (si falta, usa el de Noticia) |
   | Brote · Plaza | In-feed (o Display) | `NEXT_PUBLIC_ADSLOT_NEWS_FEED` |

   De cada código que te muestra AdSense copiá **sólo el número** de `data-ad-slot="1234567890"`. Si el de
   la Plaza es in-feed, copiá también `data-ad-layout-key` a `NEXT_PUBLIC_ADSLOT_NEWS_FEED_LAYOUT_KEY`.
3. Cargar las variables → **Redeploy**.
4. Un lugar sin su bloque no se rompe: ahí sólo pueden ir anuncios directos.

### 2.6 Visitantes de Europa

AdSense → **Privacidad y mensajería** → *Reglamentos europeos* → crear el mensaje con las opciones por
defecto y publicarlo. Es la herramienta de consentimiento certificada que Google exige para el Espacio
Económico Europeo, el Reino Unido y Suiza, y la muestra el propio script de AdSense. Para Argentina no hace
falta nada más: el aviso de Brote y Ajustes → Publicidad ya cubren el consentimiento.

### 2.7 El rastreador (opcional, mejora los anuncios)

Google elige anuncios según el contenido de la página, y su rastreador no puede leer lo que está detrás del
login. Se le puede dar una cuenta:

1. Creá una cuenta de Brote **sólo para esto**, con un alias de tu correo que lleve `+` (ej.
   `tunombre+adsense@gmail.com`; llega a tu misma casilla) y terminá el onboarding. No uses tu cuenta personal.
2. Ponele contraseña: Entrar → *Olvidé mi contraseña* → el enlace del mail → `/auth/nueva-clave`. El
   rastreador entra con correo y contraseña, no con enlace.
3. En `/panel/pruebas` configurala como **adulto**: queda marcada de prueba, con el perfil privado, y no
   cuenta en la analítica ni en los rangos.
4. Vercel → `ADSENSE_CRAWLER_EMAIL = ese correo` → Redeploy. Sin esa variable, la entrada no existe (404), y
   sólo deja entrar a esa cuenta.
5. AdSense → Cuenta → Acceso y autorización → **Acceso del rastreador** → Agregar:
   - URL o directorio restringido: `https://tudominio/`
   - URL de inicio de sesión: `https://tudominio/auth/crawler`
   - Método: **POST**
   - Parámetros: `email` = el correo, `password` = la contraseña de esa cuenta, `next` = `/feed`

`robots.txt` ya le abre el paso a `Mediapartners-Google`.

### 2.8 Prender

`/panel/publicidad` → **Mostrar publicidad**. Para comprobarlo, entrá con una cuenta adulta gratis que tenga
más días que los de gracia, abrí la Plaza y bajá. Los primeros días una cuenta nueva de AdSense puede
mostrar espacios en blanco (que Brote pliega): es normal.

Para probar sin AdSense, cargá un anuncio directo de prueba y apagalo después.

## 3. Apagarla (sin romper nada)

| Qué querés | Cómo | Cuánto tarda |
|---|---|---|
| Nada de publicidad | `/panel/publicidad` → apagar **Mostrar publicidad** | ≤ 10 minutos, sin deploy |
| Sacarla de un lugar | Reglas → apagar ese lugar (o «Nada») | ≤ 10 minutos |
| Sólo directos, sin Google | Reglas → «Sólo directos» en cada lugar | ≤ 10 minutos |
| Sin AdSense para siempre | Borrar `NEXT_PUBLIC_ADSENSE_CLIENT` y los `NEXT_PUBLIC_ADSLOT_*` → Redeploy | Un deploy |

Apagada, ningún componente de Brote espera a un anuncio: los espacios no se dibujan y el resto de la app
sigue igual. Ninguna otra función depende de la publicidad.

## 4. Anuncios directos (sponsors propios)

Son la salida cuando AdSense paga poco o cuando una marca quiere llegar a la gente de Brote. Los vendés
vos, los cobrás vos (con factura, por fuera de Brote) y los cargás en `/panel/publicidad` → Anuncios directos.

- **Qué se carga:** nombre interno, anunciante (se ve), título (hasta 70), texto (hasta 160), botón, enlace
  `https://`, imagen opcional (JPG, PNG o WebP; horizontal, de unos 600 px de ancho o más; Brote la comprime).
- **Dónde:** uno o varios lugares (ninguno = todos los que admiten directos), provincias (ninguna = todo el
  país), público (sólo adultos, o adultos y 13 a 17), fechas desde/hasta.
- **Peso (1–100):** con dos anuncios vigentes en el mismo lugar, uno de peso 3 sale tres veces más que uno de
  peso 1. **Tope de vistas:** al llegar, deja de salir. Sirve para vender paquetes («10.000 vistas»).
- **Cómo se ve:** tarjeta con «Patrocinado · anunciante», el estilo de Brote, separada del contenido. El
  enlace pasa por `/api/anuncio/<id>`, que cuenta el clic y agrega `utm_source=brote&utm_medium=patrocinio`,
  así el anunciante lo ve en su analítica.
- **Qué no aceptar** (para cuidar la app y la cuenta de AdSense): alcohol, tabaco y vapeo, apuestas,
  política partidaria, salud con promesas, finanzas especulativas, y nada que contradiga lo que Brote enseña
  (lavado verde). Si dudás, no.
- **Con qué precio empezar:** por semana en un lugar, o por cada mil vistas. Los números del panel (vistas,
  clics, %) son los que le mostrás al anunciante.

En los lugares en «Directo si hay, si no AdSense», un sponsor vigente le gana a AdSense. El momento sólo
existe si hay algún directo vigente.

## 5. Cómo te paga Google

### 5.1 El calendario

1. Lo que se gana en un mes se cierra a principios del mes siguiente y pasa a tu **saldo** (AdSense → Pagos).
2. Si el saldo llega al **umbral de pago (US$ 100)** antes del día 20 y no hay retenciones, Google paga
   **entre el 21 y el 26**. Si no llega, se acumula para el mes siguiente: no se pierde.
3. Una transferencia tarda unos días más en verse en el banco.

### 5.2 Los umbrales (cuenta en dólares)

| Al llegar a | Pasa |
|---|---|
| US$ 10 | Google manda un **PIN de 6 dígitos por correo postal** a la dirección de pagos. Tarda 2 a 4 semanas, sin seguimiento. Hay 4 meses para cargarlo; con 3 errores, falla. Si no llega, se pide otro desde Pagos |
| US$ 10 | Ya podés cargar la **forma de pago** |
| US$ 100 | Se paga ese mes |

También te van a pedir **verificar tu identidad** (DNI) y los **datos fiscales**.

### 5.3 Formas de pago en Argentina

Según la tabla de Google: **transferencia bancaria internacional** (wire) y **Hyperwallet** (de PayPal).
Puede aparecer también el cheque, que es lento y difícil de cobrar. La transferencia electrónica local (EFT)
**no** está disponible para Argentina. Las opciones válidas son las que te muestra Pagos → Formas de pago.

- **Transferencia:** el banco tiene que estar en Argentina, como tu dirección de pagos. Necesitás titular
  (igual al beneficiario de AdSense), banco, CBU o número de cuenta y el **código SWIFT/BIC** del banco (te lo
  da el banco). Si tu banco lo permite, una **cuenta en dólares** evita una conversión. Preguntá en el banco
  cómo reciben «transferencias del exterior» y qué comisión cobran.
- **Hyperwallet:** te creás una cuenta ahí y desde Hyperwallet pasás la plata a tu banco.

### 5.4 Impuestos

- **Estados Unidos:** AdSense → Pagos → Configuración de pagos → Administrar información fiscal → formulario
  **W-8BEN** (persona). Argentina no tiene convenio con EE. UU., y en el formulario se declara si hacés
  actividades en EE. UU.; para un sitio operado desde Argentina normalmente no hay retención sobre los
  ingresos de AdSense. Sin el formulario la retención puede ser mayor.
- **Argentina:** es un ingreso tuyo y se declara. Si sos monotributista o responsable inscripto, en general se
  factura como exportación de servicios (factura E). Hablalo con un contador antes del primer cobro. Esta
  guía no es asesoramiento impositivo.

### 5.5 Qué esperar

En Argentina los anuncios pagan poco por vista. Lo que importa es el **RPM**: cuánto pagan cada mil páginas
vistas, en Informes. Hacé la cuenta con tu primer mes real, no con promedios de internet. Con las reglas de
Brote (pocos anuncios, sólo adultos, sólo gratis), AdSense ayuda a cubrir costos. Brote+ y los sponsors
directos rinden mucho más por persona.

## 6. Reglas de AdSense que no hay que romper

Romperlas puede cerrar la cuenta y hacer perder lo no cobrado.

- **Nunca hagas clic en tus propios anuncios**, ni pidas que lo hagan («apoyanos tocando un anuncio»). Para
  probar, usá la vista previa de AdSense o un anuncio directo.
- No muevas los anuncios a ventanas emergentes ni encima del contenido. Por eso el momento es sólo directo.
- No modifiques el código de los anuncios ni los ocultes. Plegar un espacio vacío está permitido.
- El contenido de la gente (Plaza, comentarios) tiene que cumplir las políticas de Google: la moderación y los
  reportes del panel también cuidan la cuenta de AdSense.
- Tráfico inválido: no compres visitas ni uses bots. Si AdSense avisa de tráfico raro, apagá la publicidad
  en el panel mientras lo revisás.

## 7. Variables de entorno (Vercel)

| Variable | Qué es | ¿Pública? |
|---|---|---|
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-…` (id de editor). Activa la metaetiqueta, ads.txt y AdSense | Sí, ya es pública |
| `NEXT_PUBLIC_ADSLOT_NEWS_FEED` | Bloque de la Plaza | Sí |
| `NEXT_PUBLIC_ADSLOT_NEWS_FEED_LAYOUT_KEY` | Sólo si el bloque de la Plaza es in-feed | Sí |
| `NEXT_PUBLIC_ADSLOT_NEWS_ARTICLE` | Bloque de Noticia (y de la Guía si no tiene el suyo) | Sí |
| `NEXT_PUBLIC_ADSLOT_RANKING` | Bloque del Ranking | Sí |
| `NEXT_PUBLIC_ADSLOT_CATALOG` | Bloque de Acciones | Sí |
| `NEXT_PUBLIC_ADSLOT_GUIA` | Bloque de la Guía | Sí |
| `ADS_TXT_EXTRA` | Líneas extra de ads.txt para otra red (una por renglón o separadas por `;`) | No |
| `ADSENSE_CRAWLER_EMAIL` | La cuenta del rastreador (§2.7) | No |
| `NEXT_PUBLIC_APP_URL` | El dominio (sitemap, robots, enlaces) | Sí |

Después de cambiar cualquier `NEXT_PUBLIC_…`, **Redeploy**. `/panel/publicidad` muestra cuáles están.

## 8. Dónde está cada cosa en el código

| Qué | Dónde |
|---|---|
| Todas las reglas (quién, dónde, cuántos, qué fuente) | `lib/ads/policy.ts`, con tests en `lib/ads/__tests__/` |
| Cargar AdSense, topes, métricas | `lib/ads/runtime.ts` |
| La decisión para toda la app | `components/ads/AdsProvider.tsx` |
| Un espacio | `components/ads/AdSlot.tsx` (`<AdSlot placement="…" />`) |
| La tarjeta del sponsor | `components/ads/AnuncioDirecto.tsx` |
| ads.txt | `lib/ads/ads-txt.ts`, `app/ads.txt/route.ts`, `app/app-ads.txt/route.ts` |
| Clic de un sponsor | `app/api/anuncio/[id]/route.ts` |
| Rastreador | `app/(auth)/auth/crawler/route.ts`, `app/robots.ts` |
| Guía pública | `app/guia/`, `lib/guia.ts`, `0135_guia_publica.sql` |
| Base | `0134_publicidad.sql` (`publicidad_estado`, `anuncio_elegir`, `anuncio_clic`, `publicidad_registrar`, `admin_publicidad*`) |

**Para agregar un lugar nuevo:** sumarlo a `Placement` y `PLACEMENTS` en `policy.ts`, a `CONFIG_DEFECTO`, a la
lista de lugares válidos de las funciones de 0134 (en una migración nueva), a `SLOT_IDS` en `runtime.ts` y al
panel. Después, poner `<AdSlot placement="…" />` **debajo** del contenido.

**Para cambiar de proveedor en el futuro** (otra red, Ad Manager): todo pasa por `UnidadAdsense` en
`AdSlot.tsx` y `cargarAdsense` en `runtime.ts`. La política, los topes, el interruptor y los directos no
cambian.

## 9. Problemas comunes

| Síntoma | Mirá |
|---|---|
| No aparece ningún anuncio | ¿Interruptor prendido? ¿Cuenta gratis, adulta, con más días que los de gracia y onboarding hecho? ¿Lugar prendido? ¿Tope del día alcanzado? ¿Bloqueador de anuncios? |
| AdSense nunca aparece, los directos sí | ¿`NEXT_PUBLIC_ADSENSE_CLIENT` y el `NEXT_PUBLIC_ADSLOT_*` de ese lugar, con redeploy? ¿Cuenta aprobada? |
| Los anuncios salen en cualquier lado | **Anuncios automáticos prendidos** en AdSense. Apagalos (§2.5) |
| ads.txt «no encontrado» en AdSense | Abrí `/ads.txt`: tiene que mostrar tu línea. Google tarda días en volver a leerlo |
| Tasa de llenado baja | Normal al principio y con anuncios no personalizados. Mejora con tráfico y con el rastreador (§2.7) |
| El PIN no llega | Revisá la dirección en Pagos. A las 3 semanas, pedí otro desde Pagos |
| El momento nunca aparece | Necesita un anuncio directo vigente para el lugar «Momento» |
