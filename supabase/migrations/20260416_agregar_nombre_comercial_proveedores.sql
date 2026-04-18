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

-- Nota: empresas.nombre_comercial se crea vía rename desde nombre_fantasia
-- en la migración 20260417_rename_empresas_nombre_fantasia_to_nombre_comercial.sql
