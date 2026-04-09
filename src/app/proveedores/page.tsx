"use client";

import { useState, useMemo } from "react";
import { getProveedores, getCategorias } from "@/lib/data/directorio";
import { FilterSidebar } from "@/components/ui/directorio/FilterSidebar";
import { ProfileCard } from "@/components/ui/directorio/ProfileCard";
import { PublicProveedoresLanding } from "@/components/ui/directorio/PublicProveedoresLanding";
import { Wrench } from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/AuthContext";

export default function ProveedoresPage() {
  const { currentUser, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  const proveedores = useMemo(() => getProveedores(), []);
  const categorias = useMemo(() => getCategorias("proveedor"), []);

  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter((proveedor) => {
      const matchCategoria = categoriaSeleccionada ? proveedor.categoria === categoriaSeleccionada : true;
      const term = searchTerm.toLowerCase();
      const matchSearch = term === "" || 
        proveedor.nombre.toLowerCase().includes(term) || 
        proveedor.descripcionCorta.toLowerCase().includes(term) ||
        proveedor.servicios.some(s => s.toLowerCase().includes(term));
      
      return matchCategoria && matchSearch;
    });
  }, [proveedores, categoriaSeleccionada, searchTerm]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Public landing for unauthenticated users
  if (!currentUser) {
    return <PublicProveedoresLanding />;
  }

  // Authenticated directory view
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="bg-primary-900 text-white py-16 mb-12 -mt-24 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-500 mb-6 shadow-lg shadow-accent-500/30">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-poppins text-4xl md:text-5xl font-bold mb-4">Red de Proveedores</h1>
          <p className="text-primary-200 text-lg max-w-2xl mx-auto">
            Encuentre servicios profesionales, técnicos y logísticos de confianza para impulsar la operatividad de su empresa.
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
                {proveedoresFiltrados.length} {proveedoresFiltrados.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
              </h2>
            </div>
            
            {proveedoresFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {proveedoresFiltrados.map((proveedor) => (
                  <ProfileCard key={proveedor.id} entidad={proveedor} basePath="/proveedores" />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No se encontraron proveedores</h3>
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
