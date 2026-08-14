-- ─────────────────────────────────────────────────────────────────────────────
-- PRIMER INGRESO OBLIGATORIO: NOMBRE + CONTRASEÑA PROPIA
--
-- Cuando la UIAB da de alta a alguien de su equipo le pasa una clave provisoria
-- por mensaje. Esa clave es débil por definición —se comparte, se repite, queda
-- escrita en un chat— y encima estas cuentas son de administrador: con ellas se
-- ve el correo de todos los usuarios y se cambian roles.
--
-- Este flag hace que la clave provisoria sirva UNA sola vez. Mientras esté en
-- true, el middleware manda a /completar-cuenta desde cualquier ruta: la persona
-- escribe su nombre y elige su propia contraseña, y recién ahí puede usar la
-- plataforma. No es un cartel que se pueda saltear: es un corte de ruteo.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.perfiles
  add column if not exists debe_completar_cuenta boolean not null default false;

comment on column public.perfiles.debe_completar_cuenta is
  'true = entró con una clave provisoria y todavía no puso su nombre ni eligió una propia. El middleware lo retiene en /completar-cuenta hasta que lo haga.';

-- El socio puede apagarse el flag a sí mismo al completar la cuenta, pero el
-- resto de las columnas sensibles siguen fuera de su alcance (ver
-- 20260813_perfiles_update_solo_columnas_propias.sql).
grant update (debe_completar_cuenta) on public.perfiles to authenticated;
