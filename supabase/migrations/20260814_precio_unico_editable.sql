-- ─────────────────────────────────────────────────────────────────────────────
-- UN SOLO PRECIO, Y QUE LA BASE MANDE
--
-- Hasta hoy convivían dos fuentes de precio que no se hablaban:
--
--   1. `tarifas_precios` — 3 filas (nivel 1/2/3) editables desde /admin/suscripciones.
--   2. Las constantes PRECIO_MENSUAL / PRECIO_ANUAL del código, que son las que
--      efectivamente se cobraban.
--
-- O sea que el admin podía subir el precio en el panel, ver $60.000 en pantalla,
-- y que se siguieran cobrando $50.000. Una perilla que no movía nada.
--
-- Desde el 2026-08-14 el modelo es uno solo —$50.000 por mes o $500.000 por año,
-- que es pagar 10 meses y llevarse 12— y el precio vive acá, en una sola clave
-- de `configuraciones_sistema`. El código lo lee de la base y usa las constantes
-- sólo como red si la lectura falla.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.configuraciones_sistema (clave, valor, descripcion)
values (
  'precios_suscripcion',
  '{"mensual": 50000, "anual": 500000}'::jsonb,
  'Precio único de la suscripción, en pesos. `anual` es el pago de una vez por 12 meses. Se edita desde /admin/suscripciones.'
)
on conflict (clave) do nothing;

-- La tabla vieja queda: tiene historial (vigente_desde/hasta) y borrarla no
-- aporta nada. Pero que quede escrito que ya no decide nada.
comment on table public.tarifas_precios is
  'LEGACY (2026-08-14). El escalonado por cantidad de empleados se eliminó: hay un solo precio para todos, en configuraciones_sistema → precios_suscripcion. Esta tabla ya no la lee nadie; se conserva por historial.';

comment on column public.empresas.tarifa is
  'LEGACY (2026-08-14). Nivel del escalonado viejo (1/2/3). Ya no define lo que paga la empresa: el precio es único. Un trigger la sigue calculando por cantidad_empleados; no se usa para cobrar.';

comment on column public.suscripciones.mercado_pago_preapproval_id is
  'LEGACY (2026-08-14). Mercado Pago se dio de baja como pasarela. Se conserva por las filas históricas.';
