-- Altas de socios UIAB: recolección de datos de contacto de las empresas para
-- darles acceso por primera vez a la plataforma.
--
-- Las 59 empresas socias ya están cargadas en el directorio pero la mayoría no
-- tiene cuenta de usuario. Este formulario público (`/sumate`) junta sus datos
-- de contacto; el admin los revisa en `/admin/altas` y luego les crea la cuenta
-- (perfil + miembros_empresa) vinculando a la ficha existente.
--
-- RLS: la tabla queda con RLS habilitado y SIN políticas para anon/auth, de modo
-- que sólo el service_role (server actions) puede leer/escribir. Así los emails y
-- teléfonos de los socios nunca quedan expuestos al cliente. El listado público
-- ("se va completando a medida que llenan") se sirve desde un Server Component que
-- selecciona sólo columnas no sensibles vía service_role.

create table if not exists public.altas_socios (
  id                uuid primary key default gen_random_uuid(),

  -- Empresa
  razon_social      text not null,
  nombre_comercial  text,
  cuit              text,
  actividad         text,
  categoria         text not null default 'empresa_socia'
                      check (categoria = any (array[
                        'empresa_socia'::text,
                        'prestador_servicios'::text,
                        'entidad_financiera'::text,
                        'entidad_educativa'::text,
                        'cooperativa'::text
                      ])),
  ya_es_socio       boolean not null default false,
  n_socio           text,

  -- Referente / persona de contacto
  referente_nombre  text not null,
  referente_cargo   text,

  -- Contacto
  email             text not null,
  telefono          text,
  sitio_web         text,

  -- Ubicación
  localidad         text,
  direccion         text,

  -- Libre
  mensaje           text,

  -- Gestión interna
  estado            text not null default 'pendiente'
                      check (estado = any (array[
                        'pendiente'::text,      -- recién enviado
                        'contactado'::text,     -- el admin ya se comunicó
                        'cuenta_creada'::text,  -- ya tiene acceso
                        'descartado'::text      -- no corresponde / duplicado
                      ])),
  empresa_id        uuid references public.empresas(id) on delete set null,
  origen            text not null default 'formulario_web',

  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

comment on table public.altas_socios is
  'Solicitudes de alta/recolección de datos de socios UIAB para darles acceso por primera vez. Se cargan vía /sumate y se gestionan en /admin/altas.';

create index if not exists altas_socios_estado_idx     on public.altas_socios (estado);
create index if not exists altas_socios_creado_en_idx  on public.altas_socios (creado_en desc);
create index if not exists altas_socios_email_idx      on public.altas_socios (lower(email));
create index if not exists altas_socios_empresa_id_idx on public.altas_socios (empresa_id);

alter table public.altas_socios enable row level security;
-- Sin políticas: deny-by-default para anon/authenticated. Sólo service_role accede.

-- Trigger para mantener actualizado_en
create or replace function public.tg_altas_socios_touch()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists altas_socios_touch on public.altas_socios;
create trigger altas_socios_touch
  before update on public.altas_socios
  for each row execute function public.tg_altas_socios_touch();
