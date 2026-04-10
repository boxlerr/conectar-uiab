"use client";

import { useState, useMemo } from "react";
import { getProveedores, getCategorias } from "@/lib/data/directorio";
import { FilterSidebar } from "@/components/ui/directorio/FilterSidebar";
import { DirectoryProfileCard } from "@/components/ui/directorio/DirectoryProfileCard";
import { PublicProveedoresLanding } from "@/components/ui/directorio/PublicProveedoresLanding";
import { Wrench, LayoutGrid, List } from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/AuthContext";

export default function ProveedoresPage() {
  const { currentUser, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-16 font-inter">
      <div className="relative bg-[#00182e] py-20 mb-16 -mt-24 pt-32 overflow-hidden">
        {/* Brand Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#0b3251] to-[#00213f] opacity-95" />
        
        {/* Architectural Polish: Subtle industrial pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        {/* Decorative Light Glow */}
        <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 mb-6 opacity-80">
                <div className="w-10 h-1px bg-on-primary/30" />
                <span className="text-sm font-medium tracking-widest uppercase">Red Técnica</span>
              </div>
              <h1 className="font-manrope text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-none text-white">
                Directorio de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-blue-100 to-white">Proveedores</span>
              </h1>
              <p className="text-blue-100/60 text-xl max-w-2xl leading-relaxed font-light">
                Servicios profesionales y técnicos de alta precisión. Conecta con socios estratégicos para tu operatividad.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
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
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/10 pb-6">
              <div>
                <h2 className="font-manrope text-2xl font-bold text-on-surface">
                  {proveedoresFiltrados.length} {proveedoresFiltrados.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
                </h2>
                <p className="text-on-surface/50 text-sm mt-1">Directorio de servicios especializados bajo normativas industriales.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em]">Vista:</span>
                <div className="bg-surface-container-low p-1 rounded-sm flex gap-1 border border-outline-variant/5">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface/40 hover:text-on-surface'}`}
                    title="Vista Cuadrícula"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-sm transition-all ${viewMode === 'list' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface/40 hover:text-on-surface'}`}
                    title="Vista Listado"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {proveedoresFiltrados.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" 
                : "flex flex-col gap-3 animate-fade-in"
              }>
                {proveedoresFiltrados.map((proveedor) => (
                  <DirectoryProfileCard 
                    key={proveedor.id} 
                    entidad={proveedor} 
                    basePath="/proveedores" 
                    variant={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-low rounded-lg p-20 text-center border border-outline-variant/10">
                <div className="w-20 h-20 bg-surface-dim rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wrench className="w-10 h-10 text-on-surface/20" />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-on-surface mb-3">No se encontraron proveedores</h3>
                <p className="text-on-surface/60 max-w-sm mx-auto mb-8">
                  Ajusta los parámetros de búsqueda o explora otras especialidades técnicas.
                </p>
                <button 
                  onClick={() => { setSearchTerm(''); setCategoriaSeleccionada(null); }}
                  className="bg-primary text-on-primary px-8 py-3 rounded font-bold hover:brightness-110 transition-all uppercase text-xs tracking-widest"
                >
                  Reiniciar Búsqueda
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
