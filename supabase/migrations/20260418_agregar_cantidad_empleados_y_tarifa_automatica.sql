-- Tarifas UIAB (vigentes hasta mayo 2026, IPC trimestral):
--   Tarifa 1 (hasta 30 empleados):   $108.000/año
--   Tarifa 2 (31 a 99 empleados):    $216.000/año
--   Tarifa 3 (100+ empleados):       $360.000/año

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS cantidad_empleados integer,
  ADD COLUMN IF NOT EXISTS tarifa_vigente_hasta date DEFAULT '2026-05-31';

COMMENT ON COLUMN public.empresas.cantidad_empleados IS 'Cantidad de empleados declarada por la empresa al registrarse. Determina la tarifa.';
COMMENT ON COLUMN public.empresas.tarifa_vigente_hasta IS 'Fecha hasta la cual la tarifa actual está vigente antes del ajuste trimestral por IPC.';

CREATE OR REPLACE FUNCTION public.calcular_tarifa_por_empleados(p_empleados integer)
RETURNS smallint
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_empleados IS NULL THEN
    RETURN NULL;
  ELSIF p_empleados <= 30 THEN
    RETURN 1::smallint;
  ELSIF p_empleados <= 99 THEN
    RETURN 2::smallint;
  ELSE
    RETURN 3::smallint;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_autoasignar_tarifa_empresa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.cantidad_empleados IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.tarifa IS NULL THEN
        NEW.tarifa := public.calcular_tarifa_por_empleados(NEW.cantidad_empleados);
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.cantidad_empleados IS DISTINCT FROM OLD.cantidad_empleados
         AND NEW.tarifa IS NOT DISTINCT FROM OLD.tarifa THEN
        NEW.tarifa := public.calcular_tarifa_por_empleados(NEW.cantidad_empleados);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS autoasignar_tarifa_empresa ON public.empresas;
CREATE TRIGGER autoasignar_tarifa_empresa
  BEFORE INSERT OR UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_autoasignar_tarifa_empresa();
