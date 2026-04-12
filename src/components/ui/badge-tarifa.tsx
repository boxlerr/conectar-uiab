import { NivelTarifa } from '@/tipos';
import { cn } from '@/lib/utilidades';

const TARIFAS: Record<NivelTarifa, { nombre: string; precioAnual: number }> = {
  1: { nombre: 'Tarifa 1', precioAnual: 108_000 },
  2: { nombre: 'Tarifa 2', precioAnual: 216_000 },
  3: { nombre: 'Tarifa 3', precioAnual: 360_000 },
};

function formatearPrecioTarifa(precioAnual: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(precioAnual);
}

interface BadgeTarifaProps {
  tarifa: NivelTarifa;
  mostrarPrecio?: boolean;
  className?: string;
}

const ESTILOS: Record<NivelTarifa, string> = {
  1: 'bg-slate-100 text-slate-700 border-slate-200',
  2: 'bg-blue-50 text-blue-700 border-blue-200',
  3: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function BadgeTarifa({ tarifa, mostrarPrecio = false, className }: BadgeTarifaProps) {
  const config = TARIFAS[tarifa];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border',
      ESTILOS[tarifa],
      className
    )}>
      {config.nombre}
      {mostrarPrecio && (
        <span className="opacity-70">· {formatearPrecioTarifa(config.precioAnual)}/año</span>
      )}
    </span>
  );
}
