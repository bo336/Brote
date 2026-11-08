# Correos de acceso en castellano

Supabase manda estos correos con sus textos en inglés. Para cambiarlos: Supabase → Authentication → Emails → Templates.
En cada plantilla, pegá el asunto y el HTML del archivo:

| Plantilla en Supabase | Asunto | Archivo |
|---|---|---|
| Confirm signup | Confirmá tu correo para Brote | `confirmacion.html` |
| Magic Link | Tu enlace para entrar a Brote | `enlace-magico.html` |
| Reset Password | Elegí una contraseña nueva | `recuperar.html` |
| Change Email Address | Confirmá tu correo nuevo | `cambio-correo.html` |

Usan `{{ .ConfirmationURL }}`: la app ya recibe ese enlace en `/auth/confirm`, venga con `code` o con `token_hash`.
Antes, en Authentication → URL Configuration, la Site URL tiene que ser la dirección de la app (no la de Supabase)
y en Redirect URLs tiene que estar `https://<tu dominio>/auth/**`.
