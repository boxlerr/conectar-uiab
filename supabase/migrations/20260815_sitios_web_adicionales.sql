-- Más de un sitio web por ficha.
--
-- Varias socias tienen dos webs (la institucional y la tienda, o una por
-- marca/unidad de negocio) y hasta ahora tenían que elegir cuál publicar.
--
-- POR QUÉ UNA COLUMNA NUEVA Y NO SE MIGRA `sitio_web` A ARRAY
--
-- `sitio_web` lo escriben cinco lugares distintos —/sumate, register-sync,
-- altas/acciones, la importación del padrón y /perfil/datos— y lo leen el
-- directorio, la vista `vista_directorio`, el export del padrón, el panel de
-- admin y el JSON-LD de cada ficha. Convertirla a `text[]` obligaba a tocar
-- todo eso de una, con el antecedente de que un solo desajuste de columnas ya
-- dejó a las socias sin poder guardar su ficha (ver 20260813 y el comentario de
-- perfil/datos/page.tsx). Así que `sitio_web` sigue siendo el sitio PRINCIPAL,
-- intacto, y los extras viven aparte: nada de lo que ya andaba cambia de forma.
--
-- El principal es el que se muestra en el directorio y en la cabecera de la
-- ficha; los adicionales aparecen en el bloque de contacto y suman a `sameAs`
-- del JSON-LD, que es justamente un array y hasta ahora llevaba un solo item.

alter table public.empresas
  add column if not exists sitios_web_adicionales text[];

alter table public.proveedores
  add column if not exists sitios_web_adicionales text[];

comment on column public.empresas.sitios_web_adicionales is
  'Sitios web extra de la ficha, además de `sitio_web` (el principal). Opcional; NULL o {} si no hay. Se guardan ya normalizados con esquema (https://…).';

comment on column public.proveedores.sitios_web_adicionales is
  'Sitios web extra de la ficha, además de `sitio_web` (el principal). Opcional; NULL o {} si no hay. Se guardan ya normalizados con esquema (https://…).';

-- Tope de 4 extras (5 webs en total contando la principal) y nada de strings
-- vacíos ni NULLs sueltos adentro del array: el formulario ya los filtra, pero
-- el formulario no es la única puerta a esta tabla — el service role entra por
-- arriba de las RLS desde cuatro rutas distintas. La regla vive donde no se
-- puede esquivar.
--
-- Sin subconsultas a propósito: un CHECK no las admite. `@> array['']` cubre el
-- string vacío y `array_position(arr, null)` el NULL suelto (ese operador busca
-- NULL con semántica IS NOT DISTINCT FROM, que es justo lo que hace falta).
alter table public.empresas
  drop constraint if exists empresas_sitios_web_adicionales_valido;
alter table public.empresas
  add constraint empresas_sitios_web_adicionales_valido check (
    sitios_web_adicionales is null
    or (
      coalesce(array_length(sitios_web_adicionales, 1), 0) <= 4
      and array_position(sitios_web_adicionales, null) is null
      and not (sitios_web_adicionales @> array[''::text])
    )
  );

alter table public.proveedores
  drop constraint if exists proveedores_sitios_web_adicionales_valido;
alter table public.proveedores
  add constraint proveedores_sitios_web_adicionales_valido check (
    sitios_web_adicionales is null
    or (
      coalesce(array_length(sitios_web_adicionales, 1), 0) <= 4
      and array_position(sitios_web_adicionales, null) is null
      and not (sitios_web_adicionales @> array[''::text])
    )
  );
