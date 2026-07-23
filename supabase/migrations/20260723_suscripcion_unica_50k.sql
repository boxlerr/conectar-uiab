-- Modelo de suscripción ÚNICO (decisión de la reunión):
--   $50.000/mes  ó  $500.000/año (pago anual de una), igual para empresas y particulares.
--   Las socias UIAB actuales (empresas.n_socio not null) NO pagan: ya son miembros → cortesía.
--   Altas nuevas (sin n_socio) sí abonan.

-- 1) Ciclo de facturación en la suscripción (mensual/anual).
alter table public.suscripciones
  add column if not exists ciclo text not null default 'mensual';
alter table public.suscripciones drop constraint if exists suscripciones_ciclo_check;
alter table public.suscripciones add constraint suscripciones_ciclo_check
  check (ciclo in ('mensual', 'anual'));

-- 2) Precio plano. La tabla `tarifas_precios` (por nivel) queda por compatibilidad,
--    pero todos los niveles pasan a $50.000 (ya no hay escalonado por empleados).
update public.tarifas_precios
  set precio_mensual = 50000, actualizado_en = now();

-- 3) Backfill: cortesía (activa, $0) para las socias UIAB que aún no tienen suscripción,
--    así entran al panel/directorio sin pasar por el checkout. proximo_cobro_en queda NULL
--    (el cron de mora no las toca).
insert into public.suscripciones (empresa_id, monto, moneda, nombre_plan, estado, metodo_pago, ciclo, notas_admin)
select e.id, 0, 'ARS', 'Socia UIAB (sin cargo)', 'activa', 'cortesia', 'mensual',
       'Acceso sin cargo por ser socia de la UIAB (N° socio ' || coalesce(e.n_socio, '—') || ').'
from public.empresas e
where e.n_socio is not null
  and e.estado = 'aprobada'
  and not exists (select 1 from public.suscripciones s where s.empresa_id = e.id);
