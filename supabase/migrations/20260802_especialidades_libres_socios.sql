-- Especialidades libres propuestas por socios desde /perfil/servicios.
--
-- Mismo patrón que las etiquetas libres (20260722_etiquetas_libres_socios.sql):
--   administrado_por_admin = true  → catálogo oficial de rubros, lo ve todo el mundo
--   administrado_por_admin = false → especialidad propia de un socio: oculta del
--                                    catálogo pero visible en su ficha y en sus
--                                    selecciones, hasta que el admin la promueva.
--
-- Por qué: el catálogo oficial agrupa oficios que en la práctica se venden por
-- separado, y el socio no tenía forma de decir a qué se dedica realmente.
--
-- NOTA DE SEGURIDAD (deliberado): no se agregan policies. La creación pasa
-- siempre por una server action con SUPABASE_SERVICE_ROLE_KEY, que saltea RLS.
-- La policy existente sobre categorias (escritura sólo admin) sigue bloqueando
-- el browser. Ocultar las propuestas del catálogo es filtrado de producto, no
-- de seguridad: cualquiera puede leer categorias porque el directorio lo necesita.

-- ─────────────────────────── 1. Discriminador ───────────────────────────
-- default true: las 137 filas que ya existen son el catálogo curado.
alter table public.categorias
  add column if not exists administrado_por_admin boolean not null default true;

comment on column public.categorias.administrado_por_admin is
  'true = catálogo oficial de rubros; false = especialidad propuesta por un socio (pendiente de curaduría en /admin/servicios).';

-- ─────────────────────────── 2. Autoría ───────────────────────────
alter table public.categorias
  add column if not exists creado_por uuid references public.perfiles(id) on delete set null;

alter table public.categorias
  add column if not exists creado_por_empresa uuid references public.empresas(id) on delete set null;

alter table public.categorias
  add column if not exists creado_por_proveedor uuid references public.proveedores(id) on delete set null;

comment on column public.categorias.creado_por is
  'Perfil que propuso la especialidad. NULL en el catálogo oficial. Es "quién la propuso primero", no un dueño: varios socios pueden elegir la misma fila.';

-- ─────────────────────────── 3. Índices ───────────────────────────
-- Bandeja de curaduría de /admin/servicios.
create index if not exists categorias_propuestas_idx
  on public.categorias (creado_en desc)
  where administrado_por_admin = false;

-- El picker de /perfil/servicios pide el catálogo oficial en cada carga.
create index if not exists categorias_catalogo_idx
  on public.categorias (categoria_padre_id, nombre)
  where administrado_por_admin = true and activa = true;

-- Los pivotes sólo tienen UNIQUE (entidad_id, categoria_id): sin esto, promover
-- o borrar una especialidad hace seq scan.
create index if not exists empresas_categorias_categoria_id_idx
  on public.empresas_categorias (categoria_id);
create index if not exists proveedores_categorias_categoria_id_idx
  on public.proveedores_categorias (categoria_id);
