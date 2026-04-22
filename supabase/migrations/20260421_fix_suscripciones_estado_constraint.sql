-- Corrige el CHECK constraint de suscripciones.estado para alinear los valores
-- con los usados en el código (pendiente_pago, en_mora, suspendida) vs los
-- originales (pendiente, morosa, vencida).

ALTER TABLE public.suscripciones DROP CONSTRAINT suscripciones_estado_check;

-- Migrar filas existentes con los valores legacy
UPDATE public.suscripciones SET estado = 'pendiente_pago' WHERE estado = 'pendiente';
UPDATE public.suscripciones SET estado = 'en_mora'        WHERE estado = 'morosa';
UPDATE public.suscripciones SET estado = 'suspendida'     WHERE estado = 'vencida';

-- Nuevo constraint con los valores canónicos del sistema
ALTER TABLE public.suscripciones
  ADD CONSTRAINT suscripciones_estado_check
  CHECK (estado IN ('pendiente_pago', 'activa', 'en_mora', 'suspendida', 'cancelada'));
