import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, BadgeCheck, Star, User } from "lucide-react";
import { Entidad } from "@/lib/datos/directorio";

interface ProfileCardProps {
  entidad: Entidad;
  basePath: string;
  variant?: 'grid' | 'list';
  colorScheme?: 'blue' | 'emerald' | 'violet' | 'amber';
}

export function DirectoryProfileCard({ entidad, basePath, variant = 'grid', colorScheme = 'blue' }: ProfileCardProps) {
  const isParticular = entidad.esSocio === false;
  const isEmerald = colorScheme === 'emerald';
  const isViolet = colorScheme === 'violet';

  const hoverText = isParticular
    ? "group-hover:text-[#bf7035]"
    : isViolet ? "group-hover:text-violet-700" : isEmerald ? "group-hover:text-emerald-700" : "group-hover:text-[#10375c]";

  const indicatorLine = isParticular
    ? "bg-gradient-to-r from-[#bf7035] to-[#d4894a]"
    : isViolet ? "bg-gradient-to-r from-violet-500 to-indigo-500" : isEmerald ? "bg-emerald-500" : "bg-gradient-to-r from-[#10375c] to-[#1a6496]";

  const bgLogo = isParticular
    ? "bg-[#bf7035]/8 text-[#bf7035]"
    : isViolet ? "bg-violet-50 text-violet-800" : isEmerald ? "bg-emerald-50 text-emerald-800" : "bg-[#10375c]/8 text-[#10375c]";

  const verifiedBg = isParticular
    ? "bg-[#bf7035] text-white"
    : isViolet ? "bg-violet-700 text-white" : isEmerald ? "bg-emerald-600 text-white" : "bg-[#10375c] text-white";

  const sectorChip = isParticular
    ? "bg-[#bf7035]/8 text-[#bf7035]"
    : isViolet ? "bg-violet-50 text-violet-700" : isEmerald ? "bg-emerald-50 text-emerald-700" : "bg-[#10375c]/8 text-[#10375c]";

  const locationBg = isParticular ? "bg-[#bf7035]/6" : "bg-[#10375c]/6";
  const locationText = isParticular ? "text-[#bf7035]" : "text-[#10375c]";
  const locationIcon = isParticular ? "text-[#bf7035]/60" : "text-[#10375c]/60";

  const actionBg = isParticular
    ? "bg-[#bf7035]" : isViolet ? "bg-violet-700" : isEmerald ? "bg-emerald-600" : "bg-[#10375c]";

  // ─── LIST VARIANT ───────────────────────────────────────────────────────────
  if (variant === 'list') {
    const accentDot = isParticular ? "bg-amber-500" : isViolet ? "bg-violet-500" : isEmerald ? "bg-emerald-500" : "bg-[#00213f]";
    const accentText = isParticular ? "text-amber-600" : isViolet ? "text-violet-600" : isEmerald ? "text-emerald-600" : "text-[#00213f]/70";
    const buttonHover = isParticular
      ? "group-hover:bg-amber-600 group-hover:border-amber-600 group-hover:text-white"
      : isViolet
        ? "group-hover:bg-violet-700 group-hover:border-violet-700 group-hover:text-white"
        : isEmerald
          ? "group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white"
          : "group-hover:bg-[#00213f] group-hover:border-[#00213f] group-hover:text-white";

    return (
      <Link
        href={`${basePath}/${entidad.slug}`}
        className="group relative block bg-white font-inter border-b border-[#191c1e]/6 last:border-b-0 transition-all duration-500 hover:bg-[#f7f9fb]"
      >
        {/* Hairline accent izquierda */}
        <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${indicatorLine} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-r-sm`} />

        <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-5 md:gap-8 px-6 md:px-8 py-5">
          {/* Logo */}
          <div className={`relative w-14 h-14 md:w-[60px] md:h-[60px] overflow-hidden flex items-center justify-center font-manrope font-black text-2xl ${bgLogo} ${
            isParticular ? "rounded-full ring-1 ring-amber-200/60" : "rounded-md"
          }`}>
            {entidad.logoUrl ? (
              <Image src={entidad.logoUrl} alt={entidad.nombre} fill className="object-cover" sizes="60px" />
            ) : (
              entidad.logo
            )}
          </div>

          {/* Identidad */}
          <div className="min-w-0 md:pr-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-block w-1 h-1 rounded-full ${accentDot}`} />
              <span className={`text-[9px] font-bold uppercase tracking-[0.22em] ${accentText}`}>
                {isParticular ? "Particular" : "Verificado UIAB"}
              </span>
              {(entidad.rating && entidad.rating > 0) ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded-[2px] text-[10px] font-black text-amber-700">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {entidad.rating.toFixed(1)}
                    {entidad.reviews && (
                      <span className="text-[9px] font-bold text-amber-500/60 border-l border-amber-200/60 pl-1.5 ml-0.5">
                        {entidad.reviews}
                      </span>
                    )}
                  </span>
                </>
              ) : null}
            </div>
            <h3 className={`font-manrope text-[17px] md:text-[19px] font-bold text-[#191c1e] leading-[1.25] tracking-tight transition-colors duration-500 line-clamp-2 break-words ${hoverText}`}>
              {entidad.nombre}
            </h3>
            <p className="text-slate-500 text-[13px] leading-relaxed font-normal line-clamp-1 mt-1">
              {entidad.descripcionCorta}
            </p>
          </div>

          {/* Metadata editorial */}
          <div className="hidden md:flex flex-col gap-2 w-[170px] lg:w-[200px] shrink-0 pl-6 lg:pl-8 border-l border-[#191c1e]/6">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.22em]">Sector</span>
              <p className="text-sm font-semibold text-[#191c1e] leading-tight mt-0.5 line-clamp-1">{entidad.categoria}</p>
            </div>
            {entidad.ubicacion && (
              <div className="flex items-start gap-1.5 text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                <span className="text-[11px] font-medium leading-tight line-clamp-1">{entidad.ubicacion}</span>
              </div>
            )}
          </div>

          {/* Acción */}
          <div className="hidden md:flex items-center shrink-0">
            <div className={`inline-flex items-center justify-center whitespace-nowrap px-5 py-2.5 text-[12px] font-semibold tracking-wide text-slate-700 rounded-sm border border-[#191c1e]/12 transition-all duration-500 ${buttonHover}`}>
              Ver expediente
              <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform duration-500 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ─── GRID VARIANT ──────────────────────────────────────────────────────────
  return (
    <Link
      href={`${basePath}/${entidad.slug}`}
      className="group relative bg-white font-inter border border-[#191c1e]/10 rounded-md flex flex-col h-full overflow-hidden transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(0,33,63,0.12)] hover:border-[#191c1e]/0"
    >
      {/* Top accent ribbon */}
      <div className={`absolute top-0 left-0 w-full h-[3px] ${indicatorLine} origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />

      {/* Header — fondo tonal levemente diferenciado */}
      <div className="bg-[#f7f9fb] px-5 pt-6 pb-5">
        <div className="flex items-start justify-between">
          {/* Logo */}
          <div className={`w-12 h-12 flex items-center justify-center font-manrope font-black text-xl overflow-hidden relative shrink-0 ${bgLogo} ${
            isParticular ? "rounded-full ring-1 ring-amber-200/60" : "rounded-md"
          }`}>
            {entidad.logoUrl ? (
              <Image src={entidad.logoUrl} alt={entidad.nombre} fill className="object-cover" sizes="48px" />
            ) : (
              entidad.logo
            )}
          </div>

          {/* Badges: verificado (solo icono) + rating */}
          <div className="flex flex-col items-end gap-1.5 ml-3">
            {/* Verificado — solo ícono */}
            <div
              className={`w-7 h-7 rounded-sm flex items-center justify-center transition-colors duration-300 ${verifiedBg}`}
              title={isParticular ? "Particular" : "Verificado UIAB"}
            >
              {isParticular
                ? <User className="w-4 h-4" />
                : <BadgeCheck className="w-4 h-4" />
              }
            </div>

            {/* Rating */}
            {(entidad.rating && entidad.rating > 0) && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="text-[10px] font-black leading-none">{entidad.rating.toFixed(1)}</span>
                {entidad.reviews && (
                  <span className="text-[9px] font-bold text-amber-500/60 border-l border-amber-200/60 pl-1 ml-0.5">
                    {entidad.reviews}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sector chip — Data Chip per design.md */}
        <div className="mt-3">
          <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-1 rounded-[2px] ${sectorChip}`}>
            {entidad.categoria}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
        <h3 className={`font-manrope text-[18px] font-extrabold text-[#191c1e] tracking-tight leading-tight mb-2 transition-colors duration-300 ${hoverText} line-clamp-2 break-words`}>
          {entidad.nombre}
        </h3>
        <p className="text-slate-500 text-[13px] leading-relaxed font-normal line-clamp-3 flex-grow">
          {entidad.descripcionCorta}
        </p>

        {/* Footer */}
        <div className="mt-4 space-y-2.5">
          {/* Servicios / categorías secundarias */}
          {entidad.servicios.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entidad.servicios.slice(0, 3).map((servicio, idx) => (
                <span key={idx} className="bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 rounded-[2px] whitespace-nowrap">
                  {servicio}
                </span>
              ))}
              {entidad.servicios.length > 3 && (
                <span className="bg-[#f2f4f6] px-2 py-0.5 text-[10px] font-bold text-slate-400 rounded-[2px]">
                  +{entidad.servicios.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Ubicación + flecha CTA — misma fila */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-sm ${locationBg}`}>
            <MapPin className={`w-3.5 h-3.5 shrink-0 ${locationIcon}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wider truncate flex-1 ${locationText}`}>
              {entidad.ubicacion || "Sin ubicación"}
            </span>
            <div className={`w-6 h-6 rounded-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 ${actionBg}`}>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
