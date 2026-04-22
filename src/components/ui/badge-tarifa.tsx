import { NivelTarifa } from '@/tipos';
import { cn } from '@/lib/utilidades';

function formatearPrecioTarifa(precioMensual: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(precioMensual);
}

interface BadgeTarifaProps {
  tarifa: NivelTarifa;
  mostrarPrecio?: boolean;
  precioMensual?: number | null; // Optional dynamic price
  className?: string;
}

const ESTILOS: Record<NivelTarifa, string> = {
  1: 'bg-slate-100 text-slate-700 border-slate-200',
  2: 'bg-blue-50 text-blue-700 border-blue-200',
  3: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function BadgeTarifa({ tarifa, mostrarPrecio = false, precioMensual, className }: BadgeTarifaProps) {
  const nombre = `Tarifa ${tarifa}`;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border',
      ESTILOS[tarifa],
      className
    )}>
      {nombre}
      {mostrarPrecio && precioMensual != null && (
        <span className="opacity-70">· {formatearPrecioTarifa(precioMensual)}/mes</span>
      )}
    </span>
  );
}
