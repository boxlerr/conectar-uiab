-- El gate de pago le preguntaba el estado a quien tiene que pagar.
-- Aplicada en producción el 2026-08-13.
--
-- QUÉ PASABA
-- La policy `suscripciones_update` es `es_admin() OR puede_gestionar_empresa(empresa_id)`,
-- y las 25 membresías de `miembros_empresa` son gestor o dueño — o sea, todas.
-- Con el token del propio socio, desde la consola del navegador:
--
--     createClient().from('suscripciones')
--       .update({estado:'activa'}).eq('empresa_id', <su id>)
--
-- devolvía 200 y persistía. En el request siguiente `tieneAcceso('activa')` da
-- true y se abren /perfil, /panel-de-control y /oportunidades. Verificado contra
-- producción: una suscripción pasó de `pendiente_pago` a `activa` sin pagar nada.
-- O sea que todo el corte del middleware era evitable con una línea de consola.
--
-- POR QUÉ ALCANZA CON REVOCAR
-- Nada legítimo escribe esta tabla desde el navegador ni con la sesión del
-- usuario. Los ocho lugares que la tocan usan `service_role`, que no pasa por
-- estos grants: el webhook y las tres rutas de Mercado Pago, el cron, la página
-- de pendiente-aprobacion, register-sync, altas y las acciones de admin. (Las
-- rutas de MP importan `@/lib/supabase/servidor`, pero sólo para leer la sesión;
-- el trabajo sobre la base lo hacen con `createAdminClient()`.)
--
-- El socio sólo necesita LEER su suscripción, y eso sigue funcionando: lo usan
-- /perfil/suscripcion, /suscripcion/bloqueado y el banner del panel.
--
-- Se revoca también en `pagos_suscripciones`: es el historial de cobros y no hay
-- ningún motivo para que se pueda escribir desde el cliente.

revoke insert, update, delete on public.suscripciones from authenticated, anon;
revoke insert, update, delete on public.pagos_suscripciones from authenticated, anon;

notify pgrst, 'reload schema';
