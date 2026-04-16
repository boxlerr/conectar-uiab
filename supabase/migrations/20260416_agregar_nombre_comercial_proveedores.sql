-- =============================================================================
-- Migración: Agregar columna nombre_comercial a tabla proveedores
-- Fecha: 2026-04-16
--
-- Agregamos la columna nombre_comercial a la tabla proveedores para permitir
-- que los proveedores especifiquen su nombre comercial además de su razón social.
-- =============================================================================

ALTER TABLE proveedores
  ADD COLUMN IF NOT EXISTS nombre_comercial text;

COMMENT ON COLUMN proveedores.nombre_comercial IS
  'Nombre comercial del proveedor - el nombre que usan en sus operaciones comerciales.';

-- También agregar a empresas para mantener consistencia
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS nombre_comercial text;

COMMENT ON COLUMN empresas.nombre_comercial IS
  'Nombre comercial de la empresa - el nombre que usan en sus operaciones comerciales.';
