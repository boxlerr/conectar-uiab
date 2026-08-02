"use client";

import { Search, ShieldCheck } from "lucide-react";
import { TIPOS_ENTIDAD_META, type TipoEntidad } from "@/lib/datos/tipos-entidad";

/** Un tipo de organización con su conteo, para el facet de arriba. */
export interface ConteoTipo {
  tipo: TipoEntidad;
  count: number;
}

interface FilterSidebarProps {
  categorias: string[];
  categoriaSeleccionada: string | null;
  onCategoriaChange: (cat: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'violet' | 'teal';
  /**
   * Facet de tipo de organización. Si no se pasa, la barra queda como antes
   * (las landings por categoría ya están acotadas a un solo tipo).
   */
  tipos?: ConteoTipo[];
  tipoSeleccionado?: TipoEntidad | null;
  onTipoChange?: (tipo: TipoEntidad | null) => void;
  /** Total de organizaciones, para la opción "Todas". */
  totalTipos?: number;
}

export function FilterSidebar({
  categorias,
  categoriaSeleccionada,
  onCategoriaChange,
  searchTerm,
  onSearchChange,
  colorScheme = 'blue',
  tipos,
  tipoSeleccionado = null,
  onTipoChange,
  totalTipos = 0,
}: FilterSidebarProps) {
  // Theme variants
  const isEmerald = colorScheme === 'emerald';
  const isAmber = colorScheme === 'amber';
  const isViolet = colorScheme === 'violet';
  const isTeal = colorScheme === 'teal';
  const themeAccent = isTeal ? "bg-teal-600" : isViolet ? "bg-violet-600" : isAmber ? "bg-[#bf7035]" : isEmerald ? "bg-emerald-600" : "bg-[#10375c]";
  const themeText = isTeal ? "text-teal-700 hover:text-teal-800" : isViolet ? "text-violet-700 hover:text-violet-800" : isAmber ? "text-[#bf7035] hover:text-[#a0622c]" : isEmerald ? "text-emerald-700 hover:text-emerald-800" : "text-[#10375c] hover:text-[#0d2d4a]";
  const focusRing = isTeal ? "focus:ring-teal-500/20 group-focus-within:text-teal-600" : isViolet ? "focus:ring-violet-500/20 group-focus-within:text-violet-600" : isAmber ? "focus:ring-[#bf7035]/20 group-focus-within:text-[#bf7035]" : isEmerald ? "focus:ring-emerald-500/20 group-focus-within:text-emerald-600" : "focus:ring-[#10375c]/20 group-focus-within:text-[#10375c]";
  const activeBg = isTeal ? "bg-teal-600 shadow-teal-900/10" : isViolet ? "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-900/10" : isAmber ? "bg-gradient-to-r from-[#bf7035] to-[#d4894a] shadow-[#bf7035]/20" : isEmerald ? "bg-emerald-600 shadow-emerald-900/10" : "bg-gradient-to-r from-[#10375c] to-[#1a6496] shadow-[#10375c]/20";
  const hoverBg = isTeal ? "hover:bg-teal-50" : isViolet ? "hover:bg-violet-50" : isAmber ? "hover:bg-[#bf7035]/5" : isEmerald ? "hover:bg-emerald-50" : "hover:bg-[#10375c]/5";
  const hoverDot = isTeal ? "bg-teal-300" : isViolet ? "bg-violet-300" : isAmber ? "bg-[#d4894a]" : isEmerald ? "bg-emerald-300" : "bg-[#1a6496]";
  const badgeBg = isTeal ? "bg-teal-50/50" : isViolet ? "bg-violet-50/50" : isAmber ? "bg-[#bf7035]/5" : isEmerald ? "bg-emerald-50/50" : "bg-[#10375c]/5";
  const badgeIcon = isTeal ? "text-teal-500" : isViolet ? "text-violet-500" : isAmber ? "text-[#bf7035]" : isEmerald ? "text-emerald-500" : "text-[#10375c]";
  
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-inter flex flex-col overflow-hidden">

      {/* ── Búsqueda ── */}
      <div data-tour="directorio-buscador" className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-center space-x-2 mb-4">
          <div className={`w-1.5 h-5 rounded-sm ${themeAccent}`} />
          <h3 className="font-manrope font-extrabold text-slate-800 uppercase tracking-widest text-[11px]">
            Búsqueda Rápida
          </h3>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="Nombre, servicio, especialidad..."
            /* text-base en mobile: abajo de 16px Safari iOS hace zoom solo al enfocar. */
            className={`w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium ${focusRing}`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors ${focusRing}`} />
        </div>
      </div>

      {/* ── Tipo de organización ──
          Reemplaza a las pestañas viejas: el directorio es UNA lista y el tipo
          es un filtro. Por eso "Todas" viene seleccionado por defecto. */}
      {tipos && tipos.length > 0 && onTipoChange && (
        <div className="px-6 pt-2 pb-4 shrink-0 border-b border-slate-100">
          <div className="flex items-center space-x-2 mb-3">
            <div className={`w-1.5 h-5 rounded-sm ${themeAccent}`} />
            <h3 className="font-manrope font-extrabold text-slate-800 uppercase tracking-widest text-[11px]">
              Tipo de organización
            </h3>
          </div>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => onTipoChange(null)}
                aria-pressed={tipoSeleccionado === null}
                className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all flex justify-between items-center gap-2 ${
                  tipoSeleccionado === null
                    ? `${activeBg} text-white font-bold shadow-sm`
                    : `text-slate-600 font-medium border border-transparent hover:border-slate-200 ${hoverBg}`
                }`}
              >
                <span className="truncate">Todas</span>
                <span
                  className={`text-[11px] font-black shrink-0 ${
                    tipoSeleccionado === null ? "text-white/70" : "text-slate-400"
                  }`}
                >
                  {totalTipos}
                </span>
              </button>
            </li>
            {tipos.map(({ tipo, count }) => {
              const meta = TIPOS_ENTIDAD_META[tipo];
              const activo = tipoSeleccionado === tipo;
              return (
                <li key={tipo}>
                  <button
                    onClick={() => onTipoChange(activo ? null : tipo)}
                    aria-pressed={activo}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2 ${
                      activo
                        ? `${activeBg} text-white font-bold shadow-sm`
                        : `text-slate-600 font-medium border border-transparent hover:border-slate-200 ${hoverBg}`
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        activo ? "bg-white/80" : meta.puntoClases
                      }`}
                    />
                    <span className="truncate flex-1">{meta.etiqueta}</span>
                    <span
                      className={`text-[11px] font-black shrink-0 ${
                        activo ? "text-white/70" : "text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Header sectores ── */}
      <div className="px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-5 rounded-sm ${themeAccent}`} />
          <h3 className="font-manrope font-extrabold text-slate-800 uppercase tracking-widest text-[11px]">
            Especialidades / Sectores
          </h3>
        </div>
      </div>

      {/* ── Lista scrolleable ──
          Alto fijo en mobile/tablet: el 46vh sólo tiene sentido cuando la barra
          es un rail al costado; arriba de la grilla se comía media pantalla. */}
      <ul data-tour="directorio-categorias" className="px-4 pb-3 space-y-1 overflow-y-auto flex-1 min-h-0 max-h-56 sm:max-h-[22rem] lg:max-h-[46vh] custom-scrollbar">
        <li>
          <button
            onClick={() => onCategoriaChange(null)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-all flex justify-between items-center ${
              categoriaSeleccionada === null
                ? `${activeBg} text-white font-bold shadow-sm`
                : `text-slate-600 font-medium border border-transparent hover:border-slate-200 ${hoverBg}`
            }`}
          >
            <span>Todos los sectores</span>
            {categoriaSeleccionada === null && <div className="w-1.5 h-1.5 rounded-full bg-white/80" />}
          </button>
        </li>
        {categorias.map((cat) => (
          <li key={cat}>
            <button
              onClick={() => onCategoriaChange(cat)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-all flex justify-between items-center group ${
                categoriaSeleccionada === cat
                  ? `${activeBg} text-white font-bold shadow-sm`
                  : `text-slate-600 font-medium border border-transparent hover:border-slate-200 ${hoverBg}`
              }`}
            >
              <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              {categoriaSeleccionada === cat ? (
                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${hoverDot}`} />
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* ── Badge siempre visible ── */}
      <div className={`shrink-0 mx-4 mb-4 mt-2 flex gap-3 items-center p-3.5 rounded-lg border border-slate-100 ${badgeBg}`}>
        <ShieldCheck className={`w-7 h-7 flex-shrink-0 ${badgeIcon}`} />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
          Directorio verificado <br/>
          <span className={themeText}>Unión Industrial</span>
        </p>
      </div>

    </div>
  );
}
