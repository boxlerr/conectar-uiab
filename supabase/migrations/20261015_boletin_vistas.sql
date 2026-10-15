-- Vistas de las notas del Boletín (sólo las ven los admins).
--
-- QUÉ CUENTA UNA FILA: una persona que abrió la nota ese día (visitante único
-- por día, hora argentina). Recargar, volver desde otra pestaña o abrir el
-- enlace de nuevo esa misma jornada no suma. Lo pidió la UIAB como "cuánta
-- gente entró", y una vista por carga infla el número con cada F5.
--
-- `visitante` NO guarda nada que identifique a alguien sin sesión:
--   - con sesión:  'u:' || perfil_id
--   - sin sesión:  'a:' || sha256(secreto del servidor | día | IP | user agent)
-- El hash cambia todos los días (lleva el día adentro), así que no se puede
-- seguir a un visitante anónimo de una jornada a la otra ni volver a la IP.
-- Es la misma idea que usan Plausible o Fathom para contar sin cookies.
--
-- No se registran (lo decide /api/boletin/vista, no esta tabla): los bots que
-- se anuncian en el user agent, los navegadores automatizados y los admins,
-- que entran a revisar lo que publicaron.
--
-- RLS habilitado SIN políticas, como `visitas_perfil`: sólo el service_role
-- escribe y lee. Ojo con la trampa conocida: con la publishable key la consulta
-- no falla, devuelve []. Todo lo que lea esta tabla va por
-- `src/modulos/boletin/vistas.ts`.

create table if not exists public.vistas_comunicado (
  comunicado_id uuid not null references public.comunicados(id) on delete cascade,
  dia           date not null default (now() at time zone 'America/Argentina/Buenos_Aires')::date,
  visitante     text not null,
  con_sesion    boolean not null default false,
  creado_en     timestamptz not null default now(),
  -- El dedup ES la clave primaria: un insert repetido choca y se ignora
  -- (on conflict do nothing), sin leer antes.
  primary key (comunicado_id, dia, visitante)
);

comment on table public.vistas_comunicado is
  'Visitantes unicos por dia de cada nota publica del Boletin. Solo service_role; se muestra a los admins.';

alter table public.vistas_comunicado enable row level security;
revoke all on table public.vistas_comunicado from anon, authenticated;

-- Conteo por nota para el listado de /admin/boletin, en una sola consulta.
create or replace function public.vistas_por_comunicado()
returns table (comunicado_id uuid, vistas bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.comunicado_id, count(*)::bigint
  from public.vistas_comunicado v
  group by v.comunicado_id
$$;

revoke execute on function public.vistas_por_comunicado() from public, anon, authenticated;
grant execute on function public.vistas_por_comunicado() to service_role;
