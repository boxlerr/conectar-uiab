import Link from "next/link";
import { ArrowRight, MapPin, BadgeCheck, ShieldCheck } from "lucide-react";
import { Entidad } from "@/lib/datos/directorio";

interface ProfileCardProps {
  entidad: Entidad;
  basePath: string;
  variant?: 'grid' | 'list';
  colorScheme?: 'blue' | 'emerald';
}

export function DirectoryProfileCard({ entidad, basePath, variant = 'grid', colorScheme = 'blue' }: ProfileCardProps) {
  const isEmerald = colorScheme === 'emerald';
  const themeBase = isEmerald ? "bg-emerald-900 border-emerald-900/10 hover:border-emerald-500/40" : "bg-primary border-primary/10 hover:border-blue-400/40";
  const hoverText = isEmerald ? "group-hover:text-emerald-700" : "group-hover:text-primary";
  const glowHover = isEmerald ? "group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]" : "group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.2)]";
  const bgLogo = isEmerald ? "bg-emerald-50 group-hover:bg-emerald-100 text-emerald-800" : "bg-slate-50 group-hover:bg-blue-50 text-primary";
  const indicatorLine = isEmerald ? "bg-emerald-500" : "bg-blue-500";
  const badgeClasses = isEmerald 
    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] border-white/20" 
    : "bg-gradient-to-tr from-[#00213f] to-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] border-white/20";

  if (variant === 'list') {
    return (
      <Link 
        href={`${basePath}/${entidad.slug}`}
        className={`group relative bg-white transition-all duration-500 border border-slate-200 p-0 font-inter rounded-xl overflow-hidden hover:shadow-xl ${glowHover}`}
      >
        {/* Subtle Indicator Line */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${indicatorLine} scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top`} />
        
        <div className="flex flex-col xl:grid xl:grid-cols-[auto_1fr_auto] items-stretch relative z-10">
          {/* Identity Block */}
          <div className={`w-full xl:w-32 h-32 flex-shrink-0 flex items-center justify-center font-manrope font-black text-4xl border-r border-slate-100 transition-colors duration-500 ${bgLogo}`}>
            {entidad.logo}
          </div>

          {/* Core Info */}
          <div className="flex-grow p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
            <div className="flex-grow min-w-0 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <h3 className={`font-manrope text-2xl font-extrabold text-slate-800 tracking-tight transition-colors ${hoverText} truncate`}>
                  {entidad.nombre}
                </h3>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border ${badgeClasses} scale-90 origin-left`}>
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Verificado</span>
                </div>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 max-w-2xl font-medium">
                {entidad.descripcionCorta}
              </p>
            </div>

            {/* Technical Metadata */}
            <div className={`flex flex-col gap-3 xl:border-l ${isEmerald ? 'border-emerald-100' : 'border-blue-100'} xl:pl-6 min-w-[220px] shrink-0`}>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isEmerald ? 'text-emerald-600/70' : 'text-blue-600/70'}`}>Sector</span>
                <span className="text-sm font-bold text-slate-700 truncate">{entidad.categoria}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 w-fit">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">{entidad.ubicacion}</span>
              </div>
            </div>
          </div>

          {/* Premium Tech Action */}
          <div className="p-6 ml-auto xl:border-l border-slate-100 flex items-center justify-center bg-slate-50/50 group-hover:bg-transparent transition-colors">
            <div className={`inline-flex items-center justify-center px-6 py-3.5 bg-white text-sm font-bold rounded-lg border border-slate-200 shadow-sm group-hover:text-white transition-all duration-300 ${isEmerald ? 'group-hover:bg-emerald-600 group-hover:border-emerald-600' : 'group-hover:bg-[#00213f] group-hover:border-[#00213f]'}`}>
              Ver Expediente
              <ArrowRight className="w-4 h-4 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant
  return (
    <Link 
      href={`${basePath}/${entidad.slug}`}
      className={`group relative bg-white transition-all duration-500 border border-slate-200 p-6 font-inter rounded-xl flex flex-col h-full overflow-hidden hover:-translate-y-1 hover:shadow-xl ${glowHover}`}
    >
      {/* Top indicator ribbon */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${indicatorLine} origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />

      {/* Header: Logo & Badges */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-14 h-14 flex items-center justify-center font-manrope font-black text-2xl rounded-lg border border-slate-100 transition-colors duration-500 shadow-sm ${bgLogo} shrink-0`}>
          {entidad.logo}
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border ${badgeClasses}`}>
            <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest shadow-sm">Verificado</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-right">
            {entidad.categoria}
          </span>
        </div>
      </div>

      {/* Body Core */}
      <div className="flex-grow relative z-10 mb-6">
        <h3 className={`font-manrope text-xl font-extrabold text-slate-800 tracking-tight leading-tight mb-3 transition-colors ${hoverText} line-clamp-2 break-words`}>
          {entidad.nombre}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-4">
          {entidad.descripcionCorta}
        </p>
      </div>

      {/* Footer Details */}
      <div className="pt-5 border-t border-slate-100 mt-auto">
        <div className="flex items-start gap-2 mb-4 text-slate-600 bg-slate-50 w-full px-3 py-2 rounded-md border border-slate-100">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span className="text-xs font-bold uppercase tracking-wider leading-relaxed">
            {entidad.ubicacion}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {entidad.servicios.slice(0, 3).map((servicio, idx) => (
            <span key={idx} className="bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 rounded-md whitespace-nowrap">
              {servicio}
            </span>
          ))}
          {entidad.servicios.length > 3 && (
            <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-400 rounded-md">
              +{entidad.servicios.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Action Arrow Float */}
      <div className={`absolute bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 z-10 shadow-lg ${isEmerald ? 'bg-emerald-600' : 'bg-primary'}`}>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
