-- Diferencias entre el formulario de /sumate y el padrón UIAB.
--
-- Cuando una socia completa el alta, su empresa casi siempre YA existe en
-- `empresas` (viene del padrón importado). Los dos juegos de datos pueden no
-- coincidir: el padrón puede tener el correo general y el formulario el del
-- referente, o el formulario puede traer la dirección abreviada.
--
-- Al crear la cuenta guardamos acá esas diferencias para mostrárselas a la
-- socia en su primer ingreso y que confirme cuál es el dato bueno. La regla de
-- fusión (qué pisa y qué sólo completa) vive en src/modulos/altas/padron.ts.
--
-- No hace falta tocar RLS: `altas_socios` ya es deny-by-default y estas
-- columnas se leen/escriben desde server actions con service_role.

alter table public.altas_socios
  add column if not exists conflictos_padron jsonb,
  add column if not exists conflictos_revisados_en timestamptz;

comment on column public.altas_socios.conflictos_padron is
  'Diferencias entre lo cargado en /sumate y lo que ya figuraba en el padrón: [{campo, etiqueta, valor_formulario, valor_padron, aplicado, resuelto}]. NULL = alta sin cuenta creada todavía.';

comment on column public.altas_socios.conflictos_revisados_en is
  'Cuándo la socia terminó de revisar las diferencias desde su panel. NULL = todavía tiene el aviso pendiente.';
