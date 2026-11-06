-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0146 — Noticias para chicos, más finas.
--
-- Revisadas a mano las 170 que 0145 marcó para chicos en vivo: la mayoría son
-- lo que tienen que ser (animales, inventos, naturaleza que se recupera), pero
-- 17 no: presupuestos y ministerios ("ministr" no agarraba "ministerio"), plata
-- y subsidios, un cementerio, un obituario, "el accidentado arranque" ("accidente"
-- no agarraba "accidentado"), el fracking, récords de gases que calientan el
-- clima, una candidatura a la OMS y la venta de una granja. Se suman esas
-- palabras a la lista de lo que un chico no lee, y se recalculan todas.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.brote_news_is_kid_safe(p_title text, p_summary text, p_tags text[], p_source text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with t as (select lower(coalesce(p_title, '') || ' ' || coalesce(p_summary, '')) as x)
  select coalesce(p_source = any (brote_news_fuentes_chicos()), false)
     and coalesce(p_tags && array['animales', 'plantas', 'ciencia', 'agua_azul', 'residuos', 'alimentacion', 'energia'], false)
     -- Algo curioso o positivo: un descubrimiento, un invento, un animal, cómo se hace algo.
     and t.x ~ ('(descubr|invent|ingenios|crean |crea un|cre[oó] |desarroll|dise[ñn]a|nuev[oa]s? |nacen|naci[oó]|nacimiento'
               || '|regres|vuelve|vuelven|recuper|proteg|cuida|salv[aó]|rescat|aprend|curios|sab[ií]as|c[óo]mo se|c[óo]mo hacer'
               || '|por qu[eé]|qu[eé] es|truco|casero|reutiliz|recicl|huerta|compost|semilla|abeja|tortuga|ballena|ping[üu]in'
               || '|delf[ií]n|mariposa|p[áa]jaro|aves? |colibr|zorro|ciervo|nutria|oso |lobo|hongo|r[ée]cord|primera vez|solar|bici)')
     -- Nada de muerte, violencia, enfermedad, miedo, política, economía ni conflictos.
     and t.x !~ ('(muert|muer[eo]|mueren|muri[oó]|morir|fallec|v[ií]ctim|tragedia|cat[áa]str|desastre|masacre|guerra|conflict'
               || '|asesin|suicid|violaci|violent|matanza|mata[rn]? |matan|extermin|herid|desaparec|desaparici|caz[ao]|cazador'
               || '|furtiv|esqueleto|cad[áa]ver|sangr|d[ée]biles?|golpe|ataque|atac|arma|bomba|explos|accident|maltrat|abus'
               || '|tr[áa]fic|contraband|sacrific|incendi|fuego|llamas|quema|arras|calcin|terremoto|sismo|temblor|tsunami'
               || '|hurac[áa]n|tornado|inundaci|temporal|granizo|alerta|evacua|desaloj|emergencia|damnificad|c[áa]ncer|enferm'
               || '|epidemia|pandemia|malaria|dengue|bacteria|legionel|virus|par[áa]sit|pulgas|plaga|obesidad|adelgaz|hambre'
               || '|desnutric|droga|alcohol|tabaco|t[óo]xic|veneno|canc[ée]r|pesticida|colaps|devasta|extinci|amenaz|peligr'
               || '|riesgo|vulnerab|crisis|sequ[ií]a|aridez|calor extremo|olas? de calor|emisiones|petr[óo]le|miner[ií]a|deforest'
               || '|destru|contamin|pol[ií]tic|gobierno|ministr|minister|presiden|elecci|congreso|parlament|ley |leyes|legal|tribunal'
               || '|juicio|demanda|denuncia|ofensiva|cumbre|cop ?[0-9]|onu|la oms|pacto|pactan|permiso|impuesto|millones|millonari'
               || '|euros|d[óo]lares|dinero|presupuest|gasto |gastos |cobrar|ayudas |subvenci|billeter|ha vendido|vendi[oó] '
               || '|derechos de desarrollo|consulta previa|candidatura|empresa|industri|negocio|precio|inversi|financ|banco|ocde'
               || '|comisi[óo]n europea|uni[óo]n europea|socios|reclam|protest|critic|rechaz|pol[ée]mic|esc[áa]ndalo|fraude'
               || '|multa|sanci|cementerio|difunt|obituario|calientan|preocup|ya no tiene|diezm|fracking|tormenta que'
               || '|el tiempo hoy|pron[óo]stico)')
    from t;
$$;
revoke all on function public.brote_news_is_kid_safe(text, text, text[], text) from public, anon, authenticated;

-- Todas de nuevo, con la lista nueva.
select public.brote_tag_kid_safe_news();
