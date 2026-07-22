-- Extiende el sistema de notificaciones para cubrir OPORTUNIDADES y SUSCRIPCIONES
-- (hasta ahora el CHECK de `notificaciones.tipo` solo permitía reseñas) y agrega
-- el tipo de requerimiento a `oportunidades` (material / servicio / personal / otro).

-- 1) notificaciones.tipo: sumar los nuevos tipos in-web.
alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo in (
    -- reseñas (ya existían)
    'resena_aprobada','resena_rechazada','resena_recibida',
    -- oportunidades
    'oportunidad_solicitud','solicitud_respondida',
    -- suscripciones
    'pago_confirmado','pago_fallido',
    'suscripcion_por_vencer','suscripcion_en_mora','suscripcion_suspendida'
  ));

-- 2) oportunidades.tipo_requerimiento: qué busca quien publica (multi).
alter table public.oportunidades
  add column if not exists tipo_requerimiento text[] not null default '{}';

alter table public.oportunidades drop constraint if exists oportunidades_tipo_requerimiento_check;
alter table public.oportunidades add constraint oportunidades_tipo_requerimiento_check
  check (tipo_requerimiento <@ array['material','servicio','personal','otro']::text[]);
