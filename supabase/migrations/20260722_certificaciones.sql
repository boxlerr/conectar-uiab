-- Certificaciones y normas de cada socia (ISO 9001, ISO 14001, ISO 45001, IRAM,
-- HACCP, BPM, habilitaciones locales...). Pedido del presidente de la UIAB:
-- que la empresa pueda cargar CADA norma por separado (no un campo de texto
-- libre "certificaciones"), adjuntar el certificado, verlas en su ficha publica,
-- y que en el listado del directorio se vea el iconito de cada norma.
--
-- Por que NO hay tabla catalogo `normas`: el catalogo vive como constante
-- TypeScript en src/modulos/certificaciones/normas.ts, porque ademas del nombre
-- el chip necesita familia, icono lucide y clases Tailwind, que son codigo y no
-- datos. Guardar aca `codigo_norma` como texto evita un join anidado en las
-- distintas queries que arman el directorio y evita un CRUD de catalogo en
-- /admin. El precio: sumar una norma nueva es un deploy, no un alta en la DB.
-- Aceptable para una lista que se toca una vez por anio. La escotilla 'otra' +
-- `nombre_libre` cubre el caso raro sin bloquear a nadie.
--
-- Polimorfica empresa/proveedor con el mismo patron que visitas_perfil y
-- resenas (check "exactamente una entidad").
--
-- RLS: SELECT abierto a `authenticated` porque las paginas /empresas,
-- /cooperativas, /instituciones-bancarias e /instituciones-educativas leen el
-- directorio desde el browser con la clave publishable. La escritura se limita a
-- admin y a quien pueda GESTIONAR la entidad (dueno/gestor) -- el mismo nivel que
-- ya exigen las policies de Storage sobre
-- documentos-privados/{empresas|proveedores}/<id>/..., donde se guarda el
-- archivo. `verificada` NO se puede escribir desde authenticated (revoke de
-- columna al final): solo el service_role, o sea el panel /admin.

create table if not exists public.certificaciones (
  id                     uuid primary key default gen_random_uuid(),
  empresa_id             uuid references public.empresas(id)    on delete cascade,
  proveedor_id           uuid references public.proveedores(id) on delete cascade,

  -- Codigo del catalogo TS: 'iso-9001', 'iso-14001', 'haccp', 'anmat', 'otra'...
  -- A proposito sin check contra una lista fija: la lista vive en el codigo.
  codigo_norma           text not null,
  -- Solo cuando codigo_norma = 'otra': el nombre que escribio la socia.
  nombre_libre           text,

  alcance                text,
  organismo_certificador text,
  numero_certificado     text,
  fecha_emision          date,
  fecha_vencimiento      date,

  -- Certificado (PDF/imagen) en 'documentos-privados'. Nunca se sirve publico:
  -- puede traer CUIT, domicilio de planta y firmas. Se abre con signed URL desde
  -- /perfil (la duenia) y desde /admin (la UIAB). Es opcional.
  bucket                 text,
  ruta_archivo           text,
  nombre_archivo         text,
  mime_type              text,
  tamano_bytes           bigint,

  -- Un admin de la UIAB vio el certificado adjunto y lo dio por valido.
  verificada             boolean not null default false,
  verificada_en          timestamptz,

  creado_en              timestamptz not null default now(),
  actualizado_en         timestamptz not null default now(),

  -- Debe apuntar a exactamente una entidad.
  constraint certificaciones_una_entidad check (
    (empresa_id is not null)::int + (proveedor_id is not null)::int = 1
  )
);

comment on table public.certificaciones is
  'Normas y certificaciones declaradas por cada socia, una fila por norma. El chip se muestra en el directorio y en la ficha publica; el archivo adjunto queda privado.';
comment on column public.certificaciones.codigo_norma is
  'Codigo del catalogo de src/modulos/certificaciones/normas.ts (iso-9001, iso-14001, haccp, otra...).';
comment on column public.certificaciones.verificada is
  'true cuando un admin de la UIAB abrio el certificado adjunto y lo dio por valido. Solo escribible por service_role.';

create index if not exists certificaciones_empresa_idx   on public.certificaciones (empresa_id);
create index if not exists certificaciones_proveedor_idx on public.certificaciones (proveedor_id);

-- La misma norma no se puede cargar dos veces por entidad (salvo 'otra').
create unique index if not exists certificaciones_empresa_norma_uidx
  on public.certificaciones (empresa_id, codigo_norma)
  where empresa_id is not null and codigo_norma <> 'otra';
create unique index if not exists certificaciones_proveedor_norma_uidx
  on public.certificaciones (proveedor_id, codigo_norma)
  where proveedor_id is not null and codigo_norma <> 'otra';

-- actualizado_en automatico + candado de verificacion. El revoke de columna de
-- mas abajo NO alcanza (authenticated tiene UPDATE a nivel tabla por el grant por
-- defecto de Supabase), asi que el candado real es este trigger: salvo el
-- service_role (panel /admin), nadie puede cambiar `verificada`/`verificada_en`
-- aunque llame a PostgREST directo.
create or replace function public.tg_certificaciones_touch()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  if current_user in ('authenticated', 'anon') then
    new.verificada    := old.verificada;
    new.verificada_en := old.verificada_en;
  end if;
  return new;
end;
$$;

drop trigger if exists certificaciones_touch on public.certificaciones;
create trigger certificaciones_touch
  before update on public.certificaciones
  for each row execute function public.tg_certificaciones_touch();

alter table public.certificaciones enable row level security;

drop policy if exists certificaciones_select on public.certificaciones;
create policy certificaciones_select on public.certificaciones
  for select to authenticated
  using (true);

drop policy if exists certificaciones_insert on public.certificaciones;
create policy certificaciones_insert on public.certificaciones
  for insert to authenticated
  with check (
    public.es_admin()
    or (empresa_id   is not null and public.puede_gestionar_empresa(empresa_id))
    or (proveedor_id is not null and public.puede_gestionar_proveedor(proveedor_id))
  );

drop policy if exists certificaciones_update on public.certificaciones;
create policy certificaciones_update on public.certificaciones
  for update to authenticated
  using (
    public.es_admin()
    or (empresa_id   is not null and public.puede_gestionar_empresa(empresa_id))
    or (proveedor_id is not null and public.puede_gestionar_proveedor(proveedor_id))
  )
  with check (
    public.es_admin()
    or (empresa_id   is not null and public.puede_gestionar_empresa(empresa_id))
    or (proveedor_id is not null and public.puede_gestionar_proveedor(proveedor_id))
  );

drop policy if exists certificaciones_delete on public.certificaciones;
create policy certificaciones_delete on public.certificaciones
  for delete to authenticated
  using (
    public.es_admin()
    or (empresa_id   is not null and public.puede_gestionar_empresa(empresa_id))
    or (proveedor_id is not null and public.puede_gestionar_proveedor(proveedor_id))
  );

-- Una socia no puede auto-verificarse: aunque pase la policy de update, no tiene
-- privilegio sobre estas dos columnas. Solo el service_role (panel /admin) las
-- toca. Defensa en profundidad ademas de que el server action nunca las escribe.
revoke update (verificada, verificada_en) on public.certificaciones from anon, authenticated;
