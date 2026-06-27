-- Métricas de visitas a las fichas del directorio.
-- Cada vez que alguien abre el perfil público de una empresa o proveedor se
-- registra una visita (salvo que sea el propio dueño). El socio ve el total y
-- los últimos 30 días en su dashboard.
--
-- RLS habilitado sin políticas: sólo el service_role (server actions) escribe/lee.

create table if not exists public.visitas_perfil (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid references public.empresas(id) on delete cascade,
  proveedor_id        uuid references public.proveedores(id) on delete cascade,
  visitante_perfil_id uuid references public.perfiles(id) on delete set null,
  creado_en           timestamptz not null default now(),
  -- Debe apuntar a exactamente una entidad.
  constraint visitas_perfil_una_entidad check (
    (empresa_id is not null)::int + (proveedor_id is not null)::int = 1
  )
);

comment on table public.visitas_perfil is
  'Visitas a las fichas publicas del directorio (empresas/proveedores). Se muestran al dueno como metrica.';

create index if not exists visitas_perfil_empresa_idx   on public.visitas_perfil (empresa_id, creado_en desc);
create index if not exists visitas_perfil_proveedor_idx on public.visitas_perfil (proveedor_id, creado_en desc);

alter table public.visitas_perfil enable row level security;
