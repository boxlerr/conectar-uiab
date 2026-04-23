-- Onboarding / tours guiados
-- Agrega columnas a `perfiles` para trackear qué tutoriales vio cada usuario.
--
-- `tutoriales_vistos` es un objeto JSON con claves por sección:
--   { "pago_pendiente": "2026-04-22T12:00:00Z",
--     "perfil":         "2026-04-22T12:05:00Z",
--     "directorio":     null, ... }
-- Valor = timestamp ISO de cuándo lo vio (null => no visto aún).
-- El booleano `onboarding_completado` se prende cuando recorrió TODOS los
-- tours principales. Lo usamos para no mostrar el banner de bienvenida
-- después de que el usuario ya se movió solo.

ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS tutoriales_vistos JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completado_en TIMESTAMPTZ NULL;

-- Índice GIN para queries ocasionales tipo
-- "listá usuarios que todavía no vieron el tour de directorio".
CREATE INDEX IF NOT EXISTS perfiles_tutoriales_vistos_idx
  ON public.perfiles USING GIN (tutoriales_vistos);

COMMENT ON COLUMN public.perfiles.tutoriales_vistos IS
  'Mapa seccion -> timestamp ISO (o null) de cuándo el usuario completó ese tour guiado.';
COMMENT ON COLUMN public.perfiles.onboarding_completado_en IS
  'Se setea la primera vez que el usuario termina todos los tours principales.';
