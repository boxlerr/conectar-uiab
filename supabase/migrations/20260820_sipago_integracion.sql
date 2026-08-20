-- Sipago como pasarela de cobro (2026-08-20).
--
-- Mercado Pago se dio de baja el 2026-08-14 y desde entonces la suscripción se
-- cobraba por fuera de la plataforma. Esta migración deja la base lista para el
-- flujo de Sipago: guardar la orden (intención de pago), poder acreditarla una
-- sola vez aunque el aviso llegue repetido, y admitir los métodos que se usan
-- hoy.
--
-- Es idempotente a propósito: las columnas sipago_* ya existían en producción
-- sin migración que las respaldara, así que esto también sirve para reponerlas
-- en cualquier entorno que no las tenga (dev, una restauración, un branch).

-- =========================================================
-- Columnas
-- =========================================================

alter table public.suscripciones
  add column if not exists sipago_order_uuid text;

comment on column public.suscripciones.sipago_order_uuid is
  'UUID de la última orden Sipago generada para esta suscripción. Es el único vínculo entre el pago y el socio: la API de Sipago no permite adjuntar una referencia propia a la orden.';

alter table public.pagos_suscripciones
  add column if not exists sipago_order_uuid text,
  add column if not exists sipago_payment_id text;

comment on column public.pagos_suscripciones.sipago_order_uuid is
  'UUID de la orden Sipago (intención de pago) que originó este pago.';
comment on column public.pagos_suscripciones.sipago_payment_id is
  'ID del pago Sipago (payment.id) una vez aprobado.';

-- =========================================================
-- Métodos de pago admitidos
-- =========================================================
--
-- El CHECK original (20260420) sólo aceptaba mercadopago/efectivo/cheque/
-- cortesia. El código escribe 'transferencia' desde el 2026-08-14 y ahora
-- también 'sipago'. Se recrea con la lista completa; 'mercadopago' se conserva
-- porque hay filas históricas que lo tienen.

alter table public.suscripciones drop constraint if exists suscripciones_metodo_pago_check;
alter table public.suscripciones add constraint suscripciones_metodo_pago_check
  check (metodo_pago in ('sipago','transferencia','efectivo','cheque','cortesia','mercadopago'));

alter table public.pagos_suscripciones drop constraint if exists pagos_suscripciones_metodo_pago_check;
alter table public.pagos_suscripciones add constraint pagos_suscripciones_metodo_pago_check
  check (metodo_pago in ('sipago','transferencia','efectivo','cheque','cortesia','mercadopago'));

-- El default seguía siendo 'mercadopago', que ya no existe como forma de cobro.
alter table public.suscripciones alter column metodo_pago set default 'transferencia';
alter table public.pagos_suscripciones alter column metodo_pago set default 'transferencia';

-- =========================================================
-- Índices
-- =========================================================

-- El webhook llega con el uuid de la orden y con eso tiene que encontrar al
-- socio. Sin índice es un seq scan de la tabla entera por cada aviso.
create index if not exists idx_suscripciones_sipago_order
  on public.suscripciones (sipago_order_uuid)
  where sipago_order_uuid is not null;

create index if not exists idx_pagos_sipago_order
  on public.pagos_suscripciones (sipago_order_uuid)
  where sipago_order_uuid is not null;

-- ACÁ ESTÁ LO IMPORTANTE. Sipago reintenta el webhook hasta 4 veces y, además,
-- la página de resultado consulta la orden por su cuenta cuando el socio vuelve
-- del checkout. Sin este índice, dos caminos concurrentes podían cargar el mismo
-- pago dos veces y correr proximo_cobro_en un mes de más por cada duplicado.
-- El chequeo previo en código no alcanza: entre el SELECT y el INSERT hay una
-- ventana, y es justo la ventana en la que caen los reintentos.
create unique index if not exists uq_pagos_sipago_order_aprobado
  on public.pagos_suscripciones (sipago_order_uuid)
  where sipago_order_uuid is not null and estado = 'aprobado';
