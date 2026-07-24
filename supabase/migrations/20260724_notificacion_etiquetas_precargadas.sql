-- ═══════════════════════════════════════════════════════════════════════════
-- Notificación "etiquetas_precargadas"  —  YA APLICADA A PROD (2026-07-24)
-- ═══════════════════════════════════════════════════════════════════════════
-- Contexto: el equipo pre-cargó etiquetas de match a las 51 socias del padrón
-- (filas en empresas_tags con origen 'inferido', deducidas del rubro/actividad
-- de cada empresa). Este tipo de notificación avisa a las cuentas existentes
-- que pueden revisarlas/ajustarlas en /perfil/etiquetas.
--
-- El aviso en la app (banner en dashboard y Mi Resumen) NO usa este tipo:
-- se muestra mientras la empresa tenga tags con origen 'inferido' y
-- desaparece solo cuando la socia guarda sus etiquetas (saveTags reescribe
-- todo con origen 'manual').

alter table public.notificaciones drop constraint notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo = any (array[
    'resena_aprobada'::text,
    'resena_rechazada'::text,
    'resena_recibida'::text,
    'oportunidad_solicitud'::text,
    'solicitud_respondida'::text,
    'pago_confirmado'::text,
    'pago_fallido'::text,
    'suscripcion_por_vencer'::text,
    'suscripcion_en_mora'::text,
    'suscripcion_suspendida'::text,
    'etiquetas_precargadas'::text
  ]));
