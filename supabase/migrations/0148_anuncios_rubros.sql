-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0148 — Rubros que Brote no publicita.
--
-- Brote tiene cuentas de chicos y de adolescentes. Los anuncios directos se
-- arman a mano en /panel/publicidad, y nada impedía cargar uno de apuestas, de
-- alcohol o de vapeo. La Res. SIyC 446/2025 (con la 271/2026) pone advertencias
-- y "+18" a la publicidad de juegos y apuestas en línea; el alcohol (Ley 24.788)
-- y el tabaco (Ley 26.687) tienen sus propias reglas. Lo más simple y lo más
-- seguro para una app con menores: esos rubros no se publican, para nadie.
--
-- Se mira el anunciante, el título, el texto y el enlace. Si algo coincide, la
-- base no lo guarda y el panel muestra por qué.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.brote_anuncio_rubro_prohibido(p_texto text)
returns text
language sql
immutable
as $$
  select case
    when t ~ '(casa de apuestas|apuestas (deportivas|online|en l[ií]nea)|apost[aá] (y|ya|ahora)|casino|\mbet[0-9]|\mbet\M|betano|betsson|betwarrior|codere|bplay|bingo|ruleta|tragamonedas|\mslots?\M|p[oó]ker|quiniela|loter[ií]a|jackpot|sportsbook)' then 'apuestas o juegos de azar'
    when t ~ '(cerveza|cervecer|fernet|whisky|vodka|licor|vinoteca|vinos? (de|tinto|blanco|org[aá]nico)|bodega|espumante|champa[gñ]|\mgin\M|bebidas? alcoh)' then 'alcohol'
    when t ~ '(tabaco|cigarr|habano|\mvape|vapeo|vapeador|nicotina|cannabis|marihuana)' then 'tabaco, vapeo o cannabis'
    when t ~ '(citas online|app de citas|dating|tinder|contenido (para )?adultos?|\+18)' then 'citas o contenido para adultos'
    when t ~ '(adelgaz|quema ?grasa|bajar de peso r[aá]pido|energizante|energy drink)' then 'adelgazantes o energizantes'
  end
  from (select lower(coalesce(p_texto, '')) as t) x;
$$;

create or replace function public.brote_anuncio_rubro()
returns trigger
language plpgsql
as $$
declare v_rubro text;
begin
  v_rubro := brote_anuncio_rubro_prohibido(
    concat_ws(' ', new.anunciante, new.titulo, new.texto, new.cta, new.url_destino));
  if v_rubro is not null then
    raise exception 'Brote no publica anuncios de %: hay cuentas de menores. Revisá el anunciante, el texto o el enlace.', v_rubro
      using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists anuncio_rubro on public.anuncios;
create trigger anuncio_rubro
  before insert or update of anunciante, titulo, texto, cta, url_destino on public.anuncios
  for each row execute function public.brote_anuncio_rubro();

-- Los que ya estuvieran cargados y caigan en esos rubros se apagan, no se borran.
update public.anuncios set activo = false
 where activo and brote_anuncio_rubro_prohibido(concat_ws(' ', anunciante, titulo, texto, cta, url_destino)) is not null;
