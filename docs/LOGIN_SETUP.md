# Arreglar el login — pasos que solo podés hacer vos

> Estado: el código ya está arreglado y desplegado. Lo que queda son **tres ajustes de
> configuración** en paneles externos (Supabase y Google), que no se pueden cambiar desde el
> repositorio. Sin ellos, el ingreso con Google y el enlace mágico van a seguir fallando.

## Qué encontré al investigar

Probé el ciclo de login en el navegador local, con una cuenta real, y comparé el código viejo
contra el nuevo. **Mi primera hipótesis era que las cookies de sesión no se guardaban — la
descarté con una prueba: el código viejo también las guardaba bien.** O sea que el bucle de
login no venía del código de cookies.

La causa que queda, y que explica exactamente el síntoma («elijo la cuenta de Google y vuelvo al
modal, en ciclo», idéntico con el enlace mágico), es la **lista de URLs de retorno permitidas en
Supabase**. El circuito es así:

1. La app manda a Google/Supabase una URL de retorno: `https://TU-DOMINIO/auth/callback`.
2. Supabase compara esa URL contra su lista de permitidas.
3. **Si no está en la lista, Supabase la ignora** y te devuelve a la *Site URL* en vez de a
   `/auth/callback`.
4. Como nunca se pasa por `/auth/callback`, no se canjea el código y no queda sesión.
5. El middleware ve que no hay sesión y te manda al login. → **Bucle, sin ningún mensaje.**

Lo mismo pasa con el enlace mágico, porque usa la misma lista.

---

## 1. Habilitar las URLs de retorno en Supabase (esto es lo que rompe el login)

Entrá a **Supabase → proyecto `Brote-SP` → Authentication → URL Configuration**:

**Site URL** — poné la URL real de producción:

```
https://brote-ft7m.vercel.app
```

**Redirect URLs** — agregá TODAS estas (una por línea). Hacen falta las de producción, las de
preview de Vercel y las locales, si no el login solo va a andar en un entorno:

```
https://brote-ft7m.vercel.app/**
http://localhost:3000/**
https://*-bo336s-projects.vercel.app/**
```

> El `/**` al final es importante: habilita `/auth/callback`, `/auth/confirm` y cualquier
> `?next=` que se agregue. Si preferís ser estricto, podés listar exactamente
> `https://brote-ft7m.vercel.app/auth/callback` y `.../auth/confirm`, pero entonces tenés que
> acordarte de agregar cada ruta nueva.

Guardá. El cambio es inmediato, no hace falta redeploy.

## 2. Revisar `NEXT_PUBLIC_APP_URL` en Vercel

En **Vercel → Settings → Environment Variables**, si existe `NEXT_PUBLIC_APP_URL` tiene que valer
exactamente la URL de producción (`https://brote-ft7m.vercel.app`), **nunca** `http://localhost:3000`.

Ya lo hice más difícil de romper: ahora el código compara esa variable con el dominio real del
pedido y, si no coinciden, **usa el dominio real e ignora la variable**. Así un valor viejo dejó
de poder tirar abajo el login en producción. Aun así, dejala correcta.

## 3. Que Google diga «Brote» y no la URL del proyecto

Esto es lo que te muestra «se compartirá tu info con `swdwulouasdnyorfhrjt.supabase.co`».
Son dos cosas distintas en esa pantalla:

**a) El nombre de la app («para continuar a …»)** — se arregla y es gratis.
Entrá a **Google Cloud Console → APIs y servicios → Pantalla de consentimiento de OAuth**:

- **Nombre de la aplicación**: `Brote`
- **Logo**: subí el ícono de Brote (`public/icons/`)
- **Correo de asistencia** y **dominios autorizados**: completalos
- Guardá

Con esto la pantalla pasa a decir «para continuar a **Brote**» con tu logo.

**b) El dominio técnico (`…supabase.co`)** — este NO se puede cambiar por configuración.
Google muestra ahí el dominio que recibe el retorno, que hoy es el de Supabase. Para que diga
tu dominio necesitás un **dominio de autenticación propio** en Supabase (*Custom Domain*, es un
add-on pago del plan Pro). Recién ahí el retorno pasa a ser `auth.brote.app` (o el que elijas) y
Google muestra eso.

**Mi recomendación:** hacé (a) ahora — es gratis y resuelve la mayor parte de la desconfianza,
porque la gente lee el nombre y el logo. Dejá (b) para cuando tengas dominio propio y el plan Pro.

---

## Qué cambié en el código

- **Los errores ahora se ven.** Antes, cualquier fallo del login redirigía a `/auth/login` sin
  ningún mensaje: por eso parecía un bucle inexplicable. Ahora la pantalla muestra qué pasó y,
  cuando lo hay, el detalle técnico. Si después de configurar lo de arriba algo sigue fallando,
  vas a poder leer el motivo y pasármelo.
- **Cliente de Supabase atado a la respuesta** en `/auth/callback` y `/auth/confirm`: las cookies
  de sesión se escriben directamente sobre la redirección que se devuelve, sin depender de que el
  framework las junte. No era la causa del bucle, pero elimina toda una categoría de fallas
  silenciosas.
- **`/auth/confirm` acepta los dos formatos** de enlace de Supabase (`token_hash` + `type`, y
  también `code`), así que un correo viejo generado con otra plantilla sigue funcionando.
- **Protección contra redirección abierta**: el parámetro `?next=` ahora se valida y solo admite
  rutas internas, para que nadie pueda usar el callback para mandar gente a un sitio externo.
- **Términos y privacidad legibles antes de aceptar**: `/legal/terminos` y `/legal/privacidad`
  son páginas públicas reales, enlazadas desde el login.

## Cómo verificar que quedó bien

1. Abrí una ventana de incógnito.
2. Entrá a la app → «Continuar con Google» → elegí la cuenta.
3. Tenés que caer en el inicio de la app, ya con sesión.
4. Si volvés al login, **ahora vas a ver un mensaje de error**: mandámelo tal cual y sabemos
   exactamente qué falta.
