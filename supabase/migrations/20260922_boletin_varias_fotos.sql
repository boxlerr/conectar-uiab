-- Boletín UIAB: varias fotos por publicación.
--
-- Hasta acá cada comunicado tenía UNA foto (`ruta_imagen`). Pedido de Juli:
-- poder subir varias y pasarlas de costado dentro de la misma publicación,
-- como en cualquier red social.
--
-- POR QUÉ UN ARRAY Y NO UNA TABLA SATÉLITE
--
-- Las fotos de un comunicado no tienen atributos propios (ni epígrafe, ni
-- autor, ni visibilidad): son una lista ordenada de rutas dentro del mismo
-- bucket. Una tabla aparte agregaría un join y una FK para guardar exactamente
-- eso. Es el mismo criterio con el que los adjuntos de oportunidades viven en
-- el bucket sin tabla satélite.
--
-- EL ORDEN ES EL DEL ARRAY. La primera es la portada: es la que se muestra en
-- la tira del panel, en la tarjeta del feed y en la imagen de OpenGraph cuando
-- se comparte el enlace.
--
-- `ruta_imagen` SE ELIMINA en vez de quedar como "portada" al lado del array.
-- Dos columnas que dicen lo mismo se desincronizan sola la primera vez que
-- alguien edita por SQL; la portada se deriva de `rutas_imagenes[1]`.
--
-- OJO AL ORDEN DE DEPLOY: el código de la rama `boletin` lee `rutas_imagenes`.
-- Correr esto ANTES de levantar la app con esos cambios, o /boletin va a tirar
-- error de columna inexistente. En producción no rompe nada: `main` todavía no
-- tiene el boletín, así que nadie está leyendo `ruta_imagen`.

begin;

alter table public.comunicados
  add column if not exists rutas_imagenes text[] not null default '{}';

comment on column public.comunicados.rutas_imagenes is
  'Rutas de las fotos dentro de `bucket`, en orden. La primera es la portada (tarjeta del feed y OpenGraph). Vacío = publicación sin fotos.';

-- Las publicaciones que ya tenían foto arrancan con esa única foto.
update public.comunicados
   set rutas_imagenes = array[ruta_imagen]
 where ruta_imagen is not null
   and cardinality(rutas_imagenes) = 0;

alter table public.comunicados
  drop column if exists ruta_imagen;

commit;
