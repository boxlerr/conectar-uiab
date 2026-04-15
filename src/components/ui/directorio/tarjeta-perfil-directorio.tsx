import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, BadgeCheck, Star, User } from "lucide-react";
import { Entidad } from "@/lib/datos/directorio";

interface ProfileCardProps {
  entidad: Entidad;
  basePath: string;
  variant?: 'grid' | 'list';
  colorScheme?: 'blue' | 'emerald';
}

export function DirectoryProfileCard({ entidad, basePath, variant = 'grid', colorScheme = 'blue' }: ProfileCardProps) {
  const isParticular = entidad.esSocio === false;
  const isEmerald = colorScheme === 'emerald';

  // Particulars get a warm amber accent regardless of colorScheme
  const hoverText = isParticular
    ? "group-hover:text-amber-700"
    : isEmerald ? "group-hover:text-emerald-700" : "group-hover:text-primary";

  const glowHover = isParticular
    ? "group-hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.25)]"
    : isEmerald ? "group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]" : "group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.2)]";

  const bgLogo = isParticular
    ? "bg-amber-50 group-hover:bg-amber-100 text-amber-800"
    : isEmerald ? "bg-emerald-50 group-hover:bg-emerald-100 text-emerald-800" : "bg-slate-50 group-hover:bg-blue-50 text-primary";

  const indicatorLine = isParticular
    ? "bg-gradient-to-r from-amber-400 to-orange-400"
    : isEmerald ? "bg-emerald-500" : "bg-blue-500";

  const badgeClasses = isParticular
    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)] border-white/20"
    : isEmerald
      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] border-white/20"
      : "bg-gradient-to-tr from-[#00213f] to-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] border-white/20";

  const actionBg = isParticular
    ? "bg-amber-600"
    : isEmerald ? 'bg-emerald-600' : 'bg-primary';

  if (variant === 'list') {
    const accentDot = isParticular ? "bg-amber-500" : isEmerald ? "bg-emerald-500" : "bg-blue-500";
    const accentText = isParticular ? "text-amber-600" : isEmerald ? "text-emerald-600" : "text-blue-600";
    const buttonHover = isParticular
      ? "group-hover:bg-amber-600 group-hover:border-amber-600 group-hover:text-white"
      : isEmerald
        ? "group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white"
        : "group-hover:bg-[#00213f] group-hover:border-[#00213f] group-hover:text-white";

    return (
      <Link
        href={`${basePath}/${entidad.slug}`}
        className="group relative block bg-white font-inter border-b border-slate-200/70 last:border-b-0 transition-all duration-500 hover:bg-slate-50/40"
      >
        {/* Hairline accent izquierda */}
        <span className={`absolute left-0 top-0 bottom-0 w-px ${indicatorLine} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-5 md:gap-8 px-6 md:px-8 py-6">
          {/* Logo — marco delicado, circular for particulares */}
          <div className={`relative w-16 h-16 md:w-20 md:h-20 overflow-hidden bg-white ring-1 transition-all duration-500 group-hover:shadow-[0_6px_24px_-10px_rgba(15,23,42,0.25)] ${
            isParticular
              ? "rounded-full ring-amber-200 group-hover:ring-amber-300"
              : "rounded-[10px] ring-slate-200 group-hover:ring-slate-300"
          }`}>
            {entidad.logoUrl ? (
              <Image src={entidad.logoUrl} alt={entidad.nombre} fill className="object-cover" sizes="80px" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-manrope font-black text-2xl md:text-3xl tracking-tight ${
                isParticular
                  ? 'text-amber-700 bg-gradient-to-br from-amber-50 to-orange-50'
                  : isEmerald ? 'text-emerald-700 bg-emerald-50/60' : 'text-[#00213f] bg-slate-50'
              }`}>
                {entidad.logo}
              </div>
            )}
          </div>

          {/* Identidad */}
          <div className="min-w-0 md:pr-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-block w-1 h-1 rounded-full ${accentDot}`} />
              {isParticular ? (
                <span className={`text-[9px] font-bold uppercase tracking-[0.22em] ${accentText}`}>
                  Particular
                </span>
              ) : (
                <span className={`text-[9px] font-bold uppercase tracking-[0.22em] ${accentText}`}>
                  Verificado UIAB
                </span>
              )}
              {(entidad.rating && entidad.rating > 0) ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                    <Star className="w-3 h-3 fill-amber-500" /> {entidad.rating} ({entidad.reviews})
                  </span>
                </>
              ) : null}
            </div>
            <h3 className={`font-manrope text-[17px] md:text-[19px] font-bold text-slate-900 leading-[1.25] tracking-tight transition-colors duration-500 line-clamp-2 break-words ${hoverText}`}>
              {entidad.nombre}
            </h3>
            <p className="text-slate-500 text-[13px] leading-relaxed font-normal line-clamp-1 mt-1.5">
              {entidad.descripcionCorta}
            </p>
          </div>

          {/* Metadata editorial */}
          <div className="hidden md:flex flex-col gap-2 w-[170px] lg:w-[200px] shrink-0 pl-6 lg:pl-8 border-l border-slate-200/70">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.22em]">Sector</span>
              <p className="text-sm font-semibold text-slate-800 leading-tight mt-1 line-clamp-1">{entidad.categoria}</p>
            </div>
            {entidad.ubicacion && (
              <div className="flex items-start gap-1.5 text-slate-500 mt-1">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                <span className="text-[11px] font-medium leading-tight line-clamp-1">{entidad.ubicacion}</span>
              </div>
            )}
          </div>

          {/* Acción — ghost pill con flecha */}
          <div className="hidden md:flex items-center shrink-0">
            <div className={`inline-flex items-center justify-center whitespace-nowrap px-5 py-2.5 text-[12px] font-semibold tracking-wide text-slate-700 rounded-full border border-slate-200 transition-all duration-500 ${buttonHover}`}>
              Ver expediente
              <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform duration-500 group-hover:translate-x-1" />
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
      className={`group relative bg-white transition-all duration-500 border ${
        isParticular ? "border-amber-100/80" : "border-slate-200"
      } p-6 font-inter rounded-xl flex flex-col h-full overflow-hidden hover:-translate-y-1 hover:shadow-xl ${glowHover}`}
    >
      {/* Top indicator ribbon */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${indicatorLine} origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />

      {/* Header: Logo & Badges */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-14 h-14 flex items-center justify-center font-manrope font-black text-2xl border transition-colors duration-500 shadow-sm overflow-hidden relative shrink-0 ${
          isParticular
            ? `rounded-full border-amber-200 ${bgLogo}`
            : `rounded-lg border-slate-100 ${bgLogo}`
        }`}>
          {entidad.logoUrl ? (
            <Image src={entidad.logoUrl} alt={entidad.nombre} fill className="object-cover" sizes="56px" />
          ) : (
            entidad.logo
          )}
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          {isParticular ? (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${badgeClasses}`}>
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest shadow-sm">Particular</span>
            </div>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border ${badgeClasses}`}>
              <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest shadow-sm">Verificado</span>
            </div>
          )}
          <div className="flex gap-2">
            {(entidad.rating && entidad.rating > 0) ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {entidad.rating}
              </span>
            ) : null}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-right">
              {entidad.categoria}
            </span>
          </div>
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
        <div className={`flex items-start gap-2 mb-4 w-full px-3 py-2 rounded-md border ${
          isParticular
            ? "text-amber-700 bg-amber-50/50 border-amber-100"
            : "text-slate-600 bg-slate-50 border-slate-100"
        }`}>
          <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isParticular ? "text-amber-400" : "text-slate-400"}`} />
          <span className="text-xs font-bold uppercase tracking-wider leading-relaxed">
            {entidad.ubicacion || "Sin ubicación"}
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
      <div className={`absolute bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 z-10 shadow-lg ${actionBg}`}>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
