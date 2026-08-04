-- Usuarios por empresa: cada socia da de alta a su propia gente desde
-- /perfil/usuarios (email + contraseña + nombre), y les pone un área/cargo para
-- saber quién es quién en el listado ("Compras", "Mantenimiento", "RRHH"…).
--
-- La membresía ya existía (miembros_empresa / miembros_proveedor) y el estado
-- activo/inactivo ya vivía en perfiles.activo, así que lo único que falta es
-- dónde guardar ese cargo. Texto libre a propósito: las opciones de la UI son
-- una ayuda, no una taxonomía — si a la empresa no le sirve ninguna, escribe la
-- suya y listo.
alter table public.perfiles
  add column if not exists cargo text;

comment on column public.perfiles.cargo is
  'Área o puesto dentro de la empresa (Compras, Mantenimiento, RRHH…). Texto libre: la UI sugiere opciones pero acepta cualquier valor.';
