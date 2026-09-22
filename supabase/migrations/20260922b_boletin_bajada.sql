-- Boletín UIAB: la bajada pasa a ser un campo propio.
--
-- ANTES: no existía. La nota se renderizaba con una regla escondida — "si hay
-- título y más de un párrafo, el PRIMER párrafo se dibuja grande y gris como
-- bajada". Juli la descubrió de casualidad, apretando enter:
--
--   "lo del subtítulo lo descubrí sin querer, porque le toqué enter y se
--    pusieron; tiene que estar como opción de ponerlos también".
--
-- Y tenía razón por partida doble: no se podía PONER a propósito, y tampoco se
-- podía NO ponerla. Una nota con título cuyo primer párrafo es texto normal no
-- tenía forma de evitar que se agrandara.
--
-- AHORA: columna propia, y el que escribe decide. Vacía = no hay bajada, y el
-- cuerpo se dibuja entero. Cero magia.
--
-- El backfill mueve a `bajada` el primer párrafo de las notas que HOY se están
-- viendo con bajada (título + 2 o más párrafos), así ninguna nota ya publicada
-- cambia de aspecto por esta migración.

begin;

alter table public.comunicados
  add column if not exists bajada text not null default '';

comment on column public.comunicados.bajada is
  'Bajada / copete de la nota: el párrafo destacado bajo el título. Vacía = la nota no lleva bajada. NO se deriva del cuerpo (antes era el primer párrafo, por una regla implícita).';

-- Sólo las que hoy ya muestran bajada: título presente y cuerpo con más de un
-- párrafo (los párrafos se separan con una línea en blanco).
update public.comunicados
   set bajada = split_part(cuerpo, E'\n\n', 1),
       cuerpo = ltrim(substr(cuerpo, length(split_part(cuerpo, E'\n\n', 1)) + 3), E'\n')
 where bajada = ''
   and btrim(titulo) <> ''
   and cuerpo like '%' || E'\n\n' || '%';

commit;
