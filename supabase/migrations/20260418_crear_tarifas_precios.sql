-- Precios mensuales globales por nivel de tarifa.
-- Se ajustan trimestralmente por IPC desde el admin.

CREATE TABLE IF NOT EXISTS public.tarifas_precios (
  nivel smallint PRIMARY KEY CHECK (nivel IN (1,2,3)),
  precio_mensual numeric(12,2) NOT NULL,
  vigente_desde date NOT NULL DEFAULT CURRENT_DATE,
  vigente_hasta date,
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_por uuid
);

COMMENT ON TABLE public.tarifas_precios IS 'Precios mensuales globales por nivel de tarifa. Se ajustan trimestralmente por IPC.';

INSERT INTO public.tarifas_precios (nivel, precio_mensual, vigente_desde, vigente_hasta)
VALUES
  (1, 108000, '2026-02-01', '2026-05-31'),
  (2, 216000, '2026-02-01', '2026-05-31'),
  (3, 360000, '2026-02-01', '2026-05-31')
ON CONFLICT (nivel) DO NOTHING;

ALTER TABLE public.tarifas_precios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tarifas_precios_select ON public.tarifas_precios;
CREATE POLICY tarifas_precios_select ON public.tarifas_precios
  FOR SELECT USING (true);
