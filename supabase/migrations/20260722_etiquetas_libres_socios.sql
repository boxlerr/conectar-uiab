-- Etiquetas libres propuestas por socios desde /perfil/etiquetas.
--
-- Discriminador: public.tags.administrado_por_admin (columna que ya existía)
--   true  = catálogo curado, es lo que ven todos en /perfil/etiquetas y /oportunidades/nueva
--   false = etiqueta libre de un socio: oculta del catálogo, visible en su ficha,
--           y cuenta para el match desde el minuto cero (fn_calcular_matches_oportunidad
--           joinea por tag_id sin filtrar activo ni administrado_por_admin).
--
-- NOTA DE SEGURIDAD (deliberado, no es un olvido):
--   No se agregan policies nuevas. La creación de etiquetas libres y la moderación
--   pasan siempre por server actions con SUPABASE_SERVICE_ROLE_KEY, que saltea RLS.
--   La policy existente sobre tags (escritura sólo admin) sigue bloqueando el browser,
--   y tags_select queda en USING (true) porque el directorio y las fichas públicas
--   necesitan leer las etiquetas de otros socios.
--   El ocultamiento del catálogo es filtrado de producto, no de seguridad.

-- ─────────────────────────── 1. Autoría ───────────────────────────
alter table public.tags
  add column if not exists creado_por uuid references public.perfiles(id) on delete set null;

alter table public.tags
  add column if not exists creado_por_empresa uuid references public.empresas(id) on delete set null;

alter table public.tags
  add column if not exists creado_por_proveedor uuid references public.proveedores(id) on delete set null;

comment on column public.tags.creado_por is
  'Perfil que propuso la etiqueta libre. NULL en el catálogo curado por admin. Es "quién la propuso primero", no un dueño: varios socios pueden usar la misma fila.';
comment on column public.tags.administrado_por_admin is
  'true = catálogo oficial; false = etiqueta libre propuesta por un socio (pendiente de moderación en /admin/etiquetas).';

-- ─────────────────────────── 2. Índices ───────────────────────────
-- tags_slug_key y tags_nombre_key ya existen como UNIQUE constraints: no se recrean.

-- Bandeja de moderación de /admin/etiquetas.
create index if not exists tags_pendientes_idx
  on public.tags (creado_en desc)
  where administrado_por_admin = false;

-- Los pivotes sólo tienen UNIQUE (entidad_id, tag_id), o sea que no hay índice
-- por tag_id solo: eliminar o fusionar una etiqueta hace seq scan sin esto.
create index if not exists empresas_tags_tag_id_idx      on public.empresas_tags (tag_id);
create index if not exists proveedores_tags_tag_id_idx   on public.proveedores_tags (tag_id);
create index if not exists items_tags_tag_id_idx         on public.items_tags (tag_id);
create index if not exists oportunidades_tags_tag_id_idx on public.oportunidades_tags (tag_id);

-- ─────────────────── 3. Fusión de etiquetas (admin) ───────────────────
-- Repunta todos los pivotes de p_origen a p_destino, guarda el texto original
-- como alias y borra p_origen. Los choques con los UNIQUE (entidad_id, tag_id)
-- se resuelven a mano porque UPDATE no admite ON CONFLICT.
create or replace function public.fn_fusionar_tags(p_origen uuid, p_destino uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_nombre_origen text;
begin
  if p_origen = p_destino then
    raise exception 'No se puede fusionar una etiqueta consigo misma';
  end if;

  select nombre into v_nombre_origen from public.tags where id = p_origen;
  if v_nombre_origen is null then
    raise exception 'La etiqueta de origen no existe';
  end if;
  if not exists (select 1 from public.tags where id = p_destino) then
    raise exception 'La etiqueta de destino no existe';
  end if;

  -- empresas_tags
  delete from public.empresas_tags a
   where a.tag_id = p_origen
     and exists (select 1 from public.empresas_tags b
                  where b.empresa_id = a.empresa_id and b.tag_id = p_destino);
  update public.empresas_tags set tag_id = p_destino where tag_id = p_origen;

  -- proveedores_tags
  delete from public.proveedores_tags a
   where a.tag_id = p_origen
     and exists (select 1 from public.proveedores_tags b
                  where b.proveedor_id = a.proveedor_id and b.tag_id = p_destino);
  update public.proveedores_tags set tag_id = p_destino where tag_id = p_origen;

  -- items_tags
  delete from public.items_tags a
   where a.tag_id = p_origen
     and exists (select 1 from public.items_tags b
                  where b.item_id = a.item_id and b.tag_id = p_destino);
  update public.items_tags set tag_id = p_destino where tag_id = p_origen;

  -- oportunidades_tags
  delete from public.oportunidades_tags a
   where a.tag_id = p_origen
     and exists (select 1 from public.oportunidades_tags b
                  where b.oportunidad_id = a.oportunidad_id and b.tag_id = p_destino);
  update public.oportunidades_tags set tag_id = p_destino where tag_id = p_origen;

  -- El texto que había escrito el socio queda como alias de la oficial.
  insert into public.alias_tags (tag_id, alias)
  values (p_destino, v_nombre_origen)
  on conflict (tag_id, alias) do nothing;

  delete from public.tags where id = p_origen;
end;
$$;

revoke all on function public.fn_fusionar_tags(uuid, uuid) from public, anon, authenticated;
grant execute on function public.fn_fusionar_tags(uuid, uuid) to service_role;
