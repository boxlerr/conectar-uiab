-- Auditoría de onboarding de socios para /admin/altas.
-- Junta, por email, el estado de la cuenta: último ingreso (auth.users),
-- invitación (invitaciones_acceso) y tutorial (perfiles). SECURITY DEFINER
-- porque lee auth.users; sólo la ejecuta el service_role desde el server.

create or replace function public.estado_cuentas_por_email(p_emails text[])
returns table (
  email                    text,
  ultimo_ingreso           timestamptz,
  invitacion_creada        timestamptz,
  invitacion_expira        timestamptz,
  invitacion_usada         timestamptz,
  tutoriales_vistos        jsonb,
  onboarding_completado_en timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.email,
    u.last_sign_in_at,
    inv.creado_en,
    inv.expira_en,
    inv.usado_en,
    p.tutoriales_vistos,
    p.onboarding_completado_en
  from public.perfiles p
  join auth.users u on u.id = p.id
  left join lateral (
    select ia.creado_en, ia.expira_en, ia.usado_en
    from public.invitaciones_acceso ia
    where ia.perfil_id = p.id
    order by ia.creado_en desc
    limit 1
  ) inv on true
  where lower(p.email) = any (select lower(e) from unnest(p_emails) as e);
$$;

revoke all on function public.estado_cuentas_por_email(text[]) from public;
grant execute on function public.estado_cuentas_por_email(text[]) to service_role;
