import Link from "next/link";
import { ArrowRight, MapPin, Building2 } from "lucide-react";
import { Entidad } from "@/lib/data/directorio";

interface LandingProfileCardProps {
  entidad: Entidad;
  basePath: string;
}

export function LandingProfileCard({ entidad, basePath }: LandingProfileCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-900/10 border border-slate-100 hover:border-primary-100 flex flex-col h-full">
      {/* Visual Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-primary-600 font-manrope font-black text-2xl border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all duration-300">
          {entidad.logo}
        </div>
        <div className="bg-primary-50 px-3 py-1 rounded-full">
          <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{entidad.categoria}</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-grow">
        <h3 className="font-manrope text-xl font-bold text-[#191c1e] tracking-tight group-hover:text-primary-600 transition-colors mb-3">
          {entidad.nombre}
        </h3>
        <p className="text-slate-500 text-[14px] leading-relaxed line-clamp-3 mb-6">
          {entidad.descripcionCorta}
        </p>
      </div>

      {/* Metadata Footer */}
      <div className="mt-auto pt-6 border-t border-slate-50 flex flex-col gap-4">
        <div className="flex items-center gap-2.5 text-slate-400">
          <MapPin className="w-4 h-4 text-red-400" />
          <span className="text-[12px] font-medium tracking-tight">
            {entidad.ubicacion}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {entidad.servicios.slice(0, 2).map((servicio, idx) => (
            <span key={idx} className="bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500 rounded-lg group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
              {servicio}
            </span>
          ))}
        </div>

        <div className="pt-2">
          <div className="inline-flex items-center gap-2 text-primary-600 font-bold text-[13px] group-hover:gap-3 transition-all">
            Ver perfil completo
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Invisible Link Overlay */}
       <Link href="#" onClick={(e) => e.preventDefault()} className="absolute inset-0 cursor-not-allowed" title="Inicie sesión para ver el perfil completo" />
    </div>
  );
}
