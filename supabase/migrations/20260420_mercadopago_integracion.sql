-- Integración con Mercado Pago — Suscripciones.
-- Extiende `suscripciones` y `pagos_suscripciones` con método de pago,
-- grace period, y auditoría de cargas manuales (efectivo/cheque).

-- =========================================================
-- suscripciones: columnas nuevas
-- =========================================================

ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS metodo_pago text NOT NULL DEFAULT 'mercadopago'
    CHECK (metodo_pago IN ('mercadopago','efectivo','cheque','cortesia')),
  ADD COLUMN IF NOT EXISTS proximo_cobro_en timestamptz,
  ADD COLUMN IF NOT EXISTS ultima_notificacion_en timestamptz,
  ADD COLUMN IF NOT EXISTS gracia_hasta timestamptz,
  ADD COLUMN IF NOT EXISTS notas_admin text;

-- Normalizar valores de `estado` admitidos. No restringimos con CHECK
-- para no bloquear registros ya presentes con otros valores; se controla
-- desde código.
COMMENT ON COLUMN public.suscripciones.estado IS
  'Valores: pendiente_pago | activa | en_mora | suspendida | cancelada';

COMMENT ON COLUMN public.suscripciones.metodo_pago IS
  'Medio de cobro actual. `mercadopago` recurrente, `efectivo`/`cheque` cargados por admin, `cortesia` sin cobro.';

CREATE INDEX IF NOT EXISTS idx_suscripciones_estado
  ON public.suscripciones (estado);

CREATE INDEX IF NOT EXISTS idx_suscripciones_empresa
  ON public.suscripciones (empresa_id) WHERE empresa_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_suscripciones_proveedor
  ON public.suscripciones (proveedor_id) WHERE proveedor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_suscripciones_preapproval
  ON public.suscripciones (mercado_pago_preapproval_id)
  WHERE mercado_pago_preapproval_id IS NOT NULL;

-- =========================================================
-- pagos_suscripciones: columnas nuevas
-- =========================================================

ALTER TABLE public.pagos_suscripciones
  ADD COLUMN IF NOT EXISTS metodo_pago text NOT NULL DEFAULT 'mercadopago'
    CHECK (metodo_pago IN ('mercadopago','efectivo','cheque','cortesia')),
  ADD COLUMN IF NOT EXISTS tipo_pago text NOT NULL DEFAULT 'automatico'
    CHECK (tipo_pago IN ('automatico','manual')),
  ADD COLUMN IF NOT EXISTS registrado_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nota text;

COMMENT ON COLUMN public.pagos_suscripciones.tipo_pago IS
  'automatico = disparado por webhook MP; manual = cargado por admin.';

CREATE INDEX IF NOT EXISTS idx_pagos_suscripcion
  ON public.pagos_suscripciones (suscripcion_id);

CREATE INDEX IF NOT EXISTS idx_pagos_mp_payment
  ON public.pagos_suscripciones (mercado_pago_payment_id)
  WHERE mercado_pago_payment_id IS NOT NULL;

-- Evita duplicar el mismo pago de MP (reintentos de webhook).
CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_mp_payment
  ON public.pagos_suscripciones (mercado_pago_payment_id)
  WHERE mercado_pago_payment_id IS NOT NULL;

-- =========================================================
-- RLS (Row Level Security)
-- =========================================================

ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_suscripciones ENABLE ROW LEVEL SECURITY;

-- Lectura: dueño (miembro de la empresa/proveedor) o admin.
DROP POLICY IF EXISTS suscripciones_select_own ON public.suscripciones;
CREATE POLICY suscripciones_select_own ON public.suscripciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.perfiles p
      WHERE p.id = auth.uid() AND p.rol_sistema = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.miembros_empresa m
      WHERE m.empresa_id = suscripciones.empresa_id AND m.perfil_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.miembros_proveedor m
      WHERE m.proveedor_id = suscripciones.proveedor_id AND m.perfil_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS pagos_suscripciones_select_own ON public.pagos_suscripciones;
CREATE POLICY pagos_suscripciones_select_own ON public.pagos_suscripciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.perfiles p
      WHERE p.id = auth.uid() AND p.rol_sistema = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.miembros_empresa m
      WHERE m.empresa_id = pagos_suscripciones.empresa_id AND m.perfil_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.miembros_proveedor m
      WHERE m.proveedor_id = pagos_suscripciones.proveedor_id AND m.perfil_id = auth.uid()
    )
  );

-- Mutación solo por service_role (backend). No abrimos políticas públicas.

-- =========================================================
-- Helpers SQL
-- =========================================================

-- Monto mensual esperado para una empresa según su tarifa actual.
CREATE OR REPLACE FUNCTION public.monto_mensual_empresa(p_empresa_id uuid)
RETURNS numeric
LANGUAGE sql STABLE
AS $$
  SELECT tp.precio_mensual
    FROM public.empresas e
    JOIN public.tarifas_precios tp ON tp.nivel = e.tarifa
   WHERE e.id = p_empresa_id
$$;

COMMENT ON FUNCTION public.monto_mensual_empresa(uuid) IS
  'Precio mensual vigente para la empresa según su tarifa (1/2/3).';
