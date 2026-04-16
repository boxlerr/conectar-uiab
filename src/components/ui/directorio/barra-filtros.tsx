"use client";

import { Search, ShieldCheck } from "lucide-react";

interface FilterSidebarProps {
  categorias: string[];
  categoriaSeleccionada: string | null;
  onCategoriaChange: (cat: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  colorScheme?: 'blue' | 'emerald' | 'amber';
}

export function FilterSidebar({
  categorias,
  categoriaSeleccionada,
  onCategoriaChange,
  searchTerm,
  onSearchChange,
  colorScheme = 'blue'
}: FilterSidebarProps) {
  // Theme variants
  const isEmerald = colorScheme === 'emerald';
  const isAmber = colorScheme === 'amber';
  const themeAccent = isAmber ? "bg-amber-500" : isEmerald ? "bg-emerald-600" : "bg-primary-600";
  const themeText = isAmber ? "text-amber-700 hover:text-amber-800" : isEmerald ? "text-emerald-700 hover:text-emerald-800" : "text-primary-700 hover:text-primary-800";
  const focusRing = isAmber ? "focus:ring-amber-500/20 group-focus-within:text-amber-600" : isEmerald ? "focus:ring-emerald-500/20 group-focus-within:text-emerald-600" : "focus:ring-primary-500/20 group-focus-within:text-primary-600";
  const activeBg = isAmber ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-900/10" : isEmerald ? "bg-emerald-600 shadow-emerald-900/10" : "bg-primary-600 shadow-primary-600/10";
  const hoverBg = isAmber ? "hover:bg-amber-50" : isEmerald ? "hover:bg-emerald-50" : "hover:bg-primary-50";
  const hoverDot = isAmber ? "bg-amber-300" : isEmerald ? "bg-emerald-300" : "bg-primary-300";
  const badgeBg = isAmber ? "bg-amber-50/50" : isEmerald ? "bg-emerald-50/50" : "bg-blue-50/50";
  const badgeIcon = isAmber ? "text-amber-500" : isEmerald ? "text-emerald-500" : "text-blue-500";
  
  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-28 space-y-10 font-inter">
      {/* Search Input */}
      <div>
        <div className="flex items-center space-x-2 mb-5">
          <div className={`w-1.5 h-6 rounded-sm ${themeAccent}`} />
          <h3 className="font-manrope font-extrabold text-slate-800 uppercase tracking-widest text-[11px]">
            Búsqueda Rápida
          </h3>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="Nombre, servicio, especialidad..."
            className={`w-full pl-12 pr-4 py-4 bg-[#f8fafc] border border-slate-200 rounded-lg shadow-inner text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium ${focusRing}`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors ${focusRing}`} />
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center space-x-2 mb-5">
          <div className={`w-1.5 h-6 rounded-sm ${themeAccent}`} />
          <h3 className="font-manrope font-extrabold text-slate-800 uppercase tracking-widest text-[11px]">
            Especialidades / Sectores
          </h3>
        </div>
        <ul className="space-y-1.5 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
          <li>
            <button
              onClick={() => onCategoriaChange(null)}
              className={`w-full text-left px-4 py-3 rounded-lg text-[13px] transition-all flex justify-between items-center ${
                categoriaSeleccionada === null
                  ? `${activeBg} text-white font-bold shadow-md transform scale-[1.02]`
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
                className={`w-full text-left px-4 py-3 rounded-lg text-[13px] transition-all flex justify-between items-center group ${
                  categoriaSeleccionada === cat
                    ? `${activeBg} text-white font-bold shadow-md transform scale-[1.02]`
                    : `text-slate-600 font-medium border border-transparent hover:border-slate-200 ${hoverBg}`
                }`}
              >
                <span>{cat}</span>
                {categoriaSeleccionada === cat ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${hoverDot}`} />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Trust Badge / Footer area */}
      <div className={`pt-8 border-t border-slate-100 flex gap-3 items-center p-4 rounded-xl ${badgeBg}`}>
        <ShieldCheck className={`w-8 h-8 flex-shrink-0 ${badgeIcon}`} />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
          Directorio verificado <br/> <span className={themeText}>Unión Industrial</span>
        </p>
      </div>
    </div>
  );
}
