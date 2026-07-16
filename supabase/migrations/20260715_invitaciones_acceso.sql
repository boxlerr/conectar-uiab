-- Invitaciones de acceso: token propio para que un socio recién dado de alta
-- defina su contraseña por primera vez.
--
-- Reemplaza al link nativo de Supabase (generateLink invite/recovery), que vence
-- en pocas horas. Acá el enlace es válido por 30 días y de un solo uso, así las
-- empresas pueden tardar lo que necesiten sin que se les venza.
--
-- Guardamos el HASH del token (sha256), nunca el token en claro: si se filtrara
-- la tabla, los hashes no sirven para fijar contraseñas. El token en claro sólo
-- viaja en el email.
--
-- RLS: habilitado y SIN políticas → deny-by-default para anon/authenticated.
-- Sólo el service_role (server actions) crea, lee y consume los tokens.

create table if not exists public.invitaciones_acceso (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null,                       -- = auth.users.id / perfiles.id
  email       text not null,
  token_hash  text not null unique,                -- sha256 hex del token en claro
  usado_en    timestamptz,                         -- null = todavía válido / no usado
  expira_en   timestamptz not null default (now() + interval '30 days'),
  creado_en   timestamptz not null default now()
);

comment on table public.invitaciones_acceso is
  'Tokens de invitación para definir contraseña la primera vez (flujo de alta de socios). Un solo uso, válidos 30 días. Sólo accesible por service_role.';

create index if not exists invitaciones_acceso_perfil_idx on public.invitaciones_acceso (perfil_id);
create index if not exists invitaciones_acceso_email_idx  on public.invitaciones_acceso (lower(email));

alter table public.invitaciones_acceso enable row level security;
-- Sin políticas: deny-by-default para anon/authenticated. Sólo service_role accede.
