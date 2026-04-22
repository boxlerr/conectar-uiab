"use client";

import { Search, ShieldCheck } from "lucide-react";

interface FilterSidebarProps {
  categorias: string[];
  categoriaSeleccionada: string | null;
  onCategoriaChange: (cat: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'violet';
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
  const isViolet = colorScheme === 'violet';
  const themeAccent = isViolet ? "bg-violet-600" : isAmber ? "bg-[#bf7035]" : isEmerald ? "bg-emerald-600" : "bg-[#10375c]";
  const themeText = isViolet ? "text-violet-700 hover:text-violet-800" : isAmber ? "text-[#bf7035] hover:text-[#a0622c]" : isEmerald ? "text-emerald-700 hover:text-emerald-800" : "text-[#10375c] hover:text-[#0d2d4a]";
  const focusRing = isViolet ? "focus:ring-violet-500/20 group-focus-within:text-violet-600" : isAmber ? "focus:ring-[#bf7035]/20 group-focus-within:text-[#bf7035]" : isEmerald ? "focus:ring-emerald-500/20 group-focus-within:text-emerald-600" : "focus:ring-[#10375c]/20 group-focus-within:text-[#10375c]";
  const activeBg = isViolet ? "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-900/10" : isAmber ? "bg-gradient-to-r from-[#bf7035] to-[#d4894a] shadow-[#bf7035]/20" : isEmerald ? "bg-emerald-600 shadow-emerald-900/10" : "bg-gradient-to-r from-[#10375c] to-[#1a6496] shadow-[#10375c]/20";
  const hoverBg = isViolet ? "hover:bg-violet-50" : isAmber ? "hover:bg-[#bf7035]/5" : isEmerald ? "hover:bg-emerald-50" : "hover:bg-[#10375c]/5";
  const hoverDot = isViolet ? "bg-violet-300" : isAmber ? "bg-[#d4894a]" : isEmerald ? "bg-emerald-300" : "bg-[#1a6496]";
  const badgeBg = isViolet ? "bg-violet-50/50" : isAmber ? "bg-[#bf7035]/5" : isEmerald ? "bg-emerald-50/50" : "bg-[#10375c]/5";
  const badgeIcon = isViolet ? "text-violet-500" : isAmber ? "text-[#bf7035]" : isEmerald ? "text-emerald-500" : "text-[#10375c]";
  
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-inter flex flex-col overflow-hidden">

      {/* ── Búsqueda ── */}
      <div className="px-6 pt-6 pb-4 shrink-0">
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
            className={`w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium ${focusRing}`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors ${focusRing}`} />
        </div>
      </div>

      {/* ── Header sectores ── */}
      <div className="px-6 pt-2 pb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-5 rounded-sm ${themeAccent}`} />
          <h3 className="font-manrope font-extrabold text-slate-800 uppercase tracking-widest text-[11px]">
            Especialidades / Sectores
          </h3>
        </div>
      </div>

      {/* ── Lista scrolleable ── */}
      <ul className="px-4 pb-3 space-y-1 overflow-y-auto flex-1 min-h-0 max-h-[46vh] custom-scrollbar">
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
