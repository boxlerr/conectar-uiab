-- Borra definitivamente las dos filas basura de `public.categorias` que
-- 20260723_desactivar_categorias_basura.sql sólo había marcado activa=false.
--
-- Origen: al importar la tabla markdown de docs/CATEGORIAS_CONECTAR_UIAB.md se
-- colaron el separador (`|:-------|`) y la fila de cierre (`| **TOTAL** | | **153** |`).
-- Quedaron como una opción en blanco y otra con guiones, primeras en todo
-- desplegable ordenado por nombre — entre ellos el combobox "Rubro" de
-- /oportunidades/nueva, que no filtraba por `activa`.
--
-- Verificado antes de borrar contra las 6 FKs que apuntan a categorias
-- (empresas_categorias, proveedores_categorias, oportunidades, items,
-- categorias.categoria_padre_id, alias_categorias): 0 referencias salvo 3 alias
-- que eran basura del mismo import ('----------', ':----------------:', '**153**'),
-- por eso se borran en vez de reasignarse.
--
-- Reversible con los datos de abajo (ejecutados en prod el 2026-07-31):
--   insert into public.categorias (id, categoria_padre_id, nombre, slug, descripcion, activa, orden, creado_en, actualizado_en) values
--     ('edcfc42a-ec05-4c62-8a73-325a347f6da1', null, ':-------', '--------', null, false, 0, '2026-04-07T13:33:43.1168+00', '2026-04-07T13:33:43.1168+00'),
--     ('60cc41cb-5b3c-4cda-a135-6d6fb4561a40', null, '',         '**TOTAL**', null, false, 0, '2026-04-07T13:36:00.485361+00', '2026-04-07T13:36:00.485361+00');
--   insert into public.alias_categorias (id, categoria_id, alias) values
--     ('9bfa6ac5-d544-43ab-b813-a14294d11722', 'edcfc42a-ec05-4c62-8a73-325a347f6da1', '----------'),
--     ('01e1e1df-bd08-4f32-a9b2-23a98278c116', 'edcfc42a-ec05-4c62-8a73-325a347f6da1', ':----------------:'),
--     ('dde1f97d-04e7-4c61-a578-92886c46588d', '60cc41cb-5b3c-4cda-a135-6d6fb4561a40', '**153**');

-- Se filtra por el mismo criterio de forma que la migración anterior, no por id,
-- para que también limpie entornos donde el import dejó otros ids.
create temporary table _categorias_basura on commit drop as
select id
from public.categorias
where trim(coalesce(nombre, '')) = ''
   or slug in ('**TOTAL**', '--------')
   or nombre ~ '^[:\-\s|]+$';

-- Los alias dependientes son basura del mismo import: se borran, no se reasignan.
delete from public.alias_categorias
where categoria_id in (select id from _categorias_basura);

-- Guarda: si alguna quedó referenciada por datos reales, no la borramos.
delete from public.categorias c
where c.id in (select id from _categorias_basura)
  and not exists (select 1 from public.empresas_categorias    x where x.categoria_id       = c.id)
  and not exists (select 1 from public.proveedores_categorias x where x.categoria_id       = c.id)
  and not exists (select 1 from public.oportunidades          x where x.categoria_id       = c.id)
  and not exists (select 1 from public.items                  x where x.categoria_id       = c.id)
  and not exists (select 1 from public.alias_categorias       x where x.categoria_id       = c.id)
  and not exists (select 1 from public.categorias             x where x.categoria_padre_id = c.id);
