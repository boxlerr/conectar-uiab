"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Entidad } from "@/lib/datos/directorio";
import { FilterSidebar } from "@/components/ui/directorio/barra-filtros";
import { DirectoryProfileCard } from "@/components/ui/directorio/tarjeta-perfil-directorio";
import { PublicEmpresasLanding } from "@/components/ui/directorio/landing-empresas-publica";
import {
  Building2,
  Wrench,
  LayoutGrid,
  List,
  CheckCircle2,
  LockOpen,
} from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/cliente";
import { crearSlug } from "@/lib/utilidades";

type Tab = "empresas" | "prestadores";

export default function DirectorioPage() {
  const { currentUser, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam === "prestadores" ? "prestadores" : "empresas"
  );

  // Empresas state
  const [empresas, setEmpresas] = useState<Entidad[]>([]);
  const [categoriasEmpresas, setCategoriasEmpresas] = useState<string[]>([]);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(true);

  // Prestadores state
  const [prestadores, setPrestadores] = useState<Entidad[]>([]);
  const [categoriasPrestadores, setCategoriasPrestadores] = useState<string[]>([]);
  const [cargandoPrestadores, setCargandoPrestadores] = useState(true);

  // Shared filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 600], ["0%", "50%"]);
  const headerOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Sync tab with URL param
  useEffect(() => {
    if (tabParam === "prestadores" && activeTab !== "prestadores") {
      setActiveTab("prestadores");
    } else if (tabParam !== "prestadores" && activeTab !== "empresas" && !tabParam) {
      setActiveTab("empresas");
    }
  }, [tabParam]);

  // Reset filters on tab change
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setCategoriaSeleccionada(null);
    const url = tab === "prestadores" ? "/directorio?tab=prestadores" : "/directorio";
    router.replace(url, { scroll: false });
  };

  // Fetch empresas
  useEffect(() => {
    async function fetchEmpresas() {
      if (!currentUser) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("empresas")
        .select(`
          id,
          razon_social,
          direccion,
          localidad,
          actividad,
          sitio_web,
          email,
          bucket_logo,
          ruta_logo,
          empresas_categorias (
            categorias (
              nombre
            )
          )
        `)
        .eq("estado", "aprobada");

      if (error || !data) {
        setCargandoEmpresas(false);
        return;
      }

      const mappedData: Entidad[] = data.map((emp: any) => {
        const cats =
          emp.empresas_categorias?.map((ec: any) => ec.categorias?.nombre) || [];
        const mainCat = cats.length > 0 ? cats[0] : "Industrial General";
        const logoUrl =
          emp.bucket_logo && emp.ruta_logo
            ? supabase.storage
                .from(emp.bucket_logo)
                .getPublicUrl(emp.ruta_logo).data.publicUrl
            : null;

        return {
          id: emp.id,
          tipo: "empresa",
          slug: crearSlug(emp.razon_social),
          nombre: emp.razon_social,
          categoria: mainCat,
          descripcionCorta: emp.actividad || "Sin descripción",
          descripcionLarga: emp.actividad || "",
          logo: emp.razon_social.charAt(0).toUpperCase(),
          logoUrl,
          ubicacion: `${emp.localidad || ""}, ${emp.direccion || ""}`.replace(
            /^, | ,|, $/g,
            ""
          ),
          servicios: cats.slice(1),
          rating: 0,
          reviews: 0,
          contacto: {
            email: emp.email || "",
            telefono: "",
            sitioWeb: emp.sitio_web || "",
          },
        };
      });

      // Fetch reseñas
      const { data: resenasData } = await supabase
        .from("resenas")
        .select("empresa_resenada_id, calificacion")
        .eq("estado", "aprobada")
        .not("empresa_resenada_id", "is", null);

      if (resenasData) {
        mappedData.forEach(emp => {
          const empResenas = resenasData.filter(r => r.empresa_resenada_id === emp.id);
          if (empResenas.length > 0) {
            emp.reviews = empResenas.length;
            emp.rating = Number((empResenas.reduce((acc, r) => acc + r.calificacion, 0) / emp.reviews).toFixed(1));
          }
        });
      }

      setEmpresas(mappedData);
      const uniqueCats = Array.from(
        new Set(mappedData.map((e) => e.categoria))
      )
        .filter(Boolean)
        .sort();
      setCategoriasEmpresas(uniqueCats);
      setCargandoEmpresas(false);
    }

    if (!loading && currentUser) {
      fetchEmpresas();
    }
  }, [currentUser, loading]);

  // Fetch prestadores
  useEffect(() => {
    async function fetchPrestadores() {
      if (!currentUser) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("proveedores")
        .select(
          "id, nombre, apellido, nombre_comercial, tipo_proveedor, email, telefono, localidad, provincia, descripcion"
        )
        .eq("estado", "aprobado");

      if (error || !data) {
        setCargandoPrestadores(false);
        return;
      }

      const mappedData: Entidad[] = data.map((p: any) => {
        const displayName =
          p.nombre_comercial ||
          [p.nombre, p.apellido].filter(Boolean).join(" ") ||
          "Sin nombre";
        const categoria = p.tipo_proveedor || "Prestador de servicios";

        return {
          id: p.id,
          tipo: "proveedor",
          slug: crearSlug(displayName),
          nombre: displayName,
          categoria,
          descripcionCorta: p.descripcion || "Prestador de servicios verificado UIAB",
          descripcionLarga: p.descripcion || "",
          logo: displayName.charAt(0).toUpperCase(),
          ubicacion: [p.localidad, p.provincia].filter(Boolean).join(", "),
          servicios: [],
          rating: 0,
          reviews: 0,
          contacto: {
            email: p.email || "",
            telefono: p.telefono || "",
            sitioWeb: "",
          },
        };
      });

      // Fetch reseñas para proveedores
      const { data: resenasData } = await supabase
        .from("resenas")
        .select("proveedor_resenado_id, calificacion")
        .eq("estado", "aprobada")
        .not("proveedor_resenado_id", "is", null);

      if (resenasData) {
        mappedData.forEach(prov => {
          const provResenas = resenasData.filter(r => r.proveedor_resenado_id === prov.id);
          if (provResenas.length > 0) {
            prov.reviews = provResenas.length;
            prov.rating = Number((provResenas.reduce((acc, r) => acc + r.calificacion, 0) / prov.reviews).toFixed(1));
          }
        });
      }

      setPrestadores(mappedData);
      const uniqueCats = Array.from(
        new Set(mappedData.map((e) => e.categoria))
      )
        .filter(Boolean)
        .sort();
      setCategoriasPrestadores(uniqueCats);
      setCargandoPrestadores(false);
    }

    if (!loading && currentUser) {
      fetchPrestadores();
    }
  }, [currentUser, loading]);

  const entidadesActivas = activeTab === "empresas" ? empresas : prestadores;
  const categoriasActivas =
    activeTab === "empresas" ? categoriasEmpresas : categoriasPrestadores;
  const cargando =
    activeTab === "empresas" ? cargandoEmpresas : cargandoPrestadores;

  const entidadesFiltradas = useMemo(() => {
    return entidadesActivas.filter((e) => {
      const matchCategoria = categoriaSeleccionada
        ? e.categoria === categoriaSeleccionada
        : true;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        term === "" ||
        e.nombre.toLowerCase().includes(term) ||
        e.descripcionCorta.toLowerCase().includes(term) ||
        e.servicios.some((s: string) => s.toLowerCase().includes(term));
      return matchCategoria && matchSearch;
    });
  }, [entidadesActivas, categoriaSeleccionada, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <PublicEmpresasLanding />;
  }

  const isEmpresas = activeTab === "empresas";
  const colorAccent = isEmpresas ? "blue" : "emerald";
  const basePath = isEmpresas ? "/empresas" : "/proveedores";

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-20">
      {/* ─── Hero Header ─── */}
      <div className="relative h-[48vh] min-h-[460px] flex items-center justify-center overflow-hidden -mt-24 pt-44 pb-24 mb-16">
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/landing/hero-industrial.png"
            alt="Directorio UIAB"
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
              Directorio UIAB <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                Verificado
              </span>
            </h1>

            <p className="text-blue-100/80 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Accedé al ecosistema completo: empresas socias, particulares y
              prestadores de servicios verificados de la red UIAB.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Dashboard Value Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-xl shadow-primary/5 border border-slate-200/60 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden -mt-24 z-20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-manrope text-xl font-bold text-slate-800">
                Directorio Activo
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {empresas.length} empresas · {prestadores.length} prestadores
              </p>
            </div>
          </div>

          <div className="flex gap-6 relative z-10 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                Contactos directos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                Perfiles verificados
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => handleTabChange("empresas")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "empresas"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Empresas
            {!cargandoEmpresas && (
              <span className="ml-1 text-xs font-black text-slate-400">
                {empresas.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("prestadores")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "prestadores"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wrench className="w-4 h-4" />
            Prestadores de servicios
            {!cargandoPrestadores && (
              <span className="ml-1 text-xs font-black text-slate-400">
                {prestadores.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Sidebar */}
          <aside className="w-full lg:w-3/12 xl:w-1/4 shrink-0">
            <FilterSidebar
              categorias={categoriasActivas}
              categoriaSeleccionada={categoriaSeleccionada}
              onCategoriaChange={setCategoriaSeleccionada}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              colorScheme={colorAccent}
            />
          </aside>

          {/* Main Grid */}
          <main className="w-full lg:w-9/12 xl:w-3/4">
            {/* Toolbar */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div>
                <h3 className="font-manrope text-lg font-bold text-slate-800">
                  {entidadesFiltradas.length}{" "}
                  {isEmpresas ? "empresas" : "prestadores"} encontrados
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Vista:
                </span>
                <div className="bg-slate-100 p-1 rounded-lg flex gap-1 border border-slate-200">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid"
                        ? `bg-white ${isEmpresas ? "text-blue-600" : "text-emerald-600"} shadow-sm`
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list"
                        ? `bg-white ${isEmpresas ? "text-blue-600" : "text-emerald-600"} shadow-sm`
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {cargando ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "bg-white rounded-2xl border border-slate-200/70 overflow-hidden divide-y divide-slate-200/70"
                }
              >
                {Array.from({ length: viewMode === "grid" ? 6 : 5 }).map(
                  (_, i) =>
                    viewMode === "grid" ? (
                      <div
                        key={i}
                        className="bg-white rounded-xl border border-slate-200 p-6 h-[280px] animate-pulse"
                      >
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
                      <div
                        key={i}
                        className="px-8 py-6 flex items-center gap-8 animate-pulse"
                      >
                        <div className="w-20 h-20 rounded-[10px] bg-slate-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 bg-slate-100 rounded" />
                          <div className="h-5 w-2/3 bg-slate-100 rounded" />
                          <div className="h-3 w-1/2 bg-slate-100 rounded" />
                        </div>
                      </div>
                    )
                )}
              </div>
            ) : entidadesFiltradas.length > 0 ? (
              <div
                key={`${viewMode}-${activeTab}`}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_32px_-12px_rgba(15,23,42,0.08)] overflow-hidden divide-y divide-slate-200/70"
                }
              >
                {entidadesFiltradas.map((entidad) => (
                  <DirectoryProfileCard
                    key={entidad.id}
                    entidad={entidad}
                    basePath={basePath}
                    variant={viewMode}
                    colorScheme={colorAccent}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-20 text-center border border-slate-200 shadow-sm"
              >
                <div
                  className={`w-24 h-24 ${isEmpresas ? "bg-blue-50 border-blue-100" : "bg-emerald-50 border-emerald-100"} rounded-full flex items-center justify-center mx-auto mb-6 border`}
                >
                  {isEmpresas ? (
                    <Building2
                      className={`w-10 h-10 ${isEmpresas ? "text-blue-300" : "text-emerald-400"}`}
                    />
                  ) : (
                    <Wrench className="w-10 h-10 text-emerald-400" />
                  )}
                </div>
                <h3 className="font-manrope text-2xl font-bold text-slate-800 mb-3">
                  No se encontraron{" "}
                  {isEmpresas ? "empresas" : "prestadores"}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  Probá ajustando los filtros o ingresando otro término de
                  búsqueda.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoriaSeleccionada(null);
                  }}
                  className={`${isEmpresas ? "bg-primary hover:bg-blue-800" : "bg-emerald-700 hover:bg-emerald-800"} text-white px-8 py-3.5 rounded-lg font-bold shadow-lg transition-all uppercase tracking-widest text-xs`}
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
