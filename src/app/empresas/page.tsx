"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Entidad } from "@/lib/datos/directorio"; // Only for typing now
import {
  CategoriaSocio,
  CATEGORIAS_SOCIO_META,
  parseCategoriaSocioParam,
} from "@/lib/datos/categorias-socio";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import { PublicEmpresasLanding } from "@/components/ui/directorio/landing-empresas-publica";
import { PublicProveedoresParticularesLanding } from "@/components/ui/directorio/landing-proveedores-particulares-publica";
import { AccesoRequerido } from "@/components/ui/acceso-requerido";
import { resolverEstadoGate } from "@/components/ui/gate-suscripcion";
import { Building2, LayoutGrid, List, CheckCircle2, LockOpen, User } from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { createClient, resetClient } from "@/lib/supabase/cliente";

import { crearSlug } from "@/lib/utilidades";

// Timeout para queries browser: si Supabase cuelga (lock huérfano, red caída),
// rechazamos en Nms para que la UI muestre error en vez de skeleton infinito.
// Ante timeout, reciclamos el cliente singleton (rompe el deadlock de navigator.locks).
async function conTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, rej) => {
        timer = setTimeout(() => {
          console.error(`[empresas] TIMEOUT ${ms}ms en ${label} — reciclando cliente Supabase`);
          resetClient();
          rej(new Error(`Timeout en ${label}`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function EmpresasPage() {
  const { currentUser, loading } = useAuth();
  const searchParams = useSearchParams();
  const categoriaSocio: CategoriaSocio | null = parseCategoriaSocioParam(searchParams.get("categoria"));
  const metaSocio = categoriaSocio ? CATEGORIAS_SOCIO_META[categoriaSocio] : null;
  
  // Real Data states
  const [empresas, setEmpresas] = useState<Entidad[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  // Separamos "error de red/timeout" de "lista vacía real" — así la UI
  // muestra retry en vez de un falso "no hay empresas".
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Tabs solo aplican cuando la vista mezcla socios + particulares
  const mezclaParticulares = categoriaSocio === 'proveedores_servicios_productos';
  const [activeTab, setActiveTab] = useState<'socios' | 'particulares'>('socios');

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 600], ["0%", "50%"]);
  const headerOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Helper: ejecuta la query principal con 1 retry automático. Supabase a
  // veces tiene cold-start lento (>10s) en la primera query del Turbopack dev
  // server; un retry inmediato casi siempre la resuelve rápido.
  const ejecutarQueryDirectorio = useCallback(async () => {
    const supabase = createClient();
    let query = supabase.from('vista_directorio').select('*');

    if (categoriaSocio === 'proveedores_servicios_productos') {
      query = query.or(`categoria_socio.eq.${categoriaSocio},es_socio.eq.false`);
    } else if (categoriaSocio) {
      query = query.eq('categoria_socio', categoriaSocio);
    }

    return await conTimeout(
      (async () => await query)(),
      20000, // 20s: margen para cold-start de Supabase
      'vista_directorio'
    );
  }, [categoriaSocio]);

  // Fetch real companies from Supabase — wrapped in useCallback for reuse
  const fetchEmpresas = useCallback(async () => {
    if (!currentUser) return;

    setCargandoDatos(true);
    setErrorCarga(null);
    setEmpresas([]);
    const supabase = createClient();

    let data: any[] | null = null;
    let error: any = null;

    // Intento 1 + retry automático si el 1° falla por timeout o error de red.
    for (let intento = 1; intento <= 2; intento++) {
      try {
        const res = await ejecutarQueryDirectorio();
        data = res.data as any[] | null;
        error = res.error;
        if (!error) break; // éxito → salir del loop
      } catch (err) {
        error = err;
        if (intento === 1) {
          console.warn(`[empresas] intento ${intento} falló, reintentando con cliente fresco`);
          // resetClient ya corrió dentro de conTimeout → la próxima createClient
          // devuelve instancia nueva.
          continue;
        }
      }
    }

    if (error || !data) {
      console.error("Error fetching vista_directorio (tras retry):", error);
      setErrorCarga(
        error?.message?.includes('Timeout')
          ? 'La carga está tardando más de lo habitual. Tu conexión puede estar lenta.'
          : 'No pudimos cargar el directorio. Intentá de nuevo.'
      );
      setCargandoDatos(false);
      return;
    }

    // Obtenemos los tags/categorías manualmente porque PostgREST no suele mapear M2M en vistas
    const empresaIds = data.filter((d: any) => d.tipo_entidad === 'empresa').map((d: any) => d.id);
    const proveedorIds = data.filter((d: any) => d.tipo_entidad === 'proveedor').map((d: any) => d.id);

    // Paralelizamos carga de categorías y de reseñas (con timeout combinado)
    let resEmp: any, resProv: any, resResenas: any;
    try {
      [resEmp, resProv, resResenas] = await conTimeout(
        Promise.all([
          empresaIds.length > 0
            ? (async () => await supabase.from('empresas_categorias').select('empresa_id, categorias(nombre)').in('empresa_id', empresaIds))()
            : Promise.resolve({ data: [] }),
          proveedorIds.length > 0
            ? (async () => await supabase.from('proveedores_categorias').select('proveedor_id, categorias(nombre)').in('proveedor_id', proveedorIds))()
            : Promise.resolve({ data: [] }),
          (async () => await supabase.from('resenas').select('calificacion, empresa_resenada_id, proveedor_resenado_id').eq('estado', 'aprobada'))(),
        ]),
        10000,
        'categorías y reseñas'
      );
    } catch (err) {
      console.error("Error fetching categorías/reseñas:", err);
      // Continuamos con data vacía — no bloqueamos el render del directorio
      resEmp = { data: [] };
      resProv = { data: [] };
      resResenas = { data: [] };
    }

    const catMap = new Map();
    if (resEmp.data) {
      resEmp.data.forEach((ec: any) => {
        const current = catMap.get(ec.empresa_id) || [];
        if (ec.categorias?.nombre) current.push(ec.categorias.nombre);
        catMap.set(ec.empresa_id, current);
      });
    }
    if (resProv.data) {
      resProv.data.forEach((pc: any) => {
        const current = catMap.get(pc.proveedor_id) || [];
        if (pc.categorias?.nombre) current.push(pc.categorias.nombre);
        catMap.set(pc.proveedor_id, current);
      });
    }

    // Cálculo de promedios de reseñas
    const ratingsMap = new Map();
    if (resResenas.data) {
      resResenas.data.forEach((r: any) => {
        const id = r.empresa_resenada_id || r.proveedor_resenado_id;
        if (!id) return;
        const current = ratingsMap.get(id) || { sum: 0, count: 0 };
        current.sum += r.calificacion;
        current.count += 1;
        ratingsMap.set(id, current);
      });
    }

    const mappedData: Entidad[] = data.map((item: any) => {
      const cats = catMap.get(item.id) || [];
      const mainCat = cats.length > 0 ? cats[0] : "Industrial General";
      
      const nombre = item.razon_social || item.nombre || "Sin nombre";
      const logoUrl = item.bucket_logo && item.ruta_logo
        ? supabase.storage.from(item.bucket_logo).getPublicUrl(item.ruta_logo).data.publicUrl
        : null;

      const rData = ratingsMap.get(item.id);
      const rating = rData ? Number((rData.sum / rData.count).toFixed(1)) : undefined;

      return {
        id: item.id,
        tipo: item.tipo_entidad || (item.es_socio ? "empresa" : "proveedor"),
        slug: crearSlug(nombre),
        nombre: nombre,
        categoria: mainCat,
        descripcionCorta: item.actividad || item.descripcion_corta || "Sin descripción",
        descripcionLarga: item.actividad || item.descripcion || "",
        logo: nombre.charAt(0).toUpperCase(),
        logoUrl,
        ubicacion: `${item.localidad || ''}, ${item.direccion || ''}`.replace(/^, | ,|, $/g, ''),
        servicios: cats.slice(1),
        contacto: {
          email: item.email || "",
          telefono: item.telefono || "",
          sitioWeb: item.sitio_web || ""
        },
        esSocio: item.es_socio,
        rating,
        reviews: rData?.count
      };
    });

    setEmpresas(mappedData);
    setCargandoDatos(false);
  }, [currentUser, categoriaSocio]);

  // Fetch data on mount and handle back-navigation
  useEffect(() => {
    if (loading || !currentUser) return;
    if (currentUser.role !== 'admin' && currentUser.subscriptionEstado !== 'activa') return;

    fetchEmpresas();

    // Handle back-navigation: popstate fires when browser history changes
    const handlePopState = () => {
      fetchEmpresas();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [loading, currentUser, fetchEmpresas]);

  const empresasFiltradas = useMemo(() => {
    return empresas.filter((empresa) => {
      const matchTab = !mezclaParticulares
        ? true
        : activeTab === 'particulares'
          ? empresa.esSocio === false
          : empresa.esSocio !== false;
      const matchCategoria = categoriaSeleccionada ? empresa.categoria === categoriaSeleccionada : true;
      const term = searchTerm.toLowerCase();
      const matchSearch = term === "" ||
        empresa.nombre.toLowerCase().includes(term) ||
        empresa.descripcionCorta.toLowerCase().includes(term) ||
        empresa.servicios.some((s: string) => s.toLowerCase().includes(term));

      return matchTab && matchCategoria && matchSearch;
    });
  }, [empresas, categoriaSeleccionada, searchTerm, mezclaParticulares, activeTab]);

  const countSocios = useMemo(() => empresas.filter(e => e.esSocio !== false).length, [empresas]);
  const countParticulares = useMemo(() => empresas.filter(e => e.esSocio === false).length, [empresas]);

  // Categorías dinámicas por tab — los particulares traen sus propios sectores,
  // no mostramos los sectores de empresas cuando estamos en el tab Particulares.
  const categorias = useMemo(() => {
    const fuente = !mezclaParticulares
      ? empresas
      : activeTab === 'particulares'
        ? empresas.filter(e => e.esSocio === false)
        : empresas.filter(e => e.esSocio !== false);
    return Array.from(new Set(fuente.map(e => e.categoria))).filter(Boolean).sort();
  }, [empresas, mezclaParticulares, activeTab]);

  // Al cambiar de tab, limpiar el sector seleccionado porque probablemente
  // no existe en el nuevo conjunto de categorías.
  const handleTabChange = useCallback((tab: 'socios' | 'particulares') => {
    setActiveTab(tab);
    setCategoriaSeleccionada(null);
  }, []);

  // Solo bloqueamos si el auth aún resuelve (normalmente no pasa porque tenemos initialUser del server)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Public landing for unauthenticated users — branch by categoria
  if (!currentUser) {
    if (categoriaSocio === 'proveedores_servicios_productos') {
      return <PublicProveedoresParticularesLanding />;
    }
    return <PublicEmpresasLanding />;
  }

  // Gate: suscripción requerida para ver el directorio
  if (currentUser.role !== 'admin' && currentUser.subscriptionEstado !== 'activa') {
    return (
      <AccesoRequerido
        estado={resolverEstadoGate(currentUser.subscriptionEstado ?? null, currentUser.isMember)}
        className="min-h-screen"
      />
    );
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
          <div className={`absolute inset-0 bg-gradient-to-t ${metaSocio?.heroGradient ?? "from-[#00182e] via-[#00213f]/80 to-[#10375c]/60"} mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent opacity-90" />
        </motion.div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-12 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className={`inline-flex items-center gap-2 backdrop-blur-md rounded border px-3 py-1.5 mb-6 shadow-xl ${metaSocio?.accentBadge ?? "bg-white/10 border-white/20 text-white"}`}>
              <LockOpen className="w-4 h-4" />
              <span className="text-xs font-bold tracking-widest uppercase">
                {metaSocio?.eyebrow ?? "Acceso B2B Premium"}
              </span>
            </div>

            <h1 className="font-manrope text-4xl sm:text-5xl md:text-[3.5rem] font-black text-white leading-[1.05] tracking-tight mb-5 drop-shadow-xl">
              {metaSocio ? (
                <>
                  <span className="block text-white/90 text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2">
                    Socios UIAB
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
                    {metaSocio.nombre}
                  </span>
                </>
              ) : (
                <>
                  Ecosistema Industrial <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                    Verificado UIAB
                  </span>
                </>
              )}
            </h1>

            <p className="text-white/75 text-base md:text-lg font-medium max-w-2xl leading-relaxed">
              {metaSocio
                ? metaSocio.descripcion
                : "Explora el directorio completo. Como usuario validado, tenes acceso a los datos de contacto y expedientes técnicos de toda la red."}
            </p>

            {mezclaParticulares && (
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded px-3 py-1.5 text-sm font-semibold text-white">
                  <Building2 className="w-4 h-4 text-blue-300" />
                  Empresas socias UIAB con oferta B2B
                </span>
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded px-3 py-1.5 text-sm font-semibold text-white">
                  <User className="w-4 h-4 text-amber-300" />
                  Particulares: ingenieros, contadores, técnicos y más
                </span>
              </div>
            )}
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
              <h2 className="font-manrope text-xl font-bold text-slate-800">
                {metaSocio ? `Socios UIAB · ${metaSocio.nombreCorto}` : "Directorio Activo"}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {cargandoDatos
                  ? "Cargando..."
                  : mezclaParticulares
                    ? `${countSocios} empresas socias · ${countParticulares} particulares`
                    : `Conectando ${empresas.length} ${metaSocio?.sustantivoPlural ?? "empresas"} en la zona`}
              </p>
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

        {/* ─── Tabs (cuando la vista mezcla socios + particulares) ─── */}
        {mezclaParticulares && (
          <>
            <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
              <button
                onClick={() => handleTabChange('socios')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'socios'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Empresas socias
                {!cargandoDatos && (
                  <span className="ml-1 text-xs font-black text-slate-400">{countSocios}</span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('particulares')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'particulares'
                    ? 'bg-white text-amber-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4" />
                Particulares
                {!cargandoDatos && (
                  <span className="ml-1 text-xs font-black text-slate-400">{countParticulares}</span>
                )}
              </button>
            </div>
          </>
        )}

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Sidebar */}
          <aside className="w-full lg:w-3/12 xl:w-1/4 shrink-0">
            <div className="lg:sticky lg:top-28">
              <FilterSidebar
                categorias={categorias}
                categoriaSeleccionada={categoriaSeleccionada}
                onCategoriaChange={setCategoriaSeleccionada}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                colorScheme={mezclaParticulares && activeTab === 'particulares' ? 'amber' : 'blue'}
              />
            </div>
          </aside>
          
          {/* Main Grid Area */}
          <main className="w-full lg:w-9/12 xl:w-3/4">
            
            {/* Toolbar */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div>
                <h3 className="font-manrope text-lg font-bold text-slate-800">
                  {cargandoDatos
                    ? "Buscando..."
                    : `${empresasFiltradas.length} resultados encontrados`}
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
            {cargandoDatos ? (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                : "bg-white rounded-2xl border border-slate-200/70 overflow-hidden divide-y divide-slate-200/70"
              }>
                {Array.from({ length: viewMode === 'grid' ? 6 : 5 }).map((_, i) => (
                  viewMode === 'grid' ? (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-[280px] animate-pulse">
                      <div className="flex justify-between mb-6">
                        <div className="w-14 h-14 rounded-lg bg-slate-100" />
                        <div className="w-24 h-6 rounded bg-slate-100" />
                      </div>
                      <div className="h-5 w-3/4 bg-slate-100 rounded mb-3" />
                      <div className="h-3 w-full bg-slate-100 rounded mb-2" />
                      <div className="h-3 w-5/6 bg-slate-100 rounded mb-6" />
                      <div className="pt-5 border-t border-slate-100">
                        <div className="h-8 w-full bg-slate-50 rounded" />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="px-8 py-6 flex items-center gap-8 animate-pulse">
                      <div className="w-20 h-20 rounded-[10px] bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 bg-slate-100 rounded" />
                        <div className="h-5 w-2/3 bg-slate-100 rounded" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded" />
                      </div>
                      <div className="hidden md:block w-[170px] space-y-2">
                        <div className="h-3 w-16 bg-slate-100 rounded" />
                        <div className="h-4 w-28 bg-slate-100 rounded" />
                      </div>
                      <div className="hidden md:block w-32 h-9 rounded-full bg-slate-100" />
                    </div>
                  )
                ))}
              </div>
            ) : empresasFiltradas.length > 0 ? (
              <div
                key={viewMode}
                className={viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_32px_-12px_rgba(15,23,42,0.08)] overflow-hidden divide-y divide-slate-200/70"
                }
              >
                {empresasFiltradas.map((empresa) => (
                  <DirectoryProfileCard
                    key={empresa.id}
                    entidad={empresa}
                    basePath="/empresas"
                    variant={viewMode}
                    colorScheme="blue"
                  />
                ))}
              </div>
            ) : errorCarga ? (
              // Estado de ERROR (timeout/red): mostramos retry — distinto del
              // "lista vacía real" para no confundir al usuario.
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-20 text-center border border-amber-200 shadow-sm"
              >
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
                  <Building2 className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">No pudimos cargar el directorio</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">{errorCarga}</p>
                <button
                  onClick={() => fetchEmpresas()}
                  className="bg-primary text-white px-8 py-3.5 rounded-lg font-bold shadow-lg hover:bg-blue-800 transition-all uppercase tracking-widest text-xs"
                >
                  Reintentar
                </button>
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
