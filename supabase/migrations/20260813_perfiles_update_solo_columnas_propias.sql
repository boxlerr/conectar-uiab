-- Escalada de privilegios en `perfiles`: cualquier usuario logueado podía
-- hacerse administrador. Aplicada en producción el 2026-08-13.
--
-- QUÉ PASABA
-- `authenticated` (y `anon`) tenían UPDATE a nivel TABLA sobre `perfiles`. La
-- política RLS deja que cada uno edite su propia fila —que está bien, es lo que
-- usa el onboarding para guardar `tutoriales_vistos`— pero RLS no distingue
-- columnas. Con el token del propio socio:
--
--     PATCH /rest/v1/perfiles?id=eq.<su-id>   {"rol_sistema":"admin"}
--
-- devolvía 200 y persistía. Verificado contra producción. Tres consecuencias:
--
--   1. `rol_sistema` → cualquiera se hacía admin y entraba a todo el panel.
--   2. `activo`      → un usuario desactivado se reactivaba solo, salteando
--                      tanto el corte del middleware como el de su empresa.
--   3. `email`       → cambiárselo permite apropiarse de un alta ajena, porque
--                      `crearCuentaDesdeAlta` busca el perfil por email.
--
-- OJO CON EL ARREGLO
-- El primer intento fue `revoke update (columnas)`, y NO hizo nada: mientras
-- exista el grant de tabla, Postgres ignora los revokes por columna. Peor, la
-- vista `information_schema.column_privileges` muestra el grant de tabla
-- expandido columna por columna, así que leerla hace creer que el revoke
-- funcionó. Hay que sacar el UPDATE de tabla y volver a otorgar sólo las
-- columnas que el socio sí puede tocar.
--
-- Todo lo legítimo que escribe las columnas sensibles lo hace con `service_role`
-- desde el servidor (modulos/admin/acciones.ts, perfil/usuarios/acciones.ts,
-- api/auth/register-sync), y `service_role` no pasa por estos grants.

revoke update on public.perfiles from authenticated, anon;

grant update (
  nombre_completo,
  telefono,
  cargo,
  bucket_avatar,
  ruta_avatar,
  nombre_avatar,
  mime_avatar,
  tamano_avatar_bytes,
  tutoriales_vistos,
  onboarding_completado_en,
  actualizado_en
) on public.perfiles to authenticated;

-- PostgREST cachea esquema y permisos: sin esto el cambio no se ve hasta que el
-- pooler recicle por su cuenta.
notify pgrst, 'reload schema';
