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
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
      <div className="mb-8">
        <h3 className="font-poppins font-semibold text-slate-900 mb-4 flex items-center">
          <Search className="w-4 h-4 mr-2 text-slate-500" />
          Buscar
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Nombre, palabra clave..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-slate-900"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div>
        <h3 className="font-poppins font-semibold text-slate-900 mb-4 flex items-center">
          <Filter className="w-4 h-4 mr-2 text-slate-500" />
          Categorías
        </h3>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onCategoriaChange(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                categoriaSeleccionada === null
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Todas las categorías
            </button>
          </li>
          {categorias.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => onCategoriaChange(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  categoriaSeleccionada === cat
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
