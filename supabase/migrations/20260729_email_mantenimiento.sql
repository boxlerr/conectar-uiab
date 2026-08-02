-- Correo de mantenimiento: opcional y PUBLICO (se muestra en la ficha del
-- directorio para que contacten al area tecnica / de mantenimiento de la
-- empresa). Mismo criterio que `email_compras`: es distinto de `email`, que
-- es el correo de la cuenta / persona que usa el sistema.
alter table public.empresas     add column if not exists email_mantenimiento text;
alter table public.proveedores  add column if not exists email_mantenimiento text;
alter table public.altas_socios add column if not exists email_mantenimiento text;

comment on column public.empresas.email_mantenimiento is
  'Correo de mantenimiento, opcional y publico. Se muestra en la ficha del directorio. Distinto de email (cuenta).';
comment on column public.proveedores.email_mantenimiento is
  'Correo de mantenimiento, opcional y publico. Se muestra en la ficha del directorio. Distinto de email (cuenta).';
comment on column public.altas_socios.email_mantenimiento is
  'Correo de mantenimiento declarado en el alta. Se fusiona al padron sin pisar lo ya cargado.';
