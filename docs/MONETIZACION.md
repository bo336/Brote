# Brote — Modelo de negocio y motor de hábito

> Principio rector: **la calidad del mundo 3D es el producto que se vende.** Nadie paga
> por una app fea; pagan por proteger algo que aman. Primero enamorar, después cobrar.

## 1. Los 4 motores de ingreso (en orden de implementación)

### 1.1 Brote+ (suscripción freemium) — el motor principal
- **Precio:** AR ~USD 2.99/mes o 24.99/año (MercadoPago); global USD 3.99 (LemonSqueezy).
- **Qué incluye (todo cosmético/conveniencia, NUNCA pay-to-win):**
  - Biomas exclusivos y paletas premium para tus mundos (aurora, sakura, coral).
  - Accesorios premium para Pip / avatar (F9).
  - 2 protectores de racha por mes (gratis: hay que ganarlos).
  - **Savia ilimitada en la Academia**: sin tope de hojas nuevas por día. El plan
    gratuito trae 5 y el medidor ni siquiera se dibuja para quien tiene Brote+.
    Regar —repasar lo que ya se sabe— es gratis para todo el mundo y siempre lo va
    a ser: el límite frena territorio nuevo, nunca la retención de lo aprendido.
  - Estadísticas avanzadas + recap semanal narrado por IA.
  - Insignia Brote+ en rankings y perfil.
- **Por qué funciona:** el usuario ya invirtió semanas en su mundo → pagar por embellecerlo
  es proteger su inversión emocional (mismo loop de Duolingo Super/Forest Pro).

> **Costo del contenido de la Academia.** El pipeline genera en LOTE (mitad del
> precio del modo interactivo) y contra un piso de pool, no contra un reloj:
> solo se fabrica lo que alguien está por necesitar. Hay un tope mensual duro en
> `app_settings.academia_presupuesto_centavos` (arranca en US$ 20) que se
> consulta ANTES de cada envío; al llegar, la generación se detiene y lo
> registra — nunca baja una compuerta de calidad para seguir corriendo. El gasto
> del mes se ve en `/panel`.

### 1.2 Semillas (moneda blanda) + tienda de cosméticos
- Se GANAN con retos/objetivos/ligas (nunca caducan). Compran: decoraciones del mundo,
  accesorios de Pip, temas de la app.
- Más adelante: packs de Semillas como compra única (entrada de dinero sin suscripción).
- Regla de diseño: todo lo comprable con dinero también se puede ganar jugando (lento).

### 1.3 Ads SOLO recompensados (nunca banners)
- Banners/interstitials matarían la marca eco y el premium feel. **Prohibidos.**
- **Rewarded video opcional** (el usuario elige verlo): "Mirá un video → +1 protector de
  racha" o "+30 Semillas". CPM alto, cero fricción, percepción positiva.
- Implementación web: Google Ad Placement API / AdSense for rewarded; en el wrapper móvil
  futuro: AdMob rewarded.

### 1.4 Retos patrocinados (B2B — el diferencial argentino)
- El schema ya lo soporta (`sponsor_name`, `sponsor_logo`).
- Marcas locales (Patagonia, bancos con línea verde, municipios, B-corps) pagan por un
  reto semanal patrocinado: "Semana del reciclaje by X" con premios reales.
- Precio sugerido inicial: USD 300-1500/reto según audiencia. Con 10k MAU esto puede
  superar a las suscripciones.

## 2. Cómo se vuelve parte de la vida de la gente (motor de hábito)

Modelo Hook (Nir Eyal) aplicado a Brote:

| Fase | Mecanismo en Brote |
|---|---|
| **Disparador externo** | Push 20:00 si la racha corre riesgo · recap del lunes · reto del día |
| **Disparador interno** | "Quiero ver crecer mi mundo" + culpa ecológica convertida en acción positiva |
| **Acción (mínima fricción)** | El set diario garantiza ≥3 acciones FÁCILES · "Regá tu mundo" = 1 tap |
| **Recompensa variable** | Qué elemento aparece y dónde es sorpresa · retos rotan · noticias frescas · Pip responde distinto |
| **Inversión** | Cada acción hace el mundo más valioso → abandonar duele (loss aversion de la racha + mundo) |

Refuerzos clave ya construidos: rachas con protectores (pérdida evitable = retención),
mundos infinitos (nunca "termina"), ligas semanales (F10.1, presión social positiva),
compartir el mundo como imagen (F10.2, loop viral), visitar mundos de amigos (F10.3).

**El orden de crecimiento:** 1) producto que enamora (3D + Pip) → 2) retención (rachas,
ligas, push) → 3) viralidad (share cards, invitaciones con Semillas) → 4) monetización.
Cobrar antes de tener retención mata el embudo.

## 3. Qué NO hacer
- Banners de publicidad. Paywall del core loop (acciones/mundo/rachas SIEMPRE gratis).
- Cobrar por repasar. En la Academia la savia limita hojas NUEVAS; el riego es
  gratis. Cobrar por retener lo aprendido sería vender el olvido.
- Vender la suscripción dentro de una cuenta `kid`. La pantalla de savia agotada
  no muestra la línea de Brote+ si la cuenta es de un menor.
- Vender datos. Notificaciones spam (max 1/día + recap semanal).

## 4. Métricas que mandan
- D1/D7/D30 retention (meta: 40/20/10 al inicio), rachas activas ≥7 días,
  conversión a Brote+ (meta 2-4% de MAU), share rate de mundos, K-factor de invitaciones.
