import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Entidad } from "@/lib/data/directorio";

interface ProfileCardProps {
  entidad: Entidad;
  basePath: string; // e.g., "/empresas" or "/proveedores"
}

export function ProfileCard({ entidad, basePath }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-300 flex flex-col overflow-hidden group">
      <div className="p-6 flex-grow">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-slate-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-2xl">
            {entidad.logo}
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
            {entidad.categoria}
          </span>
        </div>
        
        <h3 className="font-poppins text-lg font-bold text-slate-900 mb-2 line-clamp-1">{entidad.nombre}</h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{entidad.descripcionCorta}</p>
        
        <div className="flex items-center text-xs text-slate-500 mb-4">
          <MapPin className="w-4 h-4 mr-1 text-slate-400 shrink-0" />
          <span className="truncate">{entidad.ubicacion}</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-auto">
          {entidad.servicios.slice(0, 2).map((servicio, idx) => (
            <span key={idx} className="inline-flex items-center rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-700/10">
              {servicio}
            </span>
          ))}
          {entidad.servicios.length > 2 && (
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
              +{entidad.servicios.length - 2}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-slate-50 group-hover:bg-primary-50 transition-colors duration-300">
        <Link href={`${basePath}/${entidad.slug}`} className="flex items-center justify-center w-full text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Ver Perfil
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
