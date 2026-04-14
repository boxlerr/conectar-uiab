"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Entidad } from "@/lib/datos/directorio"; // Only for typing now
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import { PublicEmpresasLanding } from "@/components/ui/directorio/landing-empresas-publica";
import { Building2, LayoutGrid, List, CheckCircle2, LockOpen } from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/cliente";

import { crearSlug } from "@/lib/utilidades";

export default function EmpresasPage() {
  const { currentUser, loading } = useAuth();
  
  // Real Data states
  const [empresas, setEmpresas] = useState<Entidad[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 600], ["0%", "50%"]);
  const headerOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Fetch real companies from Supabase
  useEffect(() => {
    async function fetchEmpresas() {
      if (!currentUser) return;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          id,
          razon_social,
          direccion,
          localidad,
          actividad,
          sitio_web,
          email,
          empresas_categorias (
            categorias (
              nombre
            )
          )
        `)
        .eq('estado', 'aprobada');

      if (error || !data) {
        console.error("Error fetching empresas:", error);
        setCargandoDatos(false);
        return;
      }

      const mappedData: Entidad[] = data.map((emp: any) => {
        const cats = emp.empresas_categorias?.map((ec: any) => ec.categorias?.nombre) || [];
        const mainCat = cats.length > 0 ? cats[0] : "Industrial General";

        return {
          id: emp.id,
          tipo: "empresa",
          slug: crearSlug(emp.razon_social), // Uses friendly slug
          nombre: emp.razon_social,
          categoria: mainCat,
          descripcionCorta: emp.actividad || "Sin descripción",
          descripcionLarga: emp.actividad || "",
          logo: emp.razon_social.charAt(0).toUpperCase(),
          ubicacion: `${emp.localidad || ''}, ${emp.direccion || ''}`.replace(/^, | ,|, $/g, ''),
          servicios: cats.slice(1), 
          contacto: {
            email: emp.email || "",
            telefono: "",
            sitioWeb: emp.sitio_web || ""
          }
        };
      });

      setEmpresas(mappedData);
      
      const uniqueCats = Array.from(new Set(mappedData.map(e => e.categoria))).filter(Boolean).sort();
      setCategorias(uniqueCats);
      setCargandoDatos(false);
    }

    if (!loading && currentUser) {
      fetchEmpresas();
    }
  }, [currentUser, loading]);

  const empresasFiltradas = useMemo(() => {
    return empresas.filter((empresa) => {
      const matchCategoria = categoriaSeleccionada ? empresa.categoria === categoriaSeleccionada : true;
      const term = searchTerm.toLowerCase();
      const matchSearch = term === "" || 
        empresa.nombre.toLowerCase().includes(term) || 
        empresa.descripcionCorta.toLowerCase().includes(term) ||
        empresa.servicios.some((s: string) => s.toLowerCase().includes(term));
      
      return matchCategoria && matchSearch;
    });
  }, [empresas, categoriaSeleccionada, searchTerm]);

  if (loading || (currentUser && cargandoDatos)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Public landing for unauthenticated users
  if (!currentUser) {
    return <PublicEmpresasLanding />;
  }

  // Authenticated directory view - PREMIUM B2B
  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-20">
      
      {/* ─── Premium Parallax Header ─── */}
      <div className="relative h-[48vh] min-h-[460px] flex items-center justify-center overflow-hidden -mt-24 pt-44 pb-24 mb-16">
        <motion.div style={{ y: headerY, opacity: headerOpacity }} className="absolute inset-0 z-0">
          <Image
            src="/landing/hero-industrial.png"
            alt="Polo Industrial"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00182e] via-[#00213f]/80 to-[#10375c]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00213f] to-transparent opacity-90" />
        </motion.div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-12 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded border border-white/20 px-3 py-1.5 mb-6 shadow-xl">
              <LockOpen className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-bold text-white tracking-widest uppercase">
                Acceso B2B Premium
              </span>
            </div>
            
            <h1 className="font-manrope text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-4 drop-shadow-xl">
              Ecosistema Industrial <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                Verificado UIAB
              </span>
            </h1>
            
            <p className="text-blue-100/80 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Explora el directorio completo. Como usuario validado, tenes acceso a los datos de contacto y expedientes técnicos de toda la red.
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
          className="bg-white rounded-2xl p-6 shadow-xl shadow-primary/5 border border-slate-200/60 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden -mt-24 z-20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-inner">
               <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-manrope text-xl font-bold text-slate-800">Directorio Activo</h2>
              <p className="text-sm font-medium text-slate-500">Conectando {empresas.length} empresas en la zona</p>
            </div>
          </div>

          <div className="flex gap-6 relative z-10 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
               <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Contactos directos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
               <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Filtros técnicos</span>
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
              colorScheme="blue"
            />
          </aside>
          
          {/* Main Grid Area */}
          <main className="w-full lg:w-9/12 xl:w-3/4">
            
            {/* Toolbar */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div>
                <h3 className="font-manrope text-lg font-bold text-slate-800">
                  {empresasFiltradas.length} resultados encontados
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista:</span>
                <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Results */}
            {empresasFiltradas.length > 0 ? (
              <motion.div 
                layout
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
                }
              >
                <AnimatePresence mode="popLayout">
                  {empresasFiltradas.map((empresa) => (
                    <motion.div
                      key={empresa.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <DirectoryProfileCard 
                        entidad={empresa} 
                        basePath="/empresas" 
                        variant={viewMode}
                        colorScheme="blue"
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
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100">
                  <Building2 className="w-10 h-10 text-blue-300" />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">No se encontraron empresas</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  Pruebe ajustando los filtros de búsqueda o seleccionando una categoría diferente industrial.
                </p>
                <button 
                  onClick={() => { setSearchTerm(''); setCategoriaSeleccionada(null); }}
                  className="bg-primary text-white px-8 py-3.5 rounded-lg font-bold shadow-lg hover:bg-blue-800 transition-all uppercase tracking-widest text-xs"
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
