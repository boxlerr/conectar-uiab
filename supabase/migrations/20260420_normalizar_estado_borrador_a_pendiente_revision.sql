-- Normaliza registros legacy en estado 'borrador' al nuevo estado inicial
-- 'pendiente_revision' para que aparezcan en la bandeja de aprobación del admin.
UPDATE empresas SET estado = 'pendiente_revision' WHERE estado = 'borrador';
UPDATE proveedores SET estado = 'pendiente_revision' WHERE estado = 'borrador';

-- Alinear el DEFAULT con el flujo actual: todo registro nuevo debe
-- requerir aprobación del admin antes de ser visible en el directorio.
ALTER TABLE empresas ALTER COLUMN estado SET DEFAULT 'pendiente_revision';
ALTER TABLE proveedores ALTER COLUMN estado SET DEFAULT 'pendiente_revision';
