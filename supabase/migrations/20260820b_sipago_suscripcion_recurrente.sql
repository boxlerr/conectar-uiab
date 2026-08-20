-- Débito automático con el plan recurrente de Sipago (2026-08-20).
--
-- El canon mensual pasa a cobrarse con un plan de suscripción del portal, que
-- debita solo todos los meses. Como ese módulo no tiene webhook ni API pública,
-- la plataforma se entera por conciliación: el admin trae el reporte de Cobros
-- y se matchea por CUIT.
--
-- Hace falta un método propio para distinguirlo de 'sipago' (Checkout, un pago
-- suelto que se acredita solo por webhook). Son dos circuitos distintos y el
-- panel tiene que poder decir cuál es cuál.

alter table public.suscripciones drop constraint if exists suscripciones_metodo_pago_check;
alter table public.suscripciones add constraint suscripciones_metodo_pago_check
  check (metodo_pago in ('sipago_suscripcion','sipago','transferencia','efectivo','cheque','cortesia','mercadopago'));

alter table public.pagos_suscripciones drop constraint if exists pagos_suscripciones_metodo_pago_check;
alter table public.pagos_suscripciones add constraint pagos_suscripciones_metodo_pago_check
  check (metodo_pago in ('sipago_suscripcion','sipago','transferencia','efectivo','cheque','cortesia','mercadopago'));

comment on column public.suscripciones.metodo_pago is
  'sipago_suscripcion = plan recurrente del portal (debita solo, se concilia por CUIT). sipago = Checkout, pago suelto que se acredita por webhook. transferencia/efectivo/cheque = los carga el admin. cortesia = socia del padron, sin cargo.';

-- El CUIT es la clave de conciliacion contra el reporte de Sipago: es el unico
-- dato que el socio carga en el checkout del plan y que nosotros ya tenemos.
-- Sin indice, cada fila del reporte es un scan de la tabla entera.
create index if not exists idx_empresas_cuit_digitos
  on public.empresas ((regexp_replace(cuit, '\D', '', 'g')))
  where cuit is not null;

create index if not exists idx_proveedores_cuit_digitos
  on public.proveedores ((regexp_replace(cuit, '\D', '', 'g')))
  where cuit is not null;
