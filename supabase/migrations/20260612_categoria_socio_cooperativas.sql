-- Directorio v2: nueva categoría de socio "cooperativas".
--
-- La columna empresas.categoria_socio es text plano y vista_directorio la
-- expone tal cual, así que el nuevo valor funciona en runtime sin DDL. Este
-- bloque actualiza el comentario de la columna para documentar el set de
-- valores válidos que usa la app (src/lib/datos/categorias-socio.ts).
--
-- Nota: "instituciones_bancarias" se muestra en la UI como
-- "Entidades financieras" — el valor en DB no cambia.

comment on column public.empresas.categoria_socio is
  'Categoría de membresía del socio UIAB: proveedores_servicios_productos (default), instituciones_educativas, instituciones_bancarias (UI: "Entidades financieras"), cooperativas.';

-- Amplía el CHECK de empresas.categoria_socio para aceptar 'cooperativas'.
alter table public.empresas
  drop constraint empresas_categoria_socio_check;

alter table public.empresas
  add constraint empresas_categoria_socio_check
  check (categoria_socio = any (array[
    'proveedores_servicios_productos'::text,
    'instituciones_educativas'::text,
    'instituciones_bancarias'::text,
    'cooperativas'::text
  ]));
