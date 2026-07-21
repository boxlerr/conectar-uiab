-- Correo de compras/proveedores: opcional y PUBLICO (se muestra en la ficha del
-- directorio para que contacten a la empresa por compras). Es distinto de
-- `email`, que es el correo de la cuenta / persona que usa el sistema.
alter table public.empresas     add column if not exists email_compras text;
alter table public.proveedores  add column if not exists email_compras text;
alter table public.altas_socios add column if not exists email_compras text;

comment on column public.empresas.email_compras is
  'Correo de compras, opcional y publico. Se muestra en la ficha del directorio. Distinto de email (cuenta).';
comment on column public.proveedores.email_compras is
  'Correo de compras, opcional y publico. Se muestra en la ficha del directorio. Distinto de email (cuenta).';
