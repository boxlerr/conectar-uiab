"use client";

import { useState, useMemo } from "react";
import { getEmpresas, getCategorias } from "@/lib/data/directorio";
import { FilterSidebar } from "@/components/ui/directorio/FilterSidebar";
import { ProfileCard } from "@/components/ui/directorio/ProfileCard";
import { PublicEmpresasLanding } from "@/components/ui/directorio/PublicEmpresasLanding";
import { Building2 } from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/AuthContext";

export default function EmpresasPage() {
  const { currentUser, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  const empresas = useMemo(() => getEmpresas(), []);
  const categorias = useMemo(() => getCategorias("empresa"), []);

  const empresasFiltradas = useMemo(() => {
    return empresas.filter((empresa) => {
      const matchCategoria = categoriaSeleccionada ? empresa.categoria === categoriaSeleccionada : true;
      const term = searchTerm.toLowerCase();
      const matchSearch = term === "" || 
        empresa.nombre.toLowerCase().includes(term) || 
        empresa.descripcionCorta.toLowerCase().includes(term) ||
        empresa.servicios.some(s => s.toLowerCase().includes(term));
      
      return matchCategoria && matchSearch;
    });
  }, [empresas, categoriaSeleccionada, searchTerm]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Public landing for unauthenticated users
  if (!currentUser) {
    return <PublicEmpresasLanding />;
  }

  // Authenticated directory view
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="bg-primary-900 text-white py-16 mb-12 -mt-24 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-800 mb-6 shadow-lg shadow-primary-900/50">
            <Building2 className="w-8 h-8 text-primary-200" />
          </div>
          <h1 className="font-poppins text-4xl md:text-5xl font-bold mb-4">Directorio de Empresas</h1>
          <p className="text-primary-200 text-lg max-w-2xl mx-auto">
            Explora las empresas radicadas en el parque industrial. Conecta con líderes del sector manufacturero y de producción.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/4">
            <FilterSidebar
              categorias={categorias}
              categoriaSeleccionada={categoriaSeleccionada}
              onCategoriaChange={setCategoriaSeleccionada}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </aside>
          
          <main className="w-full lg:w-3/4">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="font-poppins text-xl font-bold text-slate-800">
                {empresasFiltradas.length} {empresasFiltradas.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
              </h2>
            </div>
            
            {empresasFiltradas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {empresasFiltradas.map((empresa) => (
                  <ProfileCard key={empresa.id} entidad={empresa} basePath="/empresas" />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No se encontraron empresas</h3>
                <p className="text-slate-500">Intenta modificar los filtros de búsqueda o la categoría seleccionada.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setCategoriaSeleccionada(null); }}
                  className="mt-6 text-primary-600 font-semibold hover:text-primary-700"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
