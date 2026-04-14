"use client";

import { useState, useMemo, useRef } from "react";
import { getProveedores, getCategorias } from "@/lib/datos/directorio";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import { PublicProveedoresLanding } from "@/components/ui/directorio/landing-proveedores-publica";
import { Wrench, LayoutGrid, List, CheckCircle2, LockOpen } from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export default function ProveedoresPage() {
  const { currentUser, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 600], ["0%", "50%"]);
  const headerOpacity = useTransform(scrollY, [0, 400], [1, 0]);

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

  // Authenticated directory view - TECHNICAL EMERALD
  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-20">
      
      {/* ─── Premium Parallax Header ─── */}
      <div className="relative h-[48vh] min-h-[460px] flex items-center justify-center overflow-hidden -mt-24 pt-44 pb-24 mb-16">
        <motion.div style={{ y: headerY, opacity: headerOpacity }} className="absolute inset-0 z-0">
          <Image
            src="/landing/provider-hero-v3.png"
            alt="Red Técnica"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b] via-[#022c22]/80 to-[#0f766e]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#022c22] to-transparent opacity-90" />
        </motion.div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-12 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded border border-emerald-400/30 px-3 py-1.5 mb-6 shadow-xl">
              <LockOpen className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-bold text-emerald-50 tracking-widest uppercase">
                Red Técnica Desbloqueada
              </span>
            </div>
            
            <h1 className="font-manrope text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-xl">
              Profesionales & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-white">
                Expertos Validados
              </span>
            </h1>
            
            <p className="text-emerald-100/80 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Catálogo de oficios matriculados y especialistas técnicos. Como usuario activo, tienes línea directa a todos los servicios de mantenimiento e informática del partido.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* User Dashboard Value Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-emerald-900/5 border border-slate-200/60 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden -mt-24 z-20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-inner">
               <Wrench className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-manrope text-xl font-bold text-slate-800">Catálogo Técnico</h2>
              <p className="text-sm font-medium text-slate-500">Respaldando tu industria con {proveedores.length} profesionales</p>
            </div>
          </div>

          <div className="flex gap-6 relative z-10 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
               <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Matrículas validadas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
               <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Contacto B2B directo</span>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Sidebar */}
          <aside className="w-full lg:w-3/12 xl:w-1/4 shrink-0">
            <FilterSidebar
              categorias={categorias}
              categoriaSeleccionada={categoriaSeleccionada}
              onCategoriaChange={setCategoriaSeleccionada}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              colorScheme="emerald"
            />
          </aside>
          
          {/* Main Grid Area */}
          <main className="w-full lg:w-9/12 xl:w-3/4">
            
            {/* Toolbar */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div>
                <h3 className="font-manrope text-lg font-bold text-slate-800">
                  {proveedoresFiltrados.length} profesionales disponibles
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista:</span>
                <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Results */}
            {proveedoresFiltrados.length > 0 ? (
              <motion.div 
                layout
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
                }
              >
                <AnimatePresence mode="popLayout">
                  {proveedoresFiltrados.map((proveedor) => (
                    <motion.div
                      key={proveedor.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <DirectoryProfileCard 
                        entidad={proveedor} 
                        basePath="/proveedores" 
                        variant={viewMode}
                        colorScheme="emerald"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-20 text-center border border-slate-200 shadow-sm"
              >
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                  <Wrench className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">No se encontraron profesionales</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  Modifique su búsqueda o seleccione una especialidad diferente para encontrar al proveedor adecuado.
                </p>
                <button 
                  onClick={() => { setSearchTerm(''); setCategoriaSeleccionada(null); }}
                  className="bg-emerald-700 text-white px-8 py-3.5 rounded-lg font-bold shadow-lg hover:bg-emerald-800 transition-all uppercase tracking-widest text-xs"
                >
                  Restablecer
                </button>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
