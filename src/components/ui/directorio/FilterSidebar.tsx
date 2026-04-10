"use client";

import { Search, Filter } from "lucide-react";

interface FilterSidebarProps {
  categorias: string[];
  categoriaSeleccionada: string | null;
  onCategoriaChange: (cat: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function FilterSidebar({
  categorias,
  categoriaSeleccionada,
  onCategoriaChange,
  searchTerm,
  onSearchChange,
}: FilterSidebarProps) {
  return (
    <div className="bg-surface-container-low p-8 rounded-lg shadow-tinted sticky top-28 space-y-12 font-inter">
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-1.5 h-6 bg-primary" />
          <h3 className="font-manrope font-extrabold text-on-surface uppercase tracking-widest text-xs">
            Búsqueda Técnica
          </h3>
        </div>
        <div className="relative group">
          <input
            type="text"
            placeholder="Empresa, CIF, sector..."
            className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-transparent rounded shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-on-surface/30"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/20 group-focus-within:text-primary transition-colors" />
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-1.5 h-6 bg-primary" />
          <h3 className="font-manrope font-extrabold text-on-surface uppercase tracking-widest text-xs">
            Sectores Industriales
          </h3>
        </div>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onCategoriaChange(null)}
              className={`w-full text-left px-4 py-3 rounded text-sm transition-all flex justify-between items-center ${
                categoriaSeleccionada === null
                  ? "bg-primary text-on-primary font-bold"
                  : "text-on-surface/70 hover:bg-surface-dim hover:text-on-surface"
              }`}
            >
              <span>Todos los sectores</span>
              {categoriaSeleccionada === null && <div className="w-1 h-3 bg-on-primary/50" />}
            </button>
          </li>
          {categorias.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => onCategoriaChange(cat)}
                className={`w-full text-left px-4 py-3 rounded text-sm transition-all flex justify-between items-center ${
                  categoriaSeleccionada === cat
                    ? "bg-primary text-on-primary font-bold"
                    : "text-on-surface/70 hover:bg-surface-dim hover:text-on-surface"
                }`}
              >
                <span>{cat}</span>
                {categoriaSeleccionada === cat && <div className="w-1 h-3 bg-on-primary/50" />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-8 border-t border-outline-variant/10">
        <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em] leading-relaxed">
          Sistema de Directorio Verificado por la Unión Industrial
        </p>
      </div>
    </div>
  );
}
