-- =============================================================================
-- Migración: Renombrar empresas.nombre_fantasia → empresas.nombre_comercial
-- Fecha: 2026-04-17
--
-- Unificamos el naming: ahora tanto empresas como proveedores usan
-- `nombre_comercial`. La columna `nombre_fantasia` era redundante con
-- `razon_social` + `nombre_comercial` y genera confusión en el formulario.
-- El rename preserva los datos existentes.
-- =============================================================================

ALTER TABLE empresas RENAME COLUMN nombre_fantasia TO nombre_comercial;

COMMENT ON COLUMN empresas.nombre_comercial IS
  'Nombre comercial de la empresa - el nombre que usan en sus operaciones comerciales.';
