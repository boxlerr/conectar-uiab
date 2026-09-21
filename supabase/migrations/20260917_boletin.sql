-- Boletín UIAB: comunicados que el equipo de la UIAB publica para todas las
-- socias (noticias, avisos, fotos de eventos). Pedido de Juli: que desde el
-- panel se puedan cargar posts con título, texto y una foto, dejarlos en
-- borrador y publicarlos cuando estén listos; la socia los lee en su panel y en
-- una página /boletin.
--
-- NO confundir con `src/modulos/novedades` ("Novedades del sistema"): eso es el
-- changelog de la plataforma, hardcodeado en el código y atado a
-- `perfiles.tutoriales_vistos`. Esto es contenido editorial, dinámico, que se
-- carga desde /admin. Por eso tabla nueva y no una columna más en otro lado.
--
-- LA FOTO no vive acá: se sube al bucket público `imagenes-publicas` bajo
-- `boletin/…` con el mismo flujo que los logos (/perfil/datos) y las imágenes de
-- productos. Guardamos sólo `bucket` + `ruta_imagen` y armamos la URL pública al
-- renderear. Es opcional: un aviso puede ser sólo texto.
--
-- RLS: SELECT abierto a `authenticated` PERO sólo de lo publicado — un borrador
-- no lo ve nadie salvo el panel, que lee con service_role y se saltea RLS. La
-- escritura entera (alta, edición, publicar, borrar) queda para `es_admin()`,
-- el mismo helper que usan certificaciones y suscripciones. No hay
-- `puede_gestionar_*` porque el boletín es uno solo y lo maneja la UIAB, no cada
-- ficha.

create table if not exists public.comunicados (
  id             uuid primary key default gen_random_uuid(),

  titulo         text not null,
  -- Cuerpo en texto plano / saltos de línea. No es HTML: se renderea escapado.
  cuerpo         text not null,

  -- Foto opcional en `imagenes-publicas`. Guardamos bucket por si algún día se
  -- mueve, igual que hacen empresas.bucket_logo / oportunidades.
  bucket         text,
  ruta_imagen    text,

  -- Se carga como 'borrador' y se pasa a 'publicado' cuando está listo. La socia
  -- sólo ve 'publicado' (lo garantiza la policy de SELECT).
  estado         text not null default 'borrador'
                 check (estado in ('borrador', 'publicado')),

  -- Deja un comunicado clavado arriba del feed (un aviso importante que no se
  -- quiere que baje con los nuevos). Liviano: un booleano, sin orden manual.
  fijado         boolean not null default false,

  -- Cuándo se publicó. Lo escribe el server action al pasar a 'publicado';
  -- es la fecha que se muestra y por la que se ordena el feed. Null mientras es
  -- borrador.
  publicado_en   timestamptz,

  -- Quién lo cargó (para auditoría en el panel). No se borra el comunicado si se
  -- borra el perfil: queda el registro con creado_por en null.
  creado_por     uuid references public.perfiles(id) on delete set null,

  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.comunicados is
  'Boletín UIAB: comunicados editoriales (noticias/avisos/fotos) que publica el equipo de la UIAB. Distinto del changelog de src/modulos/novedades.';
comment on column public.comunicados.estado is
  'borrador = sólo visible en el panel; publicado = visible para toda socia autenticada.';
comment on column public.comunicados.publicado_en is
  'Fecha de publicación (la escribe el server action al publicar). Ordena y fecha el feed.';

-- El feed lista lo publicado, primero lo fijado y después por fecha.
create index if not exists comunicados_publicados_idx
  on public.comunicados (fijado desc, publicado_en desc)
  where estado = 'publicado';

-- actualizado_en automático en cada UPDATE.
create or replace function public.tg_comunicados_touch()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists comunicados_touch on public.comunicados;
create trigger comunicados_touch
  before update on public.comunicados
  for each row execute function public.tg_comunicados_touch();

alter table public.comunicados enable row level security;

-- La socia sólo ve lo publicado. El panel no depende de esta policy: lee con
-- service_role, que ignora RLS, así que ve también los borradores.
drop policy if exists comunicados_select on public.comunicados;
create policy comunicados_select on public.comunicados
  for select to authenticated
  using (estado = 'publicado');

drop policy if exists comunicados_insert on public.comunicados;
create policy comunicados_insert on public.comunicados
  for insert to authenticated
  with check (public.es_admin());

drop policy if exists comunicados_update on public.comunicados;
create policy comunicados_update on public.comunicados
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists comunicados_delete on public.comunicados;
create policy comunicados_delete on public.comunicados
  for delete to authenticated
  using (public.es_admin());
