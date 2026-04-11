import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Entidad } from "@/lib/datos/directorio";

interface ProfileCardProps {
  entidad: Entidad;
  basePath: string; // e.g., "/empresas" or "/proveedores"
  variant?: 'grid' | 'list';
}

export function DirectoryProfileCard({ entidad, basePath, variant = 'grid' }: ProfileCardProps) {
  if (variant === 'list') {
    return (
      <Link 
        href={`${basePath}/${entidad.slug}`}
        className="group relative bg-surface-container-lowest transition-all duration-300 border border-outline-variant/10 hover:border-primary/30 hover:shadow-tinted p-0 font-inter rounded-sm overflow-hidden"
      >
        {/* Background Tonal Highlight */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors duration-300" />
        
        <div className="flex flex-col xl:grid xl:grid-cols-[auto_1fr_auto] items-center relative z-10">
          {/* Identity Block: Large Square */}
          <div className="w-full xl:w-28 h-28 flex-shrink-0 bg-surface-container-low flex items-center justify-center text-primary font-manrope font-black text-3xl border-r border-outline-variant/10 group-hover:bg-primary/5 transition-colors">
            {entidad.logo}
          </div>

          {/* Brand & Technical Body: Flexible center */}
          <div className="flex-grow p-6 min-w-0 flex flex-col xl:flex-row gap-8 items-start xl:items-center">
            <div className="flex-grow min-w-0">
              <h3 className="font-manrope text-xl font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors mb-1 break-words">
                {entidad.nombre}
              </h3>
              <p className="text-on-surface/50 text-xs leading-relaxed line-clamp-2 max-w-xl">
                {entidad.descripcionCorta}
              </p>
            </div>

            {/* Shifted Technical Metadata to a cleaner sub-flex */}
            <div className="flex flex-col gap-4 xl:border-l border-outline-variant/10 xl:pl-8 min-w-[200px] shrink-0">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.2em] leading-none">{entidad.categoria}</span>
                <span className="text-[9px] font-mono text-primary/40 font-bold leading-none">#REG-{entidad.id.toString().padStart(4, '0')}</span>
              </div>
              <div className="flex items-center space-x-2 text-on-surface/40">
                <MapPin className="w-3.5 h-3.5 text-red-500/80" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{entidad.ubicacion}</span>
              </div>
            </div>
          </div>

          {/* Precision Action */}
          <div className="p-6 ml-auto xl:px-10">
            <div className="inline-flex items-center justify-center px-8 py-4 bg-surface-container-low text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-sm border border-outline-variant/10 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 whitespace-nowrap">
              Expediente
              <ArrowRight className="w-4 h-4 ml-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link 
      href={`${basePath}/${entidad.slug}`}
      className="group relative bg-surface-container-lowest transition-all duration-300 border border-outline-variant/10 hover:border-primary/30 hover:shadow-tinted p-5 font-inter rounded-sm flex flex-col h-full overflow-hidden"
    >
      {/* Tonal Accent: Top subtle indicator */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

      {/* Header: Logo & Serial */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="w-10 h-10 bg-surface-container-low flex items-center justify-center text-primary font-manrope font-black text-xl rounded-sm border border-outline-variant/5 group-hover:bg-primary/10 transition-colors">
          {entidad.logo}
        </div>
        <div className="text-right">
          <span className="block text-[8px] font-black text-primary/30 font-mono">#{entidad.id.toString().padStart(3, '0')}</span>
          <span className="block text-[9px] font-black text-on-surface/30 uppercase tracking-[0.1em] mt-0.5">{entidad.categoria}</span>
        </div>
      </div>

      {/* Brand Body */}
      <div className="flex-grow relative z-10">
        <h3 className="font-manrope text-base font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors leading-tight mb-2 line-clamp-2">
          {entidad.nombre}
        </h3>
        <p className="text-on-surface/50 text-[11px] leading-relaxed line-clamp-2 mb-4 border-l border-outline-variant/10 pl-3">
          {entidad.descripcionCorta}
        </p>
      </div>

      {/* Footer: Tech Data */}
      <div className="mt-auto pt-4 border-t border-outline-variant/5 relative z-10">
        <div className="flex items-center space-x-2 text-on-surface/40 mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-wider truncate">
            {entidad.ubicacion}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {entidad.servicios.slice(0, 2).map((servicio, idx) => (
            <span key={idx} className="bg-surface-container-low px-2 py-0.5 text-[8px] font-black text-on-surface/50 uppercase tracking-widest border border-outline-variant/5 rounded-sm">
              {servicio}
            </span>
          ))}
          {entidad.servicios.length > 2 && (
            <span className="text-[8px] font-bold text-on-surface/20 uppercase tracking-widest px-1">
              +{entidad.servicios.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Visual Cue: Arrow that appears on hover */}
      <div className="absolute bottom-4 right-4 text-primary opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300 z-10">
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}
