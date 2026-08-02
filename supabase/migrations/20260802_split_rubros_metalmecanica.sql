-- Split de rubros mal agrupados en METALMECÁNICA Y METALURGIA.
-- Feedback de socios (Metalúrgica Longchamps, 2026-08-02): un rubro que junta
-- tres oficios distintos no sirve para filtrar el directorio.
--
--   "Chapa, Perfiles y Corte"          → Chapas + Perfiles + Corte y Plegado
--   "Herrería y Cerrajería Industrial" → Herrería Industrial + Cerrajería Industrial
--
-- Las filas originales se RENOMBRAN en vez de borrarse: los pivotes
-- empresas_categorias / proveedores_categorias apuntan a categorias con
-- ON DELETE CASCADE, así que un DELETE se llevaría puestas, en silencio, las
-- selecciones de los socios que ya tenían el rubro. A quien lo tenía lo
-- asociamos también a los nuevos, porque el nombre viejo implicaba las tres cosas.

do $$
declare
  v_padre      uuid;
  v_chapas     uuid;
  v_herreria   uuid;
  v_perfiles   uuid;
  v_corte      uuid;
  v_cerrajeria uuid;
begin
  select id into v_padre
    from public.categorias
   where nombre = 'METALMECÁNICA Y METALURGIA' and categoria_padre_id is null;

  if v_padre is null then
    raise notice 'No existe el rubro padre METALMECÁNICA Y METALURGIA: nada que dividir.';
    return;
  end if;

  -- ── 1. Chapa, Perfiles y Corte ──────────────────────────────────────
  select id into v_chapas
    from public.categorias
   where categoria_padre_id = v_padre and slug = 'chapa-y-perfiles';

  if v_chapas is not null then
    update public.categorias
       set nombre = 'Chapas', slug = 'chapas', actualizado_en = now()
     where id = v_chapas;

    insert into public.categorias (categoria_padre_id, nombre, slug, activa)
    values (v_padre, 'Perfiles', 'perfiles', true)
    on conflict (slug) do nothing;

    insert into public.categorias (categoria_padre_id, nombre, slug, activa)
    values (v_padre, 'Corte y Plegado', 'corte-y-plegado', true)
    on conflict (slug) do nothing;

    select id into v_perfiles from public.categorias where slug = 'perfiles';
    select id into v_corte    from public.categorias where slug = 'corte-y-plegado';

    -- Quien decía hacer "Chapa, Perfiles y Corte" hace las tres.
    insert into public.empresas_categorias (empresa_id, categoria_id)
    select ec.empresa_id, n.id
      from public.empresas_categorias ec
      cross join (values (v_perfiles), (v_corte)) as n(id)
     where ec.categoria_id = v_chapas
    on conflict do nothing;

    insert into public.proveedores_categorias (proveedor_id, categoria_id)
    select pc.proveedor_id, n.id
      from public.proveedores_categorias pc
      cross join (values (v_perfiles), (v_corte)) as n(id)
     where pc.categoria_id = v_chapas
    on conflict do nothing;
  end if;

  -- ── 2. Herrería y Cerrajería Industrial ─────────────────────────────
  select id into v_herreria
    from public.categorias
   where categoria_padre_id = v_padre and slug = 'herreria-forja-artesanal';

  if v_herreria is not null then
    update public.categorias
       set nombre = 'Herrería Industrial', slug = 'herreria-industrial', actualizado_en = now()
     where id = v_herreria;

    insert into public.categorias (categoria_padre_id, nombre, slug, activa)
    values (v_padre, 'Cerrajería Industrial', 'cerrajeria-industrial', true)
    on conflict (slug) do nothing;

    select id into v_cerrajeria from public.categorias where slug = 'cerrajeria-industrial';

    insert into public.empresas_categorias (empresa_id, categoria_id)
    select ec.empresa_id, v_cerrajeria
      from public.empresas_categorias ec
     where ec.categoria_id = v_herreria
    on conflict do nothing;

    insert into public.proveedores_categorias (proveedor_id, categoria_id)
    select pc.proveedor_id, v_cerrajeria
      from public.proveedores_categorias pc
     where pc.categoria_id = v_herreria
    on conflict do nothing;
  end if;
end $$;
